import { Mode } from "./router";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const EXA_API_KEY = process.env.EXA_API_KEY;

const TIMEOUT_MS = 800;
const MAX_RESULTS = 3;

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  source: string;
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), ms)
      ),
    ]);
  } catch {
    return null;
  }
}

export async function tavilySearch(query: string, limit: number = MAX_RESULTS): Promise<SearchResult[]> {
  if (!TAVILY_API_KEY) {
    console.warn("Tavily API key not configured");
    return [];
  }

  try {
    const response = await withTimeout(
      fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query,
          search_depth: "basic",
          max_results: limit,
          include_answer: true,
          include_raw_content: false,
        }),
      }),
      TIMEOUT_MS
    );

    if (!response) {
      console.warn("Tavily request timed out");
      return [];
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.slice(0, limit).map((result: any) => ({
      title: result.title || "No title",
      url: result.url || "",
      content: result.content || result.snippet || "",
      source: "Tavily",
    }));
  } catch (error) {
    console.error("Tavily search error:", error);
    return [];
  }
}

export async function exaSearch(query: string, limit: number = MAX_RESULTS): Promise<SearchResult[]> {
  if (!EXA_API_KEY) {
    console.warn("Exa API key not configured");
    return [];
  }

  try {
    const response = await withTimeout(
      fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": EXA_API_KEY,
        },
        body: JSON.stringify({
          query,
          num_results: limit,
          type: "auto",
          highlights: {
            num_sentences: 3,
          },
        }),
      }),
      TIMEOUT_MS
    );

    if (!response) {
      console.warn("Exa request timed out");
      return [];
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.slice(0, limit).map((result: any) => ({
      title: result.title || "No title",
      url: result.url || "",
      content: result.highlight || result.summary || "",
      source: "Exa",
    }));
  } catch (error) {
    console.error("Exa search error:", error);
    return [];
  }
}

export async function webSearch(query: string, mode: Mode): Promise<SearchResult[]> {
  if (mode === "pro") {
    const tavilyResults = await tavilySearch(query, 3);
    if (tavilyResults.length > 0) {
      return tavilyResults;
    }
    return await exaSearch(query, 3);
  }

  if (mode === "thinking") {
    return await tavilySearch(query, 2);
  }

  return [];
}

export function needsMoreContext(query: string): boolean {
  const triggers = [
    "why",
    "reason",
    "impact",
    "news",
    "current",
    "latest",
    "happening",
    "effect",
    "because",
    "analysis",
  ];
  const lowerQuery = query.toLowerCase();
  return triggers.some((t) => lowerQuery.includes(t));
}

export function formatSearchResults(results: SearchResult[]): string {
  if (!results || results.length === 0) return "";

  return `\n### Recent News/Search Results:\n${results
    .map(
      (r, i) =>
        `${i + 1}. **${r.title}**\n   ${r.content.substring(0, 300)}${r.content.length > 300 ? "..." : ""}\n   Source: ${r.source}`
    )
    .join("\n\n")}`;
}
