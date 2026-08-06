// Pure-logic smoke tests for the ported analysis/chat modules.
// No test framework: run with `bun scripts/test-analysis.ts`.
// Every assertion here exercises deterministic arithmetic only — no network,
// no database, no env vars.

import { z } from "zod";

import {
  computeHRPWeights,
  computeInverseVolWeights,
  computeMeanVarianceWeights,
} from "@/lib/analysis/portfolio-optimizer";
import { computePortfolioMetrics } from "@/lib/analysis/portfolio-metrics";
import { computeIndicatorsFromSeries, type OHLCV } from "@/lib/analysis/technical-indicators";
import { computeDCF, reverseDCF } from "@/lib/analysis/dcf";
import { runMonteCarlo } from "@/lib/analysis/monte-carlo";
import { computeRiskGate } from "@/lib/analysis/risk-gate";
import { parseLLMJson } from "@/lib/chat/schemas";
import { extractAllSymbols, extractEntity } from "@/lib/chat/intent";
import { packContextMessages, type ChatTurn } from "@/lib/chat/context-history";
import {
  calculateSIPReturns,
  getStaleNavWarning,
  parseNavDate,
} from "@/lib/data/providers/mutual-fund";
import {
  mapScreenerQuote,
  detectPulseScreen,
  isPulseScreen,
} from "@/lib/data/providers/market-pulse";
import {
  cleanStatement,
  computeGrowthRates,
  extractDCFInputs,
  reportsToRawStatement,
  resolveAlias,
} from "@/lib/analysis/fundamentals";
import {
  buildInstrumentTokenMap,
  kiteExchangeOf,
  kiteTradingSymbol,
  mapKiteCandles,
  mapKiteQuote,
  toKiteInstrument,
} from "@/lib/data/providers/kite";
import {
  COST_RATES,
  buyCashRequired,
  computeEquityCurve,
  computePositions,
  computeTradeCosts,
  netQtyForSymbol,
  sellCashProceeds,
  type TradeRecord,
} from "@/lib/paper/engine";
import { decryptToken, encryptToken, getTokenKey } from "@/lib/kite/crypto";
import { describeKiteExpiry, isKiteSessionExpired, kiteSessionExpiryAt } from "@/lib/kite/expiry";

let passed = 0;
const failures: string[] = [];

function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    failures.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
    console.log(`FAIL  ${name}\n      ${err instanceof Error ? err.message : String(err)}`);
  }
}

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error(message);
}

function assertClose(actual: number, expected: number, tolerance: number, message: string) {
  assert(
    Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `${message} (expected ${expected} +/- ${tolerance}, got ${actual})`
  );
}

// ---------------------------------------------------------------- HRP

check("HRP weights sum to 1 and are non-negative (3 synthetic assets)", () => {
  const n = 60;
  const mk = (start: number, drift: number, amp: number, phase: number) =>
    Array.from({ length: n }, (_, i) => start * (1 + drift * i) + amp * Math.sin(i / 3 + phase));

  const result = computeHRPWeights({
    AAA: mk(100, 0.004, 3, 0),
    BBB: mk(50, 0.002, 4, 1.7),
    CCC: mk(200, 0.006, 6, 3.4),
  });

  assert(result !== null, "computeHRPWeights returned null for a valid 3-asset input");
  const weights = Object.values(result!.weights);
  assert(weights.length === 3, `expected 3 weights, got ${weights.length}`);
  assert(
    weights.every((w) => Number.isFinite(w) && w >= 0),
    `weights must be finite and non-negative: ${JSON.stringify(result!.weights)}`
  );
  assertClose(
    weights.reduce((a, b) => a + b, 0),
    1,
    1e-9,
    "HRP weights must sum to 1"
  );
  assert(result!.symbols.length === 3, "symbols should echo back all 3 assets");
});

check("HRP returns null for a single asset", () => {
  assert(computeHRPWeights({ AAA: [1, 2, 3, 4, 5, 6, 7] }) === null, "single asset should be rejected");
});

// ---------------------------------------------------- Technical indicators

check("RSI of a monotonically rising series is > 70", () => {
  const rows: OHLCV[] = Array.from({ length: 60 }, (_, i) => {
    const close = 100 + i;
    return {
      date: `2024-01-${String((i % 28) + 1).padStart(2, "0")}`,
      open: close - 0.5,
      high: close + 0.5,
      low: close - 1,
      close,
      volume: 100000,
    };
  });

  const indicators = computeIndicatorsFromSeries(rows);
  assert(indicators.rsi !== undefined, "rsi indicator missing");
  const rsi = indicators.rsi!.value;
  assert(rsi !== null, "rsi value is null");
  assert(rsi! > 70, `expected RSI > 70 on an all-up series, got ${rsi}`);
  assert(indicators.rsi!.signal === "bearish", `overbought RSI should read bearish, got ${indicators.rsi!.signal}`);
});

check("RSI of a monotonically falling series is < 30", () => {
  const rows: OHLCV[] = Array.from({ length: 60 }, (_, i) => {
    const close = 200 - i;
    return { date: `d${i}`, open: close, high: close + 1, low: close - 1, close, volume: 1000 };
  });
  const rsi = computeIndicatorsFromSeries(rows).rsi?.value;
  assert(rsi !== null && rsi !== undefined, "rsi value missing on falling series");
  assert(rsi! < 30, `expected RSI < 30 on an all-down series, got ${rsi}`);
});

// ---------------------------------------------------------------- DCF

check("DCF known-input snapshot: flat FCF, zero growth, 10% WACC", () => {
  // Hand computation. FCF stays at 100 every year (all growth rates are 0).
  //   PV of years 1..10 = 100 * (1 - 1.1^-10) / 0.10 = 100 * 6.1445671 = 614.45671
  //   Terminal value    = 100 * (1 + 0) / (0.10 - 0) = 1000
  //   PV(terminal)      = 1000 * 1.1^-10 = 1000 * 0.38554329 = 385.54329
  //   Enterprise value  = 614.45671 + 385.54329 = 1000 (the perpetuity identity)
  //   Equity value      = 1000 - 0 = 1000; / 10 shares = 100 per share
  const result = computeDCF({
    currentFCF: 100,
    growthRateStage1: 0,
    growthRateStage2: 0,
    terminalGrowthRate: 0,
    wacc: 10,
    netDebt: 0,
    sharesOutstanding: 10,
  });

  assert(result !== null, "computeDCF returned null for valid input");
  assert(result!.projections.length === 10, "expected a 10-year explicit projection");
  assertClose(result!.sumPVExplicit, 614.45671, 1e-3, "sum of explicit-period PVs");
  assertClose(result!.terminalValue, 1000, 1e-6, "terminal value");
  assertClose(result!.pvTerminalValue, 385.54329, 1e-3, "PV of terminal value");
  assertClose(result!.enterpriseValue, 1000, 1e-6, "enterprise value");
  assertClose(result!.equityValue, 1000, 1e-6, "equity value");
  assertClose(result!.fairValuePerShare, 100, 1e-6, "fair value per share");
});

