import { Mode } from "./router";
import { getCacheKey, getOrFetch, getTTL } from "./cache";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const EXA_API_KEY = process.env.EXA_API_KEY;

const TIMEOUT_MS = 3500;
const MAX_RESULTS = 2;

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

  const cacheKey = getCacheKey("tavily_search", { query, limit });

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const response = await withTimeout(
          fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              api_key: TAVILY_API_KEY,
              query,
              search_depth: "ultra-fast",
              topic: "finance",
              max_results: limit,
              include_answer: false,
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
      },
      getTTL("search"),
      false
    );
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

  const cacheKey = getCacheKey("exa_search", { query, limit });

  try {
    return await getOrFetch(
      cacheKey,
      async () => {
        const response = await withTimeout(
          fetch("https://api.exa.ai/search", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": EXA_API_KEY,
            },
            body: JSON.stringify({
              query,
              numResults: limit,
              type: "instant",
              category: "news",
              contents: {
                highlights: {
                  maxCharacters: 900,
                },
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
          content: Array.isArray(result.highlights)
            ? result.highlights.join(" ")
            : result.summary || result.text || "",
          source: "Exa",
        }));
      },
      getTTL("search"),
      false
    );
  } catch (error) {
    console.error("Exa search error:", error);
    return [];
  }
}

export async function webSearch(query: string, mode: Mode): Promise<SearchResult[]> {
  if (mode === "pro") {
    const [tavilyResults, exaResults] = await Promise.allSettled([
      tavilySearch(query, 3),
      exaSearch(query, 3),
    ]);

    const results = [
      ...(tavilyResults.status === "fulfilled" ? tavilyResults.value : []),
      ...(exaResults.status === "fulfilled" ? exaResults.value : []),
    ];

    const deduped = new Map<string, SearchResult>();
    for (const result of results) {
      const key = `${result.title.toLowerCase().trim()}|${result.url.trim()}`;
      if (!deduped.has(key)) deduped.set(key, result);
    }

    return Array.from(deduped.values()).slice(0, 4);
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
