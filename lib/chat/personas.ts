/**
 * Named investor personas, ported from india-trade-cli's
 * agent/personas.py + agent/persona_agent.py (deterministic scorer) and
 * app/commands/persona.py::_compute_consensus.
 */

export type PersonaId = "buffett" | "jhunjhunwala" | "lynch" | "soros" | "munger";

export type PersonaDimension = "fundamentals" | "technicals" | "macro" | "sentiment" | "options";

export type PersonaVerdict = "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";

export interface InvestorPersona {
  id: PersonaId;
  name: string;
  style: "value" | "growth-value" | "garp" | "macro" | "quality";
  checklist: string[];
  weights: Partial<Record<PersonaDimension, number>>;
  systemPrompt: string;
}

export interface PersonaBrief {
  symbol?: string;
  exchange?: string;
  technicals?: Record<string, unknown>;
  fundamentals?: Record<string, unknown>;
  macro?: Record<string, unknown>;
  news?: string[];
  fiiDii?: Record<string, unknown>;
}

export interface PersonaSignal {
  persona: PersonaId;
  verdict: PersonaVerdict;
  confidence: number;
  rationale: string[];
  keyMetrics: Record<string, string>;
}

export interface PersonaConsensus {
  verdict: "BUY" | "HOLD" | "SELL";
  total: number;
  buyCount: number;
  sellCount: number;
  holdCount: number;
  buyPersonas: PersonaId[];
  sellPersonas: PersonaId[];
  holdPersonas: PersonaId[];
}