check("DCF rejects terminal growth >= WACC", () => {
  const bad = computeDCF({
    currentFCF: 100,
    growthRateStage1: 5,
    growthRateStage2: 4,
    terminalGrowthRate: 12,
    wacc: 10,
    netDebt: 0,
    sharesOutstanding: 10,
  });
  assert(bad === null, "g >= r must return null (Gordon growth undefined)");
});

check("reverseDCF round-trips computeDCF", () => {
  const base = {
    currentFCF: 1500,
    growthRateStage2: 6,
    terminalGrowthRate: 4,
    wacc: 11.5,
    netDebt: 2000,
    sharesOutstanding: 500,
  };
  const trueGrowth = 14;

  const forward = computeDCF({ ...base, growthRateStage1: trueGrowth });
  assert(forward !== null, "forward DCF returned null");

  const implied = reverseDCF(base, forward!.fairValuePerShare);
  assert(implied !== null, "reverseDCF failed to solve for the implied growth rate");
  assertClose(implied!, trueGrowth, 0.05, "reverseDCF should recover the growth rate used forward");
});

check("reverseDCF returns null for a non-positive price", () => {
  const base = {
    currentFCF: 1000,
    growthRateStage2: 5,
    terminalGrowthRate: 4,
    wacc: 11,
    netDebt: 0,
    sharesOutstanding: 100,
  };
  assert(reverseDCF(base, 0) === null, "price of 0 should return null");
  assert(reverseDCF(base, -5) === null, "negative price should return null");
});

// -------------------------------------------------------- Monte Carlo

check("Monte Carlo with winRate=1 always profits", () => {
  const result = runMonteCarlo({
    startingCapital: 100000,
    winRate: 1,
    rewardRiskRatio: 2,
    riskPct: 0.01,
    tradeCount: 50,
    numSimulations: 100,
  });

  assertClose(result.winProbability, 1, 1e-12, "every path must end above starting capital");
  assertClose(result.ruinProbability, 0, 1e-12, "no path can be ruined when every trade wins");
  assert(
    result.finalCapitalStats.min > 100000,
    `min final capital should exceed the start, got ${result.finalCapitalStats.min}`
  );
  assertClose(result.maxDrawdownStats.worst, 0, 1e-12, "an always-winning path has no drawdown");
  // 50 trades of +2% compounding: 100000 * 1.02^50 = 269158.8
  assertClose(result.finalCapitalStats.min, 100000 * Math.pow(1.02, 50), 1e-6, "compounded final capital");
});

check("Monte Carlo with winRate=0 always loses and eventually ruins", () => {
  const result = runMonteCarlo({
    startingCapital: 100000,
    winRate: 0,
    rewardRiskRatio: 2,
    riskPct: 0.05,
    tradeCount: 100,
    numSimulations: 50,
  });
  assertClose(result.winProbability, 0, 1e-12, "no path can profit when every trade loses");
  assertClose(result.ruinProbability, 1, 1e-12, "every path should breach the 50% ruin threshold");
});

check("Monte Carlo clamps a bogus numSimulations instead of producing NaN", () => {
  const result = runMonteCarlo({
    startingCapital: 50000,
    winRate: 1,
    rewardRiskRatio: 1,
    riskPct: 0.01,
    tradeCount: 10,
    numSimulations: 0,
  });
  assert(Number.isFinite(result.finalCapitalStats.mean), "mean must be finite even with numSimulations=0");
});

// ---------------------------------------------------------- Risk gate

check("Risk gate: a PAST earnings date does NOT halve the allocation", () => {
  const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const result = computeRiskGate({
    accountCapital: 1000000,
    cashAvailable: 1000000,
    currentPrice: 100,
    earningsDate: past,
  });

  assertClose(result.maxAllocationPct, 0.1, 1e-12, "past earnings must leave the base 10% limit intact");
  assertClose(result.maxAllocationAmount, 100000, 1e-6, "max allocation amount");
  assert(result.maxShares === 1000, `expected 1000 shares, got ${result.maxShares}`);
  assert(
    !result.constraints.some((c) => c.toLowerCase().includes("earnings")),
    `no earnings constraint should be recorded: ${JSON.stringify(result.constraints)}`
  );
});

check("Risk gate: an UPCOMING earnings date within 3d DOES halve the allocation", () => {
  const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const result = computeRiskGate({
    accountCapital: 1000000,
    cashAvailable: 1000000,
    currentPrice: 100,
    earningsDate: soon,
  });
  assertClose(result.maxAllocationPct, 0.05, 1e-12, "imminent earnings should halve to 5%");
  assert(
    result.constraints.some((c) => c.toLowerCase().includes("earnings")),
    "an earnings constraint should be recorded"
  );
});

check("Risk gate: cash cap is reflected in maxAllocationPct", () => {
  const result = computeRiskGate({
    accountCapital: 1000000,
    cashAvailable: 20000,
    currentPrice: 100,
  });
  assert(result.cashConstrained, "should be flagged cash constrained");
  assertClose(result.maxAllocationAmount, 20000, 1e-6, "allocation capped at available cash");
  assertClose(result.maxAllocationPct, 0.02, 1e-12, "pct must be recomputed against the cash cap");
});

// ------------------------------------------------------- parseLLMJson

const sentimentSchema = z.object({
  sentiment: z.enum(["bullish", "bearish", "neutral"]),
  confidence: z.number(),
});
const sentimentFallback = { sentiment: "neutral" as const, confidence: 0 };

check("parseLLMJson tier 1: clean JSON", () => {
  const out = parseLLMJson('{"sentiment":"bullish","confidence":0.8}', sentimentSchema, sentimentFallback);
  assert(out.tier === "json", `expected tier "json", got "${out.tier}"`);
  assert(out.data.sentiment === "bullish", "parsed sentiment mismatch");
  assertClose(out.data.confidence, 0.8, 1e-12, "parsed confidence mismatch");
});

check("parseLLMJson tier 2: JSON inside a markdown fence", () => {
  const raw = 'Here is my analysis:\n```json\n{"sentiment":"bearish","confidence":0.42}\n```\nHope that helps.';
  const out = parseLLMJson(raw, sentimentSchema, sentimentFallback);
  assert(out.tier === "extracted", `expected tier "extracted", got "${out.tier}"`);
  assert(out.data.sentiment === "bearish", "extracted sentiment mismatch");
});

