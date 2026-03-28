import { Mode, Intent, FlowResult, QueryContext, ExecutionMetrics } from "./types";
import { classifyIntent, extractEntity, extractAllSymbols, isStockRelated } from "./intent";
import { buildContext, isDataSufficient, buildMultiStockContext } from "./context-builder";
import { detectEvents } from "./events";
import { buildSignals } from "./signals";
import { webSearch } from "./search";
import { generateLLMResponse, transformForMarkdown } from "./response";
import { shouldEarlyExit, isWithinBudget } from "./early-exit";
import { clearRequestCache } from "./cache";

function resolveMode(
  query: string,
  userMode: Mode | undefined,
  intent: Intent,
  entity: { symbol?: string } | null
): Mode {
  if (userMode === "pro") return "pro";
  if (userMode === "thinking") return "thinking";

  if (intent === "macro" || intent === "comparison") {
    return "pro";
  }

  if (entity?.symbol && (intent === "price" || intent === "reason")) {
    return "thinking";
  }

  if (entity?.symbol) {
    return "thinking";
  }

  return "normal";
}

function getExecutionMetrics(
  startTime: number,
  mode: Mode,
  intent: Intent,
  context: Partial<QueryContext>
): ExecutionMetrics {
  return {
    latency: Date.now() - startTime,
    apiCalls: [
      !!context.priceData,
      !!context.metrics,
      !!context.news?.length,
      !!context.searchResults?.length,
    ].filter(Boolean).length,
    searchCalls: context.searchResults?.length || 0,
    mode,
    intent,
  };
}

export async function orchestrateQuery(
  query: string,
  userMode?: Mode
): Promise<FlowResult> {
  const startTime = Date.now();
  clearRequestCache();

  const intent = classifyIntent(query);
  const allSymbols = extractAllSymbols(query);
  const entity = extractEntity(query);
  const mode = resolveMode(query, userMode, intent, entity);

  console.log(`[Orchestrator] Query: "${query.substring(0, 50)}..." | Intent: ${intent} | Mode: ${mode} | Symbols: ${JSON.stringify(allSymbols)}`);

  const earlyExit = shouldEarlyExit(query, {}, intent);
  
  console.log(`[Orchestrator] Early exit: ${earlyExit.shouldExit}, Reason: ${earlyExit.reason || "none"}`);

  let context;
  if (allSymbols.length > 1) {
    console.log(`[Orchestrator] Multiple stocks detected, building multi-stock context`);
    context = await buildMultiStockContext(query, intent, allSymbols, mode);
  } else {
    context = await buildContext(query, intent, entity, mode);
  }
  
  const multiStockData = context.multiStockData;
  const stockCount = multiStockData ? Object.keys(multiStockData).length : 0;
  console.log(`[Orchestrator] Context built - stocks: ${stockCount}, priceData: ${!!context.priceData}, metrics: ${!!context.metrics}, news: ${context.news?.length}, search: ${context.searchResults?.length}`);

  if (!isWithinBudget(startTime)) {
    console.log(`[Orchestrator] Execution budget exceeded, skipping expensive steps`);
  }

  if (!isDataSufficient(context, intent) && isWithinBudget(startTime)) {
    console.log(`[Orchestrator] Insufficient data - adding web search`);
    const searchResults = await webSearch(query, mode);
    context = {
      ...context,
      searchResults: [...(context.searchResults || []), ...searchResults],
    };
  }

  const events = detectEvents(context.news || [], context.searchResults || []);

  const metrics = getExecutionMetrics(startTime, mode, intent, context);
  console.log(`[Orchestrator] Execution metrics:`, metrics);

  const signals = buildSignals(
    context.priceData || undefined,
    context.metrics || undefined,
    context.sentiment?.overallSentiment || "neutral"
  );

  const llmResponse = await generateLLMResponse(query, context as QueryContext, signals, mode);

  const markdownContent = transformForMarkdown(llmResponse, context as QueryContext);

  const sourceStrings = llmResponse.sources.map((s) => {
    return s.title || s.type || "Unknown";
  });

  return {
    content: markdownContent,
    response: llmResponse,
    sources: sourceStrings,
    mode,
    signals,
    sentiment: context.sentiment || undefined,
    intent,
    entity: entity || null,
    context: context as QueryContext,
  };
}

export function isModeValid(mode: string | undefined): mode is Mode {
  return mode === "normal" || mode === "thinking" || mode === "pro";
}
