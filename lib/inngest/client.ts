import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "TradXpert",
  ai: { gemini: { apiKey: process.env.GEMINI_API_KEY! } },
  // Force local dev server in development to avoid ECONNREFUSED/Cloud issues
  baseUrl: process.env.NODE_ENV === "development" ? "http://127.0.0.1:8288" : undefined,
});