check("parseLLMJson tier 2: bare JSON object embedded in prose", () => {
  const raw = 'Sure thing. {"sentiment":"neutral","confidence":0.5} — that is my read.';
  const out = parseLLMJson(raw, sentimentSchema, sentimentFallback);
  assert(out.tier === "extracted", `expected tier "extracted", got "${out.tier}"`);
  assertClose(out.data.confidence, 0.5, 1e-12, "extracted confidence mismatch");
});

check("parseLLMJson tier 3: fallback on unparseable or schema-invalid output", () => {
  const garbage = parseLLMJson("I am afraid I cannot do that.", sentimentSchema, sentimentFallback);
  assert(garbage.tier === "fallback", `expected tier "fallback", got "${garbage.tier}"`);
  assert(garbage.data === sentimentFallback, "fallback value should be returned as-is");

  const wrongShape = parseLLMJson('{"sentiment":"euphoric","confidence":"high"}', sentimentSchema, sentimentFallback);
  assert(wrongShape.tier === "fallback", `schema-invalid JSON should fall back, got "${wrongShape.tier}"`);
});

// ------------------------------------------- BM25 packContextMessages

check("packContextMessages returns <= input and keeps the recent turns", () => {
  const messages: ChatTurn[] = [];
  for (let i = 0; i < 14; i++) {
    messages.push({ role: "user", content: `question number ${i} about topic ${i}` });
    messages.push({ role: "assistant", content: `answer number ${i} discussing topic ${i}` });
  }

  const packed = packContextMessages(messages, "tell me about topic 3");

  assert(
    packed.length <= messages.length,
    `packed length ${packed.length} must not exceed input length ${messages.length}`
  );
  assert(packed.length > 0, "packed context must not be empty");

  // The last 5 pairs (10 messages) always pass through verbatim.
  for (let i = 9; i < 14; i++) {
    assert(
      packed.some((m) => m.content === `question number ${i} about topic ${i}`),
      `recent user turn ${i} was dropped`
    );
    assert(
      packed.some((m) => m.content === `answer number ${i} discussing topic ${i}`),
      `recent assistant turn ${i} was dropped`
    );
  }

  // The BM25-relevant older pair for the query should survive too.
  assert(
    packed.some((m) => m.content.includes("topic 3")),
    "the query-relevant older turn should be retained"
  );
});

check("packContextMessages passes short conversations through untouched", () => {
  const messages: ChatTurn[] = [
    { role: "user", content: "hello" },
    { role: "assistant", content: "hi there" },
    { role: "user", content: "what about RELIANCE" },
    { role: "assistant", content: "RELIANCE looks fine" },
  ];
  const packed = packContextMessages(messages, "RELIANCE");
  assert(packed.length === 4, `short conversation should be unchanged, got ${packed.length} messages`);
  assert(packed[3].content === "RELIANCE looks fine", "last turn should be preserved verbatim");
});

// ---------------------------------------------------- SIP calculator

check("SIP calculator: flat NAV yields zero return", () => {
  // navHistory is newest-first, matching mfapi.in.
  const navHistory = Array.from({ length: 12 }, (_, i) => ({ date: `d${i}`, nav: 10 }));
  const result = calculateSIPReturns(navHistory, 1000, 12);

  assert(result !== null, "calculateSIPReturns returned null for valid input");
  assert(result!.installments === 12, `expected 12 installments, got ${result!.installments}`);
  assertClose(result!.totalInvested, 12000, 1e-9, "total invested");
  assertClose(result!.units, 1200, 1e-9, "units accumulated at a flat NAV of 10");
  assertClose(result!.currentValue, 12000, 1e-9, "current value at a flat NAV");
  assertClose(result!.absoluteReturnPct, 0, 1e-9, "flat NAV means zero return");
});

check("SIP calculator: rising NAV yields a positive return", () => {
  // Newest-first: nav 21 today down to 10 twelve months ago.
  const navHistory = Array.from({ length: 12 }, (_, i) => ({ date: `d${i}`, nav: 21 - i }));
  const result = calculateSIPReturns(navHistory, 1000, 12);
  assert(result !== null, "returned null on a rising-NAV history");
  assert(result!.absoluteReturnPct > 0, `expected a positive return, got ${result!.absoluteReturnPct}`);
  assert(result!.currentValue > result!.totalInvested, "current value should exceed the amount invested");
});

check("SIP calculator: rejects invalid inputs", () => {
  assert(calculateSIPReturns([], 1000, 12) === null, "empty history should return null");
  assert(
    calculateSIPReturns([{ date: "d", nav: 10 }], 0, 12) === null,
    "zero monthly amount should return null"
  );
  assert(
    calculateSIPReturns([{ date: "d", nav: 10 }], 1000, 0) === null,
    "zero months should return null"
  );
});

// ----------------------------------- alternative optimizers + metrics

// Two assets: A steady and low-vol, B noisy and high-vol.
function makePrices(): Record<string, number[]> {
  const a: number[] = [100];
  const b: number[] = [100];
  for (let i = 1; i < 60; i++) {
    a.push(a[i - 1] * (1 + 0.001 * (i % 3 === 0 ? -1 : 1)));
    b.push(b[i - 1] * (1 + 0.02 * (i % 2 === 0 ? -1 : 1.2)));
  }
  return { AAA: a, BBB: b };
}

check("all three optimizers return long-only weights summing to 1", () => {
  const prices = makePrices();
  const results = {
    hrp: computeHRPWeights(prices),
    inverse_vol: computeInverseVolWeights(prices),
    mean_variance: computeMeanVarianceWeights(prices),
  };

  for (const [method, result] of Object.entries(results)) {
    assert(result !== null, `${method} returned null`);
    const values = Object.values(result!.weights);
    assert(values.length === 2, `${method} should weight both symbols, got ${values.length}`);
    assert(
      values.every((w) => w >= 0 && Number.isFinite(w)),
      `${method} produced a negative or non-finite weight`
    );
    assertClose(values.reduce((x, y) => x + y, 0), 1, 1e-9, `${method} weights sum`);
  }
});

check("inverse-vol tilts toward the lower-volatility asset", () => {
  const result = computeInverseVolWeights(makePrices());
  assert(result !== null, "computeInverseVolWeights returned null");
  assert(
    result!.weights.AAA > result!.weights.BBB,
    `steady asset should carry more weight: ${JSON.stringify(result!.weights)}`
  );
});

