
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { NORMAL_MODE_SYSTEM_PROMPT, GUARDRAIL_PROMPT } from "../prompts";
import { getFinnhubQuote, extractSymbolFromQuery } from "../aggregator";

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash",
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  maxOutputTokens: 2048,
}) as any;

export interface FlowResult {
  content: string;
  sources: string[];
  mode: "normal";
}

export async function normalFlow(query: string): Promise<FlowResult> {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let context = "";
  const sources: string[] = [];

  const symbol = extractSymbolFromQuery(query);
  if (symbol) {
    const priceData = await getFinnhubQuote(symbol);
    if (priceData) {
      context = `
Market Data for ${symbol}:
- Current Price: $${priceData.current}
- Change: $${priceData.change} (${priceData.changePercent.toFixed(2)}%)
- Day High: $${priceData.high}
- Day Low: $${priceData.low}
- Open: $${priceData.open}
- Previous Close: $${priceData.prevClose}
`;
      sources.push("Finnhub");
    }
  }

  const systemPrompt = NORMAL_MODE_SYSTEM_PROMPT.replace(
    "{currentDate}",
    currentDate
  );

  const userPrompt = context
    ? `${GUARDRAIL_PROMPT}

Context:
${context}

User Query: ${query}

Provide a helpful response based on the available data. If data is limited, be honest about it.`
    : `${GUARDRAIL_PROMPT}

User Query: ${query}

Provide a helpful response. If you don't have specific data, acknowledge the limitation.`;

  try {
    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const content = typeof response === "string" ? response : response.content;

    return {
      content: content || "I couldn't process that request.",
      sources,
      mode: "normal",
    };
  } catch (error) {
    console.error("Normal flow error:", error);
    return {
      content: "I encountered an error processing your request. Please try again.",
      sources: [],
      mode: "normal",
    };
  }
}
