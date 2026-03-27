import { NewsItem, SearchResult } from "./types";

export type EventType = 
  | "war"
  | "fed"
  | "earnings"
  | "merger"
  | "regulation"
  | "sanctions"
  | "natural_disaster"
  | "election"
  | "trade_war"
  | "pandemic"
  | "ipo"
  | "bankruptcy"
  | "scandal";

const EVENT_PATTERNS: Record<EventType, string[]> = {
  war: [
    "war",
    "conflict",
    "military",
    "invasion",
    "troops",
    "battle",
    "combat",
    "ukraine",
    "russia",
    "israel",
    "gaza",
    "iran",
  ],
  fed: [
    "federal reserve",
    "fed",
    "interest rate",
    "powell",
    "monetary policy",
    "rate hike",
    "rate cut",
    "fomc",
    "treasury yield",
    "bond yield",
  ],
  earnings: [
    "earnings",
    "quarterly",
    "revenue",
    "eps",
    "profit",
    "loss",
    "beat",
    "miss",
    "guidance",
    "outlook",
    "q1",
    "q2",
    "q3",
    "q4",
  ],
  merger: [
    "merger",
    "acquisition",
    "acquire",
    "takeover",
    "buyout",
    "m&a",
    "deal",
    "merge",
  ],
  regulation: [
    "regulation",
    "regulatory",
    "sec",
    "ftc",
    "antitrust",
    "fine",
    "lawsuit",
    "compliance",
    "probe",
    "investigation",
  ],
  sanctions: [
    "sanctions",
    "embargo",
    "ban",
    "blacklist",
    "export ban",
    "import ban",
  ],
  natural_disaster: [
    "earthquake",
    "flood",
    "hurricane",
    "tsunami",
    "wildfire",
    "disaster",
    "catastrophe",
  ],
  election: [
    "election",
    "vote",
    "voting",
    "president",
    "prime minister",
    "parliament",
    "congress",
  ],
  trade_war: [
    "tariff",
    "trade war",
    "trade deal",
    "trade agreement",
    "protectionism",
    "export",
    "import",
  ],
  pandemic: [
    "pandemic",
    "epidemic",
    "covid",
    "virus",
    "outbreak",
    "quarantine",
  ],
  ipo: [
    "ipo",
    "listing",
    "public",
    "stock market debut",
    "spac",
  ],
  bankruptcy: [
    "bankruptcy",
    "insolvent",
    "default",
    "debt restructuring",
    "chapter 11",
  ],
  scandal: [
    "scandal",
    "fraud",
    "corruption",
    "investigation",
    "lawsuit",
    "misconduct",
  ],
};

export function detectEvents(news: NewsItem[] = [], searchResults: SearchResult[] = []): EventType[] {
  const allText = [
    ...news.map((n) => `${n.headline} ${n.summary}`),
    ...searchResults.map((r) => `${r.title} ${r.content}`),
  ]
    .join(" ")
    .toLowerCase();

  const detectedEvents: Set<EventType> = new Set();

  for (const [eventType, keywords] of Object.entries(EVENT_PATTERNS)) {
    for (const keyword of keywords) {
      if (allText.includes(keyword)) {
        detectedEvents.add(eventType as EventType);
        break;
      }
    }
  }

  return Array.from(detectedEvents);
}

export function getEventImpact(event: EventType): {
  impact: "positive" | "negative" | "neutral";
  severity: "high" | "medium" | "low";
  description: string;
} {
  const impactMap: Record<EventType, { impact: "positive" | "negative" | "neutral"; severity: "high" | "medium" | "low"; description: string }> = {
    war: {
      impact: "negative",
      severity: "high",
      description: "Geopolitical instability causes market uncertainty",
    },
    fed: {
      impact: "neutral",
      severity: "high",
      description: "Federal Reserve decisions affect interest rates and liquidity",
    },
    earnings: {
      impact: "neutral",
      severity: "high",
      description: "Company performance directly affects stock price",
    },
    merger: {
      impact: "positive",
      severity: "medium",
      description: "M&A activity often creates shareholder value",
    },
    regulation: {
      impact: "negative",
      severity: "medium",
      description: "Regulatory changes can impact business operations",
    },
    sanctions: {
      impact: "negative",
      severity: "high",
      description: "Sanctions restrict market access and operations",
    },
    natural_disaster: {
      impact: "negative",
      severity: "medium",
      description: "Natural disasters cause supply chain disruptions",
    },
    election: {
      impact: "neutral",
      severity: "medium",
      description: "Elections create policy uncertainty",
    },
    trade_war: {
      impact: "negative",
      severity: "high",
      description: "Trade tensions disrupt global supply chains",
    },
    pandemic: {
      impact: "negative",
      severity: "high",
      description: "Pandemics cause economic disruption",
    },
    ipo: {
      impact: "neutral",
      severity: "low",
      description: "New listings provide investment opportunities",
    },
    bankruptcy: {
      impact: "negative",
      severity: "high",
      description: "Bankruptcy results in total value destruction",
    },
    scandal: {
      impact: "negative",
      severity: "high",
      description: "Corporate scandals damage reputation and value",
    },
  };

  return impactMap[event] || { impact: "neutral", severity: "low", description: "Unknown event" };
}

export function getEventSummary(events: EventType[]): string {
  if (events.length === 0) return "";

  const summaries = events.map((event) => {
    const { impact, severity, description } = getEventImpact(event);
    return `• ${event.toUpperCase()} (${severity}, ${impact}): ${description}`;
  });

  return `\n### 🚨 DETECTED EVENTS\n${summaries.join("\n")}`;
}