check("optimizers reject too-short or single-asset input", () => {
  assert(computeInverseVolWeights({ AAA: [1, 2, 3, 4, 5, 6] }) === null, "single asset should be null");
  assert(
    computeMeanVarianceWeights({ AAA: [1, 2, 3], BBB: [1, 2, 3] }) === null,
    "under 5 returns should be null"
  );
});

check("portfolio metrics: constant positive returns give a huge Sharpe and no drawdown", () => {
  const constant = Array.from({ length: 60 }, () => 0.001);
  const result = computePortfolioMetrics({ AAA: 0.5, BBB: 0.5 }, { AAA: constant, BBB: constant });

  assert(result !== null, "computePortfolioMetrics returned null");
  const m = result!.metrics;
  assert(m.sharpeRatio > 1e6, `zero-volatility positive returns should blow up Sharpe, got ${m.sharpeRatio}`);
  assertClose(m.maxDrawdown, 0, 1e-12, "monotonic-up series has no drawdown");
  assert(m.annualReturn > 0, `annual return should be positive, got ${m.annualReturn}`);
  assertClose(result!.portfolioCumulative.length, 60, 1e-9, "cumulative series length");
  assertClose(result!.portfolioCumulative[0], 1.001, 1e-12, "first cumulative point");
});

check("portfolio metrics: drawdown, VaR and CVaR react to a loss", () => {
  const series = [0.01, 0.01, -0.2, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];
  const result = computePortfolioMetrics({ AAA: 1 }, { AAA: series });

  assert(result !== null, "computePortfolioMetrics returned null");
  const m = result!.metrics;
  assert(m.maxDrawdown < -0.19, `expected a ~20% drawdown, got ${m.maxDrawdown}`);
  assert(m.var95 < 0, `VaR95 should be negative with a loss present, got ${m.var95}`);
  assert(m.cvar95 <= m.var95, `CVaR95 should not exceed VaR95: ${m.cvar95} vs ${m.var95}`);
  assert(m.skewness < 0, `a single large loss should skew negative, got ${m.skewness}`);
  assert(m.calmarRatio !== 0, "Calmar should be defined when a drawdown exists");
});

check("portfolio metrics: unnormalised weights are renormalised", () => {
  const a = Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? 0.01 : -0.005));
  const b = Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? -0.01 : 0.02));
  const scaled = computePortfolioMetrics({ AAA: 2, BBB: 2 }, { AAA: a, BBB: b });
  const unit = computePortfolioMetrics({ AAA: 0.5, BBB: 0.5 }, { AAA: a, BBB: b });

  assert(scaled !== null && unit !== null, "metrics returned null");
  assertClose(scaled!.metrics.annualReturn, unit!.metrics.annualReturn, 1e-12, "annual return");
  assertClose(scaled!.metrics.maxDrawdown, unit!.metrics.maxDrawdown, 1e-12, "max drawdown");
});

// ------------------------------------------------------------ fundamentals

check("fundamentals: row aliases collapse onto canonical fields", () => {
  assert(
    resolveAlias({ "Total Revenue": {}, Revenue: {} }, "revenue") === "Total Revenue",
    "the most specific alias should win over a looser one"
  );
  assert(
    resolveAlias({ "Operating Revenue": {} }, "revenue") === "Operating Revenue",
    "Operating Revenue should resolve to revenue"
  );
  assert(
    resolveAlias({ totalRevenue: {} }, "revenue") === "totalRevenue",
    "matching should ignore case and separators"
  );
  assert(resolveAlias({ Whatever: {} }, "revenue") === null, "an unknown row should not resolve");
});

check("fundamentals: cleanStatement drops non-numeric cells and orders newest first", () => {
  const cleaned = cleanStatement({
    "Total Revenue": { "2024-03-31": "1000", "2023-12-31": 900, "2023-09-30": "None" },
    Gibberish: { "2024-03-31": "n/a" },
  });

  assert(
    cleaned.periods[0] === "2024-03-31" && cleaned.periods[2] === "2023-09-30",
    `periods should be newest first, got ${cleaned.periods.join(",")}`
  );
  assert(cleaned.rows.revenue["2024-03-31"] === 1000, "numeric strings should be parsed");
  assert(cleaned.rows.revenue["2023-09-30"] === undefined, `"None" should be dropped`);
  assert(cleaned.resolvedAliases.revenue === "Total Revenue", "the resolved alias should be recorded");
  assert(Object.keys(cleaned.rows).length === 1, "unrecognised rows should not appear");
});

check("fundamentals: QoQ and YoY growth rates", () => {
  const raw = {
    "Total Revenue": {
      "2024-03-31": 120,
      "2023-12-31": 100,
      "2023-09-30": 95,
      "2023-06-30": 90,
      "2023-03-31": 80,
    },
    "Net Income": { "2024-03-31": 10, "2023-12-31": -5 },
  };
  const growth = computeGrowthRates(cleanStatement(raw));

  assertClose(growth.revenue.qoqGrowthPct!, 20, 1e-9, "revenue QoQ");
  assertClose(growth.revenue.yoyGrowthPct!, 50, 1e-9, "revenue YoY (four quarters back)");
  // A loss base uses abs() in the denominator so a swing to profit reads positive.
  assertClose(growth.netIncome.qoqGrowthPct!, 300, 1e-9, "net income QoQ off a loss base");
  assert(growth.netIncome.yoyGrowthPct === null, "YoY should be null when the period is absent");
});

check("fundamentals: growth is null rather than infinite on a zero base", () => {
  const growth = computeGrowthRates(
    cleanStatement({ Revenue: { "2024-03-31": 50, "2023-12-31": 0 } })
  );
  assert(growth.revenue.qoqGrowthPct === null, "a zero base should yield null, not Infinity");
});

check("fundamentals: DCF inputs derived from statements", () => {
  const income = cleanStatement({ "Total Revenue": { "2024-03-31": 1000 } });
  const balance = cleanStatement({
    "Long Term Debt": { "2024-03-31": 400 },
    "Current Debt": { "2024-03-31": 100 },
    "Cash And Cash Equivalents": { "2024-03-31": 150 },
    "Ordinary Shares Number": { "2024-03-31": 250 },
  });
  const cashFlow = cleanStatement({
    "Operating Cash Flow": { "2024-03-31": 300 },
    "Capital Expenditure": { "2024-03-31": -120 },
  });

  const inputs = extractDCFInputs(income, balance, cashFlow);
  assertClose(inputs.currentFCF!, 180, 1e-9, "FCF = operating cash flow - |capex|");
  assertClose(inputs.netDebt!, 350, 1e-9, "net debt = short + long term debt - cash");
  assert(inputs.sharesOutstanding === 250, "shares outstanding should be extracted");
  assert(inputs.missing.length === 0, `nothing should be missing, got ${inputs.missing.join(",")}`);
});

