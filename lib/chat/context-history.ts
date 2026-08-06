// Long-conversation compression via BM25, ported from
// cfa-agent-langgraph/backend/app/agent/context_engine.py:1-181.
// No embeddings: recent turns pass through untouched, older turns are
// BM25-ranked against the current query + recent window and the top
// matches are re-inserted in chronological order.

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatPair {
  user: ChatTurn;
  assistant: ChatTurn | null;
}

const RECENT_WINDOW_PAIRS = 5;
const RELEVANT_OLDER_PAIRS = 5;
const COMPRESSION_THRESHOLD_PAIRS = 10;

// Alternation assumption fixed vs the cfa original: a trailing lone user
// message (no assistant reply yet) is kept as its own pair instead of being
// silently dropped.
export function extractChatPairs(messages: ChatTurn[]): ChatPair[] {
  const pairs: ChatPair[] = [];
  let i = 0;
  while (i < messages.length) {
    if (messages[i].role !== "user") {
      i++;
      continue;
    }
    const user = messages[i];
    const assistant = messages[i + 1]?.role === "assistant" ? messages[i + 1] : null;
    pairs.push({ user, assistant });
    i += assistant ? 2 : 1;
  }
  return pairs;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function pairText(pair: ChatPair): string {
  return `${pair.user.content} ${pair.assistant?.content || ""}`;
}

// Okapi BM25, k1=1.5, b=0.75.
function bm25Scores(query: string, documents: string[]): number[] {
  const k1 = 1.5;
  const b = 0.75;

  const queryTerms = Array.from(new Set(tokenize(query)));
  const docTokens = documents.map(tokenize);
  const docLengths = docTokens.map((t) => t.length);
  const avgDocLength = docLengths.reduce((a, b2) => a + b2, 0) / (docLengths.length || 1);
  const n = documents.length;

  const df = new Map<string, number>();
  for (const term of queryTerms) {
    let count = 0;
    for (const tokens of docTokens) {
      if (tokens.includes(term)) count++;
    }
    df.set(term, count);
  }

  return docTokens.map((tokens, docIdx) => {
    let score = 0;
    const termFreq = new Map<string, number>();
    for (const t of tokens) termFreq.set(t, (termFreq.get(t) || 0) + 1);

    for (const term of queryTerms) {
      const freq = termFreq.get(term) || 0;
      if (freq === 0) continue;
      const docDf = df.get(term) || 0;
      const idf = Math.log((n - docDf + 0.5) / (docDf + 0.5) + 1);
      const denom = freq + k1 * (1 - b + (b * docLengths[docIdx]) / (avgDocLength || 1));
      score += idf * ((freq * (k1 + 1)) / (denom || 1));
    }
    return score;
  });
}

const TICKER_PATTERN = /\b[A-Z]{2,10}(?:\.NS|\.BO)?\b/g;

// Assistant turns are rendered markdown reports full of shouted words
// (BULLISH, HOLD, High/Low labels...). Without this filter the "mentioning:"
// list is dominated by report vocabulary rather than actual tickers.
const NON_TICKER_TOKENS = new Set([
  "BULLISH",
  "BEARISH",
  "NEUTRAL",
  "BUY",
  "SELL",
  "HOLD",
  "WAIT",
  "HIGH",
  "MEDIUM",
  "LOW",
  "NEWS",
  "PRICE",
  "METRICS",
  "SENTIMENT",
  "SIGNALS",
  "AI",
  "USD",
  "INR",
  "YOY",
  "TTM",
  "JSON",
  "URL",
  "OK",
]);

function summarizeOlderPairs(pairs: ChatPair[]): string {
  if (pairs.length === 0) return "";

  const tickers = new Set<string>();
  for (const pair of pairs) {
    const matches = pairText(pair).match(TICKER_PATTERN) || [];
    matches.forEach((m) => {
      if (!NON_TICKER_TOKENS.has(m)) tickers.add(m);
    });
  }

  const tickerList = Array.from(tickers).slice(0, 15).join(", ");
  return `[Earlier conversation covered ${pairs.length} exchange(s)${
    tickerList ? `, mentioning: ${tickerList}` : ""
  }]`;
}

export function packContextMessages(messages: ChatTurn[], currentQuery: string): ChatTurn[] {
  const pairs = extractChatPairs(messages);

  if (pairs.length < COMPRESSION_THRESHOLD_PAIRS) {
    return pairsToMessages(pairs);
  }

  const recentPairs = pairs.slice(-RECENT_WINDOW_PAIRS);
  const olderPairs = pairs.slice(0, pairs.length - RECENT_WINDOW_PAIRS);

  const recentText = recentPairs.map(pairText).join(" ");
  const query = `${currentQuery} ${recentText}`;

  const olderDocs = olderPairs.map(pairText);
  const scores = bm25Scores(query, olderDocs);

  const ranked = olderPairs
    .map((pair, idx) => ({ pair, idx, score: scores[idx] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, RELEVANT_OLDER_PAIRS)
    .sort((a, b) => a.idx - b.idx); // restore chronological order

  const relevantOlder = ranked.map((r) => r.pair);
  const relevantIdx = new Set(ranked.map((r) => r.idx));
  const remainingOlder = olderPairs.filter((_, idx) => !relevantIdx.has(idx));

  const summary = summarizeOlderPairs(remainingOlder);
  const summaryMessages: ChatTurn[] = summary
    ? [{ role: "assistant", content: summary }]
    : [];

  return [
    ...summaryMessages,
    ...pairsToMessages(relevantOlder),
    ...pairsToMessages(recentPairs),
  ];
}

// Stored assistant turns are the full rendered markdown report (tables, source
// lists, plans) and run into thousands of characters each. Packing them whole
// pushed the prompt well past what the fast models can absorb, so cap each
// turn — pair selection alone was not enough of a bound.
const MAX_MESSAGE_CHARS = 1200;

function truncateTurn(turn: ChatTurn): ChatTurn {
  if (turn.content.length <= MAX_MESSAGE_CHARS) return turn;
  return { role: turn.role, content: `${turn.content.slice(0, MAX_MESSAGE_CHARS)}...[truncated]` };
}

function pairsToMessages(pairs: ChatPair[]): ChatTurn[] {
  const out: ChatTurn[] = [];
  for (const pair of pairs) {
    out.push(truncateTurn(pair.user));
    if (pair.assistant) out.push(truncateTurn(pair.assistant));
  }
  return out;
}