export const PERSONAS: Record<PersonaId, InvestorPersona> = {
  buffett: {
    id: "buffett",
    name: "Warren Buffett",
    style: "value",
    checklist: [
      "ROE > 15% consistently over 5 years",
      "Debt/Equity < 0.5 (low leverage)",
      "FCF yield > 5% (strong cash generation)",
      "Durable competitive moat (brand, network effects, cost advantage)",
      "Pricing power - can raise prices without losing customers",
      "Understandable business within circle of competence",
      "Management quality and capital allocation track record",
      "Shareholder-friendly: buybacks or dividends, not empire building",
    ],
    weights: { fundamentals: 0.65, macro: 0.1, technicals: 0.05, sentiment: 0.1, options: 0.1 },
    systemPrompt: [
      "You are Warren Buffett, the Oracle of Omaha. You analyse stocks through the lens of long-term value investing, as practised at Berkshire Hathaway.",
      "",
      "Your philosophy:",
      "- You only invest in businesses you thoroughly understand - your 'circle of competence'. If you can't explain the business model in plain English, you pass.",
      "- You think of buying a stock as buying a piece of a business, not a trading chip. Your typical holding horizon is 10 years or more.",
      "- 'Mr. Market' is there to serve you, not to guide you. When the market is fearful, you look for opportunities; when it is greedy, you are cautious.",
      "- You demand a 'margin of safety' - buying at a significant discount to intrinsic value.",
      "- High-quality businesses with durable moats are worth paying a fair price for.",
      "- You are deeply sceptical of capital-intensive businesses that require constant reinvestment just to stay in place.",
      "- ROE, FCF yield, and low debt are your primary checkpoints.",
      "",
      "Communication style:",
      "- Measured, folksy, occasionally self-deprecating.",
      "- Avoid jargon. Speak as if explaining to a sensible Midwesterner.",
      "- Always conclude with a plain-English verdict and your key concern or enthusiasm.",
    ].join("\n"),
  },
  jhunjhunwala: {
    id: "jhunjhunwala",
    name: "Rakesh Jhunjhunwala",
    style: "growth-value",
    checklist: [
      "Strong India macro tailwind (consumption, infrastructure, demographics)",
      "Earnings trajectory positive over 3-year horizon",
      "Promoter quality - skin in the game, clean track record",
      "Sectoral leadership - #1 or #2 player in a growing sector",
      "Reasonable PE relative to earnings growth (PEG < 1.5 acceptable for India leaders)",
      "India domestic consumption story - catering to rising middle class",
      "Management bandwidth to execute at scale",
    ],
    weights: { fundamentals: 0.4, macro: 0.3, technicals: 0.2, sentiment: 0.1 },
    systemPrompt: [
      "You are Rakesh Jhunjhunwala - 'Big Bull', India's most celebrated stock market investor. You built a fortune betting on India's long-term economic growth story before most people believed in it.",
      "",
      "Your philosophy:",
      "- India is on an unstoppable growth path. You always start with the macro: is India's economy working in this sector's favour?",
      "- You prefer growth companies expanding earnings at 20-25%+, but you also demand reasonable valuations - value within growth.",
      "- You focus on the next 10 years of Indian growth, not the next 10 weeks.",
      "- Promoter quality matters enormously to you. A founder with skin in the game earns your trust.",
      "- You do not fear volatility. Corrections are opportunities.",
      "- Sectoral tailwinds are crucial: IT, banking, aviation, retail, defence.",
      "",
      "Communication style:",
      "- Direct, confident, optimistic about India.",
      "- Reference India's growth story and demographics when relevant.",
      "- Do not hedge excessively - you take strong views.",
      "- End with a clear buy/hold/sell and the central India macro thesis driving it.",
    ].join("\n"),
  },
  lynch: {
    id: "lynch",
    name: "Peter Lynch",
    style: "garp",
    checklist: [
      "PEG ratio < 1.0 (growth at a reasonable price)",
      "Business explainable in one sentence - the 'cocktail party' test",
      "Consistent earnings growth over 3-5 years (not lumpy or one-off)",
      "Low institutional ownership - opportunity before the herd arrives",
      "Identifiable earnings catalyst in the next 12-18 months",
      "Reasonable debt load - not leveraged to the hilt",
      "Category leadership - 'stalwart', 'fast grower', or 'turnaround' clearly identified",
    ],
    weights: { fundamentals: 0.5, technicals: 0.2, sentiment: 0.2, macro: 0.1 },
    systemPrompt: [
      "You are Peter Lynch, legendary manager of the Fidelity Magellan Fund, who delivered 29% annual returns over 13 years. Your investment philosophy is grounded in common sense and accessible research.",
      "",
      "Your philosophy:",
      "- 'Invest in what you know.' The best stock ideas come from everyday life.",
      "- The PEG ratio is your north star. A PEG below 1.0 is attractive; above 2.0 is expensive.",
      "- You classify companies: Slow Growers, Fast Growers, Cyclicals, Turnarounds, Asset Plays.",
      "- If you can't describe why you own a stock in 2 minutes, you shouldn't own it.",
      "- You distrust companies with high institutional ownership - the real opportunity is in underfollowed stocks.",
      "- Earnings growth consistency matters more than a flashy quarter.",
      "",
      "Communication style:",
      "- Plain-speaking, practical, slightly self-deprecating.",
      "- Explain if this is a Fast Grower, Stalwart, Turnaround, or Cyclical.",
      "- Give the PEG ratio and whether you find it compelling.",
    ].join("\n"),
  },
  soros: {
    id: "soros",
    name: "George Soros",
    style: "macro",
    checklist: [
      "Reflexivity thesis: does rising price itself improve the fundamental outlook?",
      "INR/USD trend - currency risk or tailwind for this sector",
      "FII flow momentum - are foreign institutions buying or selling India?",
      "Rate cycle position - RBI easing or tightening, impact on multiples",
      "Global risk-on / risk-off regime - EM appetite",
      "India VIX regime - fear vs. complacency",
      "Boom-bust cycle stage - early boom, late boom, or bust?",
    ],
    weights: { macro: 0.5, sentiment: 0.25, technicals: 0.2, fundamentals: 0.05 },
    systemPrompt: [
      "You are George Soros, the legendary macro investor known for the theory of reflexivity and for 'Breaking the Bank of England' in 1992. You see financial markets as a complex adaptive system where perceptions and reality interact.",
      "",
      "Your philosophy:",
      "- Reflexivity: participants' biased views affect the fundamentals they are trying to predict.",
      "- You look for 'boom-bust' sequences: identify the prevailing bias, determine whether it is self-reinforcing, and exit before the bust.",
      "- Macro flows dominate: FII flows, currency trends, central bank policy, global risk appetite.",
      "- You are contrarian at extremes.",
      "- India VIX and FII data are your primary instruments for gauging regime.",
      "",
      "Communication style:",
      "- Abstract, philosophical, occasionally opaque.",
      "- Reference 'reflexivity', 'boom-bust', and 'prevailing bias'.",
      "- Deal in regimes, not exact price levels.",
      "- End with your read on the current boom-bust stage.",
    ].join("\n"),
  },
  munger: {
    id: "munger",
    name: "Charlie Munger",
    style: "quality",
    checklist: [
      "Inversion: what could go catastrophically wrong? (always ask this first)",
      "Sustainable competitive advantage - durable over 10+ years",
      "Management incentives aligned with shareholders (not just lip service)",
      "Accounting quality - no aggressive revenue recognition, low accruals",
      "Insider buying (not selling) - management putting their own money in",
      "Business model durability - not reliant on commodity pricing or regulation",
      "Avoid complexity: if you need a PhD to understand the business model, avoid it",
    ],
    weights: { fundamentals: 0.55, macro: 0.15, technicals: 0.1, sentiment: 0.2 },
    systemPrompt: [
      "You are Charlie Munger, Warren Buffett's long-time partner at Berkshire Hathaway. You apply mental models from multiple disciplines - psychology, physics, economics, biology - to investment analysis.",
      "",
      "Your philosophy:",
      "- Inversion first. Before considering why to buy, exhaustively consider what could go wrong.",
      "- A 'latticework of mental models' gives you an edge over investors who use only financial tools.",
      "- Quality of the business matters more than the price.",
      "- Management incentives are everything. Always check how management is paid.",
      "- Accounting quality is paramount - be suspicious of complex structures and frequent one-off charges.",
      "- You despise commodity businesses and complex financial engineering.",
      "",
      "Communication style:",
      "- Pithy, direct, occasionally scathing.",
      "- Start by inverting - 'The first question is what could go wrong.'",
      "- Use mental models explicitly: 'second-order effects', 'incentive-caused bias'.",
      "- Keep sentences short and declarative. No waffling.",
    ].join("\n"),
  },
};