check("fundamentals: DCF inputs report what could not be derived", () => {
  const inputs = extractDCFInputs(cleanStatement({}), cleanStatement({}), cleanStatement({}));
  assert(inputs.currentFCF === null && inputs.netDebt === null, "empty statements yield no values");
  assert(
    inputs.missing.includes("currentFCF") &&
      inputs.missing.includes("netDebt") &&
      inputs.missing.includes("sharesOutstanding"),
    `all three should be flagged missing, got ${inputs.missing.join(",")}`
  );
});

check("fundamentals: Alpha Vantage reports pivot into a rows-by-name statement", () => {
  const statement = reportsToRawStatement([
    { fiscalDateEnding: "2024-03-31", reportedCurrency: "INR", totalRevenue: "1000" },
    { fiscalDateEnding: "2023-03-31", reportedCurrency: "INR", totalRevenue: "800" },
  ]);

  assert(statement.reportedCurrency === undefined, "metadata keys should not become line items");
  assert(statement.totalRevenue["2024-03-31"] === "1000", "values should be keyed by period");

  const growth = computeGrowthRates(cleanStatement(statement), undefined, 1);
  assertClose(growth.revenue.yoyGrowthPct!, 25, 1e-9, "annual YoY with lag 1");
});

// ---------------------------------------------------- market pulse

check("mapScreenerQuote maps a Yahoo screener row and strips the .NS suffix", () => {
  const mapped = mapScreenerQuote({
    symbol: "RELIANCE.NS",
    shortName: "Reliance Industries",
    regularMarketPrice: 1420.5,
    regularMarketChangePercent: 2.25,
    regularMarketVolume: 8_500_000,
    marketCap: 19_200_000_000_000,
  });

  assert(mapped !== null, "valid row should map");
  assert(mapped!.symbol === "RELIANCE", `expected bare NSE symbol, got ${mapped!.symbol}`);
  assertClose(mapped!.price, 1420.5, 1e-9, "price");
  assertClose(mapped!.changePercent, 2.25, 1e-9, "change percent");
  assert(mapped!.marketCap === 19_200_000_000_000, "market cap should pass through");
});

check("mapScreenerQuote unwraps the {raw, fmt} field shape", () => {
  const mapped = mapScreenerQuote({
    symbol: "AAPL",
    longName: "Apple Inc.",
    regularMarketPrice: { raw: 210.11, fmt: "210.11" },
    regularMarketChangePercent: { raw: -1.5, fmt: "-1.50%" },
    regularMarketVolume: { raw: 42_000_000, fmt: "42M" },
  });

  assert(mapped !== null, "raw/fmt row should map");
  assertClose(mapped!.price, 210.11, 1e-9, "unwrapped price");
  assertClose(mapped!.changePercent, -1.5, 1e-9, "unwrapped change percent");
  assert(mapped!.name === "Apple Inc.", "longName should be used when shortName is absent");
  assert(mapped!.marketCap === null, "absent market cap should be null, never 0");
});

check("mapScreenerQuote rejects rows without a symbol or a price", () => {
  assert(mapScreenerQuote(null) === null, "null row should be rejected");
  assert(mapScreenerQuote({ regularMarketPrice: 10 }) === null, "row without a symbol should be rejected");
  assert(mapScreenerQuote({ symbol: "X" }) === null, "row without a price should be rejected");
  assert(
    mapScreenerQuote({ symbol: "X", regularMarketPrice: "n/a" }) === null,
    "non-numeric price should be rejected"
  );
});

check("detectPulseScreen routes market-overview phrasing to the right screen", () => {
  assert(detectPulseScreen("what are the top gainers today?") === "day_gainers", "top gainers");
  assert(detectPulseScreen("show me today's biggest losers") === "day_losers", "biggest losers");
  assert(detectPulseScreen("how is the market doing today") === "most_actives", "market overview");
  assert(detectPulseScreen("most traded stocks right now") === "most_actives", "most traded");
  assert(detectPulseScreen("what is the P/E of Reliance") === null, "single-stock query is not a pulse query");
});

check("detectPulseScreen matches the phrasings the chat e2e actually sends", () => {
  // Every one of these reached the chat pipeline with no symbol and produced no
  // pulse block before the patterns were widened.
  assert(detectPulseScreen("top gainers in the market today") === "day_gainers", "top gainers in the market today");
  assert(detectPulseScreen("top gainers today") === "day_gainers", "top gainers today");
  assert(detectPulseScreen("best performing stocks right now") === "day_gainers", "best performing stocks");
  assert(detectPulseScreen("which advancers are leading") === "day_gainers", "advancers");
  assert(detectPulseScreen("what stocks are up today") === "day_gainers", "stocks are up today");

  assert(detectPulseScreen("biggest losers") === "day_losers", "biggest losers");
  assert(detectPulseScreen("worst performers today") === "day_losers", "worst performers");
  assert(detectPulseScreen("show me the decliners") === "day_losers", "decliners");
  assert(detectPulseScreen("what stocks are down today") === "day_losers", "stocks are down today");

  assert(detectPulseScreen("most active stocks") === "most_actives", "most active stocks");
  assert(detectPulseScreen("volume leaders today") === "most_actives", "volume leaders");
  assert(detectPulseScreen("what's moving in the market") === "most_actives", "what's moving");
  assert(detectPulseScreen("market snapshot please") === "most_actives", "market snapshot");
});

check("detectPulseScreen leaves non-screener queries alone", () => {
  assert(detectPulseScreen("should i buy AAPL before earnings") === null, "single-stock buy question");
  assert(detectPulseScreen("explain what a stop loss order is") === null, "definition question");
  assert(detectPulseScreen("how did my portfolio perform this year") === null, "portfolio question");
});

check("isPulseScreen accepts only the three supported screens", () => {
  assert(isPulseScreen("day_gainers"), "day_gainers is valid");
  assert(!isPulseScreen("day_winners"), "unknown screen should be rejected");
  assert(!isPulseScreen(undefined), "undefined should be rejected");
});

check("extractAllSymbols does not turn English words into tickers", () => {
  assert(!extractAllSymbols("should i buy now").includes("NOW"), "'buy now' must not yield NOW");
  assert(!extractAllSymbols("what is nvda doing right now").includes("NOW"), "'right now' must not yield NOW");
  assert(!extractAllSymbols("is it all worth it").includes("ALL"), "'all' must not yield ALL");
  assert(!extractAllSymbols("net profit growth").includes("NET"), "'net' must not yield NET");
});

check("extractAllSymbols honours explicit ticker signals", () => {
  assert(extractAllSymbols("NOW stock").includes("NOW"), "uppercase NOW is ServiceNow");
  assert(extractAllSymbols("$now earnings").includes("NOW"), "$-prefixed now is ServiceNow");
  assert(extractAllSymbols("price of AAPL").includes("AAPL"), "AAPL should still resolve");
  assert(extractAllSymbols("apple stock").includes("AAPL"), "company names should still resolve");
});

check("company matching uses word boundaries, not substrings", () => {
  assert(!extractAllSymbols("best fintech stocks").includes("QQQ"), "'fintech' must not yield QQQ");
  assert(extractAllSymbols("tech stocks today").includes("QQQ"), "'tech' alone should still yield QQQ");
  assert(extractEntity("best fintech stocks") === null, "'fintech' should not resolve an entity");
  assert(extractEntity("jpmorgan earnings")?.symbol === "JPM", "jpmorgan should still resolve");
});

// ------------------------------------------------- mutual fund NAV staleness

check("parseNavDate reads mfapi.in DD-MM-YYYY and rejects junk", () => {
  const parsed = parseNavDate("15-03-2024");
  assert(parsed !== null, "valid date should parse");
  assert(parsed!.getUTCFullYear() === 2024, "year should be 2024");
  assert(parsed!.getUTCMonth() === 2, "month should be March (index 2)");
  assert(parsed!.getUTCDate() === 15, "day should be 15");
  assert(parseNavDate("2024-03-15") === null, "ISO order should be rejected");
  assert(parseNavDate("31-02-2024") === null, "impossible date should not roll forward");
  assert(parseNavDate("") === null, "empty string should be rejected");
  assert(parseNavDate(undefined) === null, "undefined should be rejected");
});

check("getStaleNavWarning flags NAVs older than 30 days and only those", () => {
  const now = new Date(Date.UTC(2024, 5, 1)); // 01-06-2024

  assert(getStaleNavWarning({ date: "25-05-2024", nav: 10 }, now) === null, "7 days old is fresh");
  assert(getStaleNavWarning({ date: "02-05-2024", nav: 10 }, now) === null, "exactly 30 days is not yet stale");

  const stale = getStaleNavWarning({ date: "31-12-2018", nav: 10 }, now);
  assert(stale !== null, "a 2018 NAV must be flagged");
  assert(stale!.latestNavDate === "31-12-2018", "warning should carry the NAV date");
  assert(stale!.daysStale > 1900, `expected a multi-year gap, got ${stale?.daysStale}`);
  assert(stale!.message.includes("31-12-2018"), "message should name the date");
});

check("getStaleNavWarning stays silent when the NAV date is missing or unparseable", () => {
  assert(getStaleNavWarning(null) === null, "null NAV should not warn");
  assert(getStaleNavWarning(undefined) === null, "undefined NAV should not warn");
  assert(getStaleNavWarning({ date: "not-a-date", nav: 10 }) === null, "unparseable date should not warn");
});

// ------------------------------------------------------------ kite: token encryption

process.env.KITE_TOKEN_SECRET = "test-kite-token-secret";

check("getTokenKey derives a stable 32-byte AES key from the configured secret", () => {
  const a = getTokenKey();
  const b = getTokenKey();
  assert(a !== null, "key should be derivable when a secret is set");
  assert(a!.length === 32, `expected 32-byte key, got ${a?.length}`);
  assert(a!.equals(b!), "key derivation must be deterministic across calls");
});

check("encryptToken/decryptToken round-trips an access token", () => {
  const token = "kite_access_token_abc123";
  const payload = encryptToken(token);
  assert(payload.ciphertext !== token, "ciphertext must not equal plaintext");
  assert(payload.iv.length > 0 && payload.tag.length > 0, "iv and auth tag must be stored");
  assert(decryptToken(payload) === token, "round-trip should recover the original token");
});

check("encryptToken uses a fresh IV so identical tokens differ at rest", () => {
  const a = encryptToken("same-token");
  const b = encryptToken("same-token");
  assert(a.iv !== b.iv, "each encryption must use a fresh IV");
  assert(a.ciphertext !== b.ciphertext, "identical plaintext must not produce identical ciphertext");
});

check("decryptToken returns null on tampering or malformed payloads instead of throwing", () => {
  const payload = encryptToken("kite_access_token_abc123");
  const tampered = { ...payload, tag: Buffer.alloc(16).toString("base64") };
  assert(decryptToken(tampered) === null, "a bad GCM auth tag must fail closed");
  assert(decryptToken(null) === null, "null payload should return null");
  assert(decryptToken({ ciphertext: "x" }) === null, "incomplete payload should return null");
});

// ------------------------------------------------------------ kite: daily session expiry

check("kiteSessionExpiryAt lands on the next 06:00 IST boundary", () => {
  // 15:30 IST on 15 Mar -> 06:00 IST on 16 Mar (= 00:30 UTC).
  const afternoon = kiteSessionExpiryAt(new Date("2024-03-15T10:00:00Z"));
  assert(afternoon.toISOString() === "2024-03-16T00:30:00.000Z", `got ${afternoon.toISOString()}`);

  // 05:30 IST the same day -> only 30 minutes of life left.
  const earlyMorning = kiteSessionExpiryAt(new Date("2024-03-15T00:00:00Z"));
  assert(earlyMorning.toISOString() === "2024-03-15T00:30:00.000Z", `got ${earlyMorning.toISOString()}`);

  // Exactly on the boundary must roll forward, not expire instantly.
  const onBoundary = kiteSessionExpiryAt(new Date("2024-03-15T00:30:00Z"));
  assert(onBoundary.toISOString() === "2024-03-16T00:30:00.000Z", `got ${onBoundary.toISOString()}`);
});

check("isKiteSessionExpired treats tokens past the 06:00 IST cutoff as dead", () => {
  const createdAt = new Date("2024-03-15T10:00:00Z");
  assert(!isKiteSessionExpired(createdAt, new Date("2024-03-15T18:00:00Z")), "same evening is still valid");
  assert(!isKiteSessionExpired(createdAt, new Date("2024-03-16T00:29:00Z")), "one minute before cutoff is valid");
  assert(isKiteSessionExpired(createdAt, new Date("2024-03-16T00:30:00Z")), "at the cutoff it is expired");
  assert(isKiteSessionExpired(createdAt, new Date("2024-03-20T00:00:00Z")), "days later it is expired");
});