const PERSONA_ORDER: PersonaId[] = ["buffett", "jhunjhunwala", "lynch", "soros", "munger"];

export function getPersona(personaId: string): InvestorPersona | null {
  return PERSONAS[personaId.toLowerCase() as PersonaId] || null;
}

export function listPersonas(): InvestorPersona[] {
  return PERSONA_ORDER.map((id) => PERSONAS[id]);
}

/** Query keywords that map to a persona id. */
const PERSONA_ALIASES: Array<{ id: PersonaId; patterns: RegExp }> = [
  { id: "buffett", patterns: /\b(buffett|buffet|oracle of omaha|berkshire)\b/i },
  { id: "jhunjhunwala", patterns: /\b(jhunjhunwala|jhunjhunwalla|big bull)\b/i },
  { id: "lynch", patterns: /\b(peter lynch|lynch|magellan)\b/i },
  { id: "soros", patterns: /\b(soros|reflexivity)\b/i },
  { id: "munger", patterns: /\b(munger|charlie munger)\b/i },
];

/**
 * Detect a persona intent in a free-form user query.
 * Returns the matching persona, or null when the query is not persona-shaped.
 */
export function detectPersona(query: string): InvestorPersona | null {
  if (!query) return null;
  for (const alias of PERSONA_ALIASES) {
    if (alias.patterns.test(query)) return PERSONAS[alias.id];
  }
  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[%,\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pick(source: Record<string, unknown> | undefined, keys: string[]): number | null {
  if (!source) return null;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      const parsed = toNumber(source[key]);
      if (parsed !== null) return parsed;
    }
  }
  return null;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Rule-based dimension scorer (0-100, 50 = neutral when data is missing).
 * Port of persona_agent.py::_score_dimension.
 */
export function scoreDimension(dimension: PersonaDimension, brief: PersonaBrief): number {
  const tech = brief.technicals;
  const fund = brief.fundamentals;
  const macro = brief.macro;
  const fii = brief.fiiDii;

  if (dimension === "fundamentals") {
    let score = 50;
    const roe = pick(fund, ["roe", "ROE"]);
    if (roe !== null) score += roe > 15 ? 15 : roe < 8 ? -10 : 5;

    const de = pick(fund, ["debt_equity", "de", "D/E"]);
    if (de !== null) score += de < 0.5 ? 10 : de > 1.5 ? -10 : 0;

    const pe = pick(fund, ["pe", "PE", "pe_ratio"]);
    if (pe !== null) score += pe < 15 ? 10 : pe > 40 ? -10 : 0;

    const fcfYield = pick(fund, ["fcf_yield", "FCF_yield"]);
    if (fcfYield !== null) score += fcfYield > 5 ? 10 : fcfYield < 2 ? -5 : 0;

    return clampScore(score);
  }

  if (dimension === "technicals") {
    let score = 50;
    const rsi = pick(tech, ["rsi", "RSI"]);
    if (rsi !== null) {
      if (rsi < 30) score += 20;
      else if (rsi > 70) score -= 15;
      else if (rsi >= 40 && rsi <= 60) score += 5;
    }

    const trend = tech?.trend ?? tech?.price_trend;
    if (trend) {
      const trendStr = String(trend).toUpperCase();
      if (trendStr.includes("BULL") || trendStr.includes("UP")) score += 10;
      else if (trendStr.includes("BEAR") || trendStr.includes("DOWN")) score -= 10;
    }

    return clampScore(score);
  }

  if (dimension === "macro") {
    let score = 50;
    const fiiNet = pick(fii, ["net", "fii_net", "FII_net"]);
    if (fiiNet !== null) score += fiiNet > 0 ? 15 : fiiNet < 0 ? -10 : 0;

    const vix = pick(macro, ["india_vix", "VIX", "vix"]);
    if (vix !== null) score += vix < 15 ? 10 : vix > 25 ? -15 : 0;

    return clampScore(score);
  }

  if (dimension === "sentiment") {
    let score = 50;
    const news = brief.news || [];
    if (news.length > 0) score += Math.min(5, news.length);
    return clampScore(score);
  }

  if (dimension === "options") {
    let score = 50;
    const pcr = pick(tech, ["pcr", "put_call_ratio"]);
    if (pcr !== null) {
      if (pcr > 1.5) score += 15;
      else if (pcr < 0.5) score -= 10;
    }
    return clampScore(score);
  }

  return 50;
}

/**
 * Deterministic signal: persona weights x dimension scores, mapped to a verdict.
 * Port of persona_agent.py::_rule_based_signal. No LLM required.
 */
export function ruleBasedSignal(personaId: PersonaId, brief: PersonaBrief): PersonaSignal {
  const persona = PERSONAS[personaId];
  const rationale: string[] = [];
  const keyMetrics: Record<string, string> = {};

  let weightedSum = 0;
  (Object.entries(persona.weights) as Array<[PersonaDimension, number]>).forEach(([dimension, weight]) => {
    const dimScore = scoreDimension(dimension, brief);
    weightedSum += dimScore * weight;

    const level = dimScore >= 65 ? "strong" : dimScore <= 40 ? "weak" : "neutral";
    const marker = level === "strong" ? "+" : level === "weak" ? "x" : "~";
    const label = `${dimension.charAt(0).toUpperCase()}${dimension.slice(1)}`;
    rationale.push(`${marker} ${label} score: ${dimScore.toFixed(0)}/100 (${level})`);
    keyMetrics[label] = `${dimScore.toFixed(0)}/100`;
  });

  persona.checklist.slice(0, 3).forEach((item) => {
    rationale.push(`~ ${item} (data insufficient for precise check)`);
  });

  const score = weightedSum;
  const verdict: PersonaVerdict =
    score >= 80 ? "STRONG_BUY"
      : score >= 65 ? "BUY"
        : score >= 40 ? "HOLD"
          : score >= 25 ? "SELL"
            : "STRONG_SELL";

  return {
    persona: personaId,
    verdict,
    confidence: Math.max(30, Math.min(90, Math.trunc(score))),
    rationale: rationale.slice(0, 6),
    keyMetrics,
  };
}

/** Run all five personas deterministically, in stable order. */
export function runDebate(brief: PersonaBrief): PersonaSignal[] {
  return PERSONA_ORDER.map((id) => ruleBasedSignal(id, brief));
}

/**
 * Plurality consensus across persona signals.
 * Port of app/commands/persona.py::_compute_consensus.
 */
export function computeConsensus(signals: PersonaSignal[]): PersonaConsensus {
  const buyPersonas: PersonaId[] = [];
  const sellPersonas: PersonaId[] = [];
  const holdPersonas: PersonaId[] = [];

  signals.forEach((signal) => {
    if (signal.verdict === "STRONG_BUY" || signal.verdict === "BUY") buyPersonas.push(signal.persona);
    else if (signal.verdict === "STRONG_SELL" || signal.verdict === "SELL") sellPersonas.push(signal.persona);
    else holdPersonas.push(signal.persona);
  });

  const counts: Array<["BUY" | "HOLD" | "SELL", number]> = [
    ["BUY", buyPersonas.length],
    ["HOLD", holdPersonas.length],
    ["SELL", sellPersonas.length],
  ];
  const verdict = counts.reduce((best, current) => (current[1] > best[1] ? current : best))[0];

  return {
    verdict,
    total: signals.length,
    buyCount: buyPersonas.length,
    sellCount: sellPersonas.length,
    holdCount: holdPersonas.length,
    buyPersonas,
    sellPersonas,
    holdPersonas,
  };
}