check("describeKiteExpiry reports remaining minutes and clamps at zero", () => {
  const createdAt = new Date("2024-03-15T10:00:00Z");
  const live = describeKiteExpiry(createdAt, new Date("2024-03-15T23:30:00Z"));
  assert(!live.expired, "should not be expired yet");
  assert(live.minutesRemaining === 60, `expected 60 minutes, got ${live.minutesRemaining}`);
  assert(live.expiresAt === "2024-03-16T00:30:00.000Z", "expiresAt should be the IST boundary in ISO form");

  const dead = describeKiteExpiry(createdAt, new Date("2024-03-17T00:00:00Z"));
  assert(dead.expired, "should be expired");
  assert(dead.minutesRemaining === 0, "remaining minutes must never go negative");
});

// ------------------------------------------------------------ kite provider

check("toKiteInstrument maps bare/.NS/.BO/prefixed symbols to Kite format", () => {
  assert(toKiteInstrument("RELIANCE.NS") === "NSE:RELIANCE", "'.NS' should map to NSE:");
  assert(toKiteInstrument("RELIANCE") === "NSE:RELIANCE", "bare symbols default to NSE");
  assert(toKiteInstrument("reliance.ns") === "NSE:RELIANCE", "mapping should be case-insensitive");
  assert(toKiteInstrument("500325.BO") === "BSE:500325", "'.BO' should map to BSE:");
  assert(toKiteInstrument("TATAMOTORS.BO").startsWith("BSE:"), "'.BO' must not fall back to NSE");
  assert(toKiteInstrument("NSE:SBIN") === "NSE:SBIN", "already-qualified symbols pass through");
  assert(toKiteInstrument("  sbin  ") === "NSE:SBIN", "whitespace should be trimmed");
});

check("kiteExchangeOf and kiteTradingSymbol split the instrument correctly", () => {
  assert(kiteExchangeOf("RELIANCE") === "NSE", "bare is NSE");
  assert(kiteExchangeOf("RELIANCE.BO") === "BSE", "'.BO' is BSE");
  assert(kiteExchangeOf("BSE:500325") === "BSE", "qualified BSE stays BSE");
  assert(kiteTradingSymbol("RELIANCE.NS") === "RELIANCE", "suffix should be stripped");
  assert(kiteTradingSymbol("NSE:SBIN") === "SBIN", "exchange prefix should be stripped");
});

check("mapKiteQuote derives change/percent from ohlc.close and rejects junk", () => {
  const q = mapKiteQuote({
    last_price: 110,
    net_change: 10,
    ohlc: { open: 101, high: 112, low: 99, close: 100 },
  });
  assert(q !== null, "a well-formed payload should map");
  assertClose(q!.current, 110, 1e-9, "current should be last_price");
  assertClose(q!.changePercent, 10, 1e-9, "10 on a 100 prevClose is +10%");
  assertClose(q!.prevClose, 100, 1e-9, "prevClose comes from ohlc.close");
  assertClose(q!.high, 112, 1e-9, "high comes from ohlc.high");

  // OHLC-only payloads carry no net_change — it must be derived, not zero.
  const derived = mapKiteQuote({ last_price: 90, ohlc: { open: 100, high: 101, low: 89, close: 100 } });
  assertClose(derived!.change, -10, 1e-9, "change should be derived from prevClose");
  assertClose(derived!.changePercent, -10, 1e-9, "percent should be derived too");

  assert(mapKiteQuote(null) === null, "null payload should map to null");
  assert(mapKiteQuote({ last_price: 0 }) === null, "a zero price is not a quote");
  assert(mapKiteQuote({ last_price: "abc" }) === null, "a non-numeric price is not a quote");
});

check("buildInstrumentTokenMap keeps equities only and coerces string tokens", () => {
  const map = buildInstrumentTokenMap([
    { tradingsymbol: "RELIANCE", instrument_token: "738561", instrument_type: "EQ" },
    { tradingsymbol: "sbin", instrument_token: 779521, instrument_type: "EQ" },
    { tradingsymbol: "NIFTY24JANFUT", instrument_token: "111", instrument_type: "FUT" },
    { tradingsymbol: "", instrument_token: "222", instrument_type: "EQ" },
    { tradingsymbol: "BADTOKEN", instrument_token: "not-a-number", instrument_type: "EQ" },
  ]);

  assert(map["RELIANCE"] === 738561, "string tokens should become numbers");
  assert(map["SBIN"] === 779521, "tradingsymbols should be upper-cased");
  assert(map["NIFTY24JANFUT"] === undefined, "non-EQ rows should be skipped");
  assert(map["BADTOKEN"] === undefined, "unparseable tokens should be skipped");
  assert(Object.keys(map).length === 2, "only the two valid equities should survive");
});

check("mapKiteCandles produces sorted OHLCV rows and drops malformed candles", () => {
  const rows = mapKiteCandles([
    { date: new Date("2024-03-02T00:00:00Z"), open: 2, high: 3, low: 1, close: 2.5, volume: 20 },
    { date: "2024-03-01T00:00:00Z", open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 },
    { date: "not-a-date", open: 1, high: 2, low: 1, close: 1, volume: 1 },
    { date: "2024-03-03T00:00:00Z", open: 3, high: 4, low: 2, close: NaN, volume: 5 },
  ]);

  assert(rows.length === 2, `expected 2 usable candles, got ${rows.length}`);
  assert(rows[0]!.date === "2024-03-01", "rows should be oldest-first");
  assert(rows[1]!.date === "2024-03-02", "Date objects and ISO strings should both parse");
  assert(rows[0]!.close === 1.5 && rows[0]!.volume === 10, "OHLCV fields should carry through");

  // The shape must satisfy the OHLCV contract the indicators consume.
  const typed: OHLCV[] = rows;
  assert(typed.length === 2, "mapKiteCandles output should be OHLCV[]");
});

// ------------------------------------------------- paper trading engine (pure)

const t = (
  symbol: string,
  side: "BUY" | "SELL",
  qty: number,
  price: number,
  fees: number,
  day: number
): TradeRecord => ({ symbol, side, qty, price, fees, timestamp: new Date(Date.UTC(2024, 0, day)) });

check("computeTradeCosts caps brokerage at INR 20 and charges stamp duty on buys only", () => {
  const small = computeTradeCosts("BUY", 10, 100); // turnover 1000 -> 0.03% = 0.30
  assertClose(small.brokerage, 0.3, 1e-9, "small order brokerage should be 0.03% of turnover");

  const large = computeTradeCosts("BUY", 100, 2000); // turnover 200000 -> 0.03% = 60 > cap
  assertClose(large.brokerage, COST_RATES.brokerageCap, 1e-9, "large order brokerage should hit the INR 20 cap");
  assertClose(large.stt, 200, 1e-9, "STT is 0.1% of turnover on delivery");
  assertClose(large.stamp, 30, 1e-9, "stamp duty is 0.015% of turnover on the buy side");

  const sell = computeTradeCosts("SELL", 100, 2000);
  assert(sell.stamp === 0, "sell side pays no stamp duty");
  assertClose(sell.stt, 200, 1e-9, "STT applies to delivery sells too");
  assert(sell.total < large.total, "sell costs less than buy by exactly the stamp duty");
  assertClose(large.total - sell.total, 30, 1e-9, "buy/sell cost gap is the stamp duty");
});

check("computeTradeCosts sums its components and applies 18% GST to brokerage + txn + SEBI", () => {
  const c = computeTradeCosts("BUY", 50, 500); // turnover 25000
  assertClose(c.turnover, 25000, 1e-9, "turnover is qty * price");
  assertClose(c.gst, (c.brokerage + c.exchangeTxn + c.sebi) * 0.18, 1e-9, "GST base excludes STT and stamp");
  assertClose(
    c.total,
    c.brokerage + c.stt + c.exchangeTxn + c.sebi + c.stamp + c.gst,
    1e-9,
    "total is the sum of all components"
  );
  assert(c.total > 0 && c.total < c.turnover * 0.005, "delivery charges stay well under 0.5% of turnover");
});

check("buyCashRequired / sellCashProceeds bracket the turnover by the cost drag", () => {
  const required = buyCashRequired(10, 1000);
  const proceeds = sellCashProceeds(10, 1000);
  assert(required > 10000, "a buy must cost more than the turnover");
  assert(proceeds < 10000, "a sell must return less than the turnover");
  assertClose(required - 10000, computeTradeCosts("BUY", 10, 1000).total, 1e-9, "buy premium equals buy costs");
  assertClose(10000 - proceeds, computeTradeCosts("SELL", 10, 1000).total, 1e-9, "sell haircut equals sell costs");
});

check("computePositions averages cost across buys with fees folded in", () => {
  const positions = computePositions([
    t("RELIANCE", "BUY", 10, 100, 20, 1),
    t("RELIANCE", "BUY", 10, 200, 20, 2),
  ]);
  assert(positions.length === 1, "one symbol traded should yield one position");
  const p = positions[0];
  assert(p.qty === 20, "quantities accumulate");
  assertClose(p.invested, 3040, 1e-9, "invested = 1000 + 20 + 2000 + 20");
  assertClose(p.avgCost, 152, 1e-9, "avg cost = 3040 / 20");
  assertClose(p.realizedPnL, 0, 1e-9, "no sells means nothing realized");
});

check("computePositions books realized PnL on sells and leaves avg cost unchanged", () => {
  const positions = computePositions([
    t("TCS", "BUY", 10, 100, 0, 1),
    t("TCS", "BUY", 10, 200, 0, 2), // avg 150
    t("TCS", "SELL", 5, 250, 10, 3),
  ]);
  const p = positions[0];
  assertClose(p.realizedPnL, 5 * 250 - 10 - 5 * 150, 1e-9, "realized = proceeds - fees - cost basis sold");
  assert(p.qty === 15, "remaining quantity is 15");
  assertClose(p.avgCost, 150, 1e-9, "selling does not move the average cost");
  assertClose(p.invested, 2250, 1e-9, "remaining cost basis is 15 * 150");
});

check("computePositions replays out-of-order trades chronologically", () => {
  const unordered = [t("INFY", "SELL", 5, 120, 0, 3), t("INFY", "BUY", 10, 100, 0, 1)];
  const p = computePositions(unordered)[0];
  assert(p.qty === 5, "the buy must be applied before the sell");
  assertClose(p.realizedPnL, 100, 1e-9, "realized = 5 * (120 - 100)");
});

check("computePositions keeps symbols independent and closes flat positions", () => {
  const positions = computePositions([
    t("HDFCBANK", "BUY", 10, 100, 0, 1),
    t("ITC", "BUY", 20, 50, 0, 1),
    t("HDFCBANK", "SELL", 10, 110, 0, 2),
  ]);
  const hdfc = positions.find((p) => p.symbol === "HDFCBANK")!;
  const itc = positions.find((p) => p.symbol === "ITC")!;
  assert(hdfc.qty === 0 && hdfc.avgCost === 0 && hdfc.invested === 0, "fully sold position resets to flat");
  assertClose(hdfc.realizedPnL, 100, 1e-9, "HDFCBANK realized 10 * 10");
  assert(itc.qty === 20, "ITC is untouched by the HDFCBANK sell");
  assertClose(itc.realizedPnL, 0, 1e-9, "ITC has realized nothing");
});

check("netQtyForSymbol drives the no-shorting rule (sell beyond holding is rejected)", () => {
  const trades = [t("WIPRO", "BUY", 10, 100, 0, 1), t("WIPRO", "SELL", 4, 110, 0, 2)];
  assert(netQtyForSymbol(trades, "WIPRO") === 6, "net held is 10 - 4");
  assert(netQtyForSymbol(trades, "wipro") === 6, "symbol match is case-insensitive");
  assert(netQtyForSymbol(trades, "SBIN") === 0, "an untraded symbol is flat");

  // The engine rejects any sell whose qty exceeds this number — v1 has no shorting.
  const held = netQtyForSymbol(trades, "WIPRO");
  assert(7 > held, "selling 7 of a 6-share holding must be rejected");
  assert(!(6 > held), "selling the full holding is allowed");
});

check("computeEquityCurve tracks cash and cost basis per trade timestamp", () => {
  const trades = [t("RELIANCE", "BUY", 10, 100, 20, 1), t("RELIANCE", "SELL", 10, 150, 20, 2)];
  const curve = computeEquityCurve(trades, 10000);
  assert(curve.length === 2, "one point per trade");

  assertClose(curve[0].cash, 10000 - 1020, 1e-9, "cash drops by turnover plus fees on the buy");
  assertClose(curve[0].investedAtCost, 1020, 1e-9, "cost basis holds the deployed capital");
  assertClose(curve[0].equity, 10000, 1e-9, "equity is unchanged at the moment of a buy");

  assertClose(curve[1].cash, 10000 - 1020 + 1500 - 20, 1e-9, "sell returns proceeds net of fees");
  assertClose(curve[1].investedAtCost, 0, 1e-9, "nothing remains deployed");
  assertClose(curve[1].equity, 10460, 1e-9, "banked profit = 1500 - 20 - 1020");
  assert(curve[1].equity > curve[0].equity, "a profitable round trip raises the curve");
});

// ------------------------------------------------------------ summary

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) {
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
process.exit(0);
