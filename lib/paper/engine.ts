// Paper-trading engine.
//
// HARD RULE for this phase: no real orders. Nothing in this module (or any
// module it imports) may call KiteConnect.placeOrder — fills are simulated
// locally against a live quote. The engine exists to prove the full
// recommendation -> risk gate -> execution -> P&L pipeline with zero capital
// at risk before any broker execution path is ever written.
//
// Live prices are mandatory: if no quote can be fetched we reject the trade
// rather than fabricate a fill, because a paper track record built on made-up
// prices is worse than no track record.

import { connectToDatabase } from "@/database/mongoose";
import { PaperAccountModel, type PaperAccount } from "@/database/models/paper-account.model";
import { PaperTradeModel, type PaperTradeSide } from "@/database/models/paper-trade.model";
import { getFinnhubQuote } from "@/lib/chat/aggregator";
import { getKiteQuote } from "@/lib/data/providers/kite";
import { computeRiskGate, type RiskGateResult } from "@/lib/analysis/risk-gate";

export const DEFAULT_STARTING_CAPITAL = 1_000_000; // INR 10 lakh

// ---------------------------------------------------------------- cost model
//
// Indian equity *delivery* (CNC) charges, as levied by a discount broker
// (Zerodha schedule, FY25). Rates are documented here so the simulated P&L can
// be audited against a real contract note later:
//
//   brokerage        : min(0.03% of turnover, INR 20) per order  [spec'd cap]
//   STT              : 0.1% of turnover, on BOTH buy and sell (delivery)
//   exchange txn chg : 0.00297% of turnover (NSE equity)
//   SEBI turnover fee: 0.0001% of turnover (INR 10 per crore)
//   stamp duty       : 0.015% of turnover, BUY side only
//   GST              : 18% on (brokerage + exchange txn + SEBI fee)
//
// exchange + SEBI + stamp together land at ~0.01-0.02% of turnover, matching
// the "~0.01%" order of magnitude in the requirement.
export const COST_RATES = {
  brokeragePct: 0.0003,
  brokerageCap: 20,
  sttPct: 0.001,
  exchangeTxnPct: 0.0000297,
  sebiPct: 0.000001,
  stampPctBuy: 0.00015,
  gstPct: 0.18,
} as const;

export interface TradeCosts {
  turnover: number;
  brokerage: number;
  stt: number;
  exchangeTxn: number;
  sebi: number;
  stamp: number;
  gst: number;
  total: number;
}

/** Pure: simulated statutory + brokerage charges for one delivery order. */
export function computeTradeCosts(side: PaperTradeSide, qty: number, price: number): TradeCosts {
  const turnover = Math.max(0, qty * price);
  const brokerage = Math.min(turnover * COST_RATES.brokeragePct, COST_RATES.brokerageCap);
  const stt = turnover * COST_RATES.sttPct;
  const exchangeTxn = turnover * COST_RATES.exchangeTxnPct;
  const sebi = turnover * COST_RATES.sebiPct;
  const stamp = side === "BUY" ? turnover * COST_RATES.stampPctBuy : 0;
  const gst = (brokerage + exchangeTxn + sebi) * COST_RATES.gstPct;
  const total = brokerage + stt + exchangeTxn + sebi + stamp + gst;
  return { turnover, brokerage, stt, exchangeTxn, sebi, stamp, gst, total };
}

/** Pure: cash a BUY consumes (turnover + costs). */
export function buyCashRequired(qty: number, price: number): number {
  return qty * price + computeTradeCosts("BUY", qty, price).total;
}

/** Pure: cash a SELL returns (turnover - costs). */
export function sellCashProceeds(qty: number, price: number): number {
  return qty * price - computeTradeCosts("SELL", qty, price).total;
}

// ----------------------------------------------------------------- positions

export interface TradeRecord {
  symbol: string;
  side: PaperTradeSide;
  qty: number;
  price: number;
  fees: number;
  timestamp: Date;
}

export interface PaperPosition {
  symbol: string;
  qty: number;
  avgCost: number; // per share, fees included
  invested: number; // qty * avgCost
  realizedPnL: number; // booked over the whole history for this symbol
}

/**
 * Pure: replay a trade log into positions. Weighted-average cost basis
 * (matching Indian delivery accounting): a BUY raises the average, a SELL
 * books realized P&L against it and leaves the average untouched. Sells beyond
 * the held quantity are clamped to the held quantity — the engine rejects them
 * before they are ever written, so this only guards a corrupted log.
 */
export function computePositions(trades: TradeRecord[]): PaperPosition[] {
  const bySymbol = new Map<string, PaperPosition>();
  const ordered = [...trades].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  for (const t of ordered) {
    const symbol = t.symbol.toUpperCase();
    let pos = bySymbol.get(symbol);
    if (!pos) {
      pos = { symbol, qty: 0, avgCost: 0, invested: 0, realizedPnL: 0 };
      bySymbol.set(symbol, pos);
    }

    if (t.side === "BUY") {
      const cost = t.qty * t.price + t.fees;
      pos.invested += cost;
      pos.qty += t.qty;
      pos.avgCost = pos.qty > 0 ? pos.invested / pos.qty : 0;
    } else {
      const sellQty = Math.min(t.qty, pos.qty);
      const costOut = sellQty * pos.avgCost;
      pos.realizedPnL += sellQty * t.price - t.fees - costOut;
      pos.qty -= sellQty;
      pos.invested = pos.qty > 0 ? pos.qty * pos.avgCost : 0;
      if (pos.qty === 0) pos.avgCost = 0;
    }
  }

  return [...bySymbol.values()];
}

/** Pure: net open quantity for one symbol from a trade log. */
export function netQtyForSymbol(trades: TradeRecord[], symbol: string): number {
  const target = symbol.toUpperCase();
  return trades.reduce((sum, t) => {
    if (t.symbol.toUpperCase() !== target) return sum;
    return t.side === "BUY" ? sum + t.qty : sum - t.qty;
  }, 0);
}

export interface EquityPoint {
  timestamp: Date;
  cash: number;
  investedAtCost: number;
  equity: number; // cash + cost basis of open positions (realized-only curve)
}

/**
 * Pure: equity curve at cost basis, one point per trade timestamp. Unrealized
 * moves between trades are invisible here by design — this curve answers "what
 * has the strategy actually banked", which is the number that matters when
 * deciding whether the pipeline earns real money.
 */
export function computeEquityCurve(trades: TradeRecord[], startingCapital: number): EquityPoint[] {
  const ordered = [...trades].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const points: EquityPoint[] = [];
  let cash = startingCapital;
  const running: TradeRecord[] = [];

  for (const t of ordered) {
    cash += t.side === "BUY" ? -(t.qty * t.price + t.fees) : t.qty * t.price - t.fees;
    running.push(t);
    const investedAtCost = computePositions(running).reduce((s, p) => s + p.invested, 0);
    points.push({ timestamp: t.timestamp, cash, investedAtCost, equity: cash + investedAtCost });
  }

  return points;
}

// -------------------------------------------------------------- live pricing

export interface LivePrice {
  price: number;
  source: string;
}

/**
 * Live price for a symbol. Kite first (the user's own Zerodha account, India
 * only), then the aggregator quote path which already handles .NS/.BO via the
 * NSE provider. Returns null when nothing usable is available — callers MUST
 * reject rather than invent a price.
 *
 * getKiteQuote already returns null when KITE_API_KEY/KITE_API_SECRET are unset
 * or the user has not linked an account, so an unconfigured Kite degrades to the
 * free provider instead of crashing.
 */
export async function getLivePrice(symbol: string, userEmail?: string): Promise<LivePrice | null> {
  try {
    const quote = await getKiteQuote(userEmail, symbol);
    if (quote && Number.isFinite(quote.current) && quote.current > 0) {
      return { price: quote.current, source: "kite" };
    }
  } catch {
    // Kite unavailable/unconfigured — fall through to the free provider.
  }

  try {
    // Pass userEmail through: the aggregator's Indian branch can still reach
    // Kite from here even if the direct call above was a transient miss.
    const quote = await getFinnhubQuote(symbol, userEmail);
    const price = (quote as any)?.current;
    if (typeof price === "number" && Number.isFinite(price) && price > 0) {
      return { price, source: "aggregator" };
    }
  } catch {
    // ignore, handled by the null return
  }

  return null;
}

// ------------------------------------------------------------------ DB layer

export async function getOrCreateAccount(userEmail: string): Promise<PaperAccount> {
  await connectToDatabase();
  const email = userEmail.trim().toLowerCase();
  const existing = await PaperAccountModel.findOne({ userEmail: email });
  if (existing) return existing;

  try {
    return await PaperAccountModel.create({
      userEmail: email,
      startingCapital: DEFAULT_STARTING_CAPITAL,
      cash: DEFAULT_STARTING_CAPITAL,
      createdAt: new Date(),
    });
  } catch {
    // Unique-index race: another request created it between find and create.
    const raced = await PaperAccountModel.findOne({ userEmail: email });
    if (raced) return raced;
    throw new Error("Failed to create paper account");
  }
}

export async function resetAccount(
  userEmail: string,
  startingCapital: number = DEFAULT_STARTING_CAPITAL
): Promise<PaperAccount> {
  await connectToDatabase();
  const email = userEmail.trim().toLowerCase();
  await PaperTradeModel.deleteMany({ userEmail: email });
  const account = await PaperAccountModel.findOneAndUpdate(
    { userEmail: email },
    { $set: { startingCapital, cash: startingCapital, createdAt: new Date() } },
    { returnDocument: "after", upsert: true }
  );
  return account as PaperAccount;
}

async function loadTrades(userEmail: string): Promise<TradeRecord[]> {
  const docs = await PaperTradeModel.find({ userEmail: userEmail.trim().toLowerCase() })
    .sort({ timestamp: 1 })
    .lean();
  return docs.map((d: any) => ({
    symbol: d.symbol,
    side: d.side as PaperTradeSide,
    qty: d.qty,
    price: d.price,
    fees: d.fees ?? 0,
    timestamp: new Date(d.timestamp),
  }));
}

export interface ExecuteTradeInput {
  symbol: string;
  side: PaperTradeSide;
  qty: number;
  price?: number; // ignored for fills; only a client hint, never trusted
  rationale?: string;
}

export type ExecuteTradeResult =
  | {
      ok: true;
      trade: {
        symbol: string;
        side: PaperTradeSide;
        qty: number;
        price: number;
        fees: number;
        timestamp: Date;
        rationale: string;
        status: "FILLED";
      };
      priceSource: string;
      costs: TradeCosts;
      cash: number;
    }
  | { ok: false; status: 400 | 422 | 503; error: string; riskGate?: RiskGateResult };

/**
 * Simulate a fill. Never touches a broker. Rejects rather than guesses:
 * no live price -> 503; insufficient cash / shorting attempt -> 422;
 * quantity above the risk gate's maxShares -> 422 with the constraint list.
 */
export async function executePaperTrade(
  userEmail: string,
  input: ExecuteTradeInput
): Promise<ExecuteTradeResult> {
  const symbol = (input.symbol || "").trim().toUpperCase();
  if (!symbol) return { ok: false, status: 400, error: "symbol is required" };
  if (!Number.isInteger(input.qty) || input.qty <= 0) {
    return { ok: false, status: 400, error: "qty must be a positive integer" };
  }
  if (input.side !== "BUY" && input.side !== "SELL") {
    return { ok: false, status: 400, error: "side must be BUY or SELL" };
  }

  const email = userEmail.trim().toLowerCase();
  const account = await getOrCreateAccount(email);

  const live = await getLivePrice(symbol, email);
  if (!live) {
    return {
      ok: false,
      status: 503,
      error: `No live price available for ${symbol} (Kite not configured and fallback quote unavailable) — refusing to simulate a fill at a fabricated price`,
    };
  }

  const price = live.price;
  const costs = computeTradeCosts(input.side, input.qty, price);
  const trades = await loadTrades(email);

  if (input.side === "BUY") {
    // Risk gate: the exact guardrail a real order will have to pass. Proving it
    // in paper first means the live path inherits limits already exercised.
    const positions = computePositions(trades);
    // Only the traded symbol has a fresh quote here; other holdings are marked
    // at cost rather than firing N extra quote calls on every trade.
    let marketValue = 0;
    for (const p of positions) {
      if (p.qty <= 0) continue;
      marketValue += p.symbol === symbol ? p.qty * price : p.invested;
    }
    const equity = account.cash + marketValue;

    const gate = computeRiskGate({
      accountCapital: equity,
      cashAvailable: account.cash,
      currentPrice: price,
    });

    if (input.qty > gate.maxShares) {
      return {
        ok: false,
        status: 422,
        error: `Risk gate: qty ${input.qty} exceeds max ${gate.maxShares} shares (max allocation INR ${gate.maxAllocationAmount.toFixed(2)} at INR ${price.toFixed(2)}). Constraints: ${gate.constraints.join("; ")}`,
        riskGate: gate,
      };
    }

    const required = input.qty * price + costs.total;
    // Conditional $inc: the cash guard lives in the query, so two concurrent
    // buys cannot both pass a stale read and overdraw the account.
    const updated = await PaperAccountModel.findOneAndUpdate(
      { userEmail: email, cash: { $gte: required } },
      { $inc: { cash: -required } },
      { returnDocument: "after" }
    );
    if (!updated) {
      return {
        ok: false,
        status: 422,
        error: `Insufficient cash: need INR ${required.toFixed(2)} (incl. INR ${costs.total.toFixed(2)} charges), have INR ${account.cash.toFixed(2)}`,
      };
    }

    try {
      const doc = await PaperTradeModel.create({
        userEmail: email,
        symbol,
        side: "BUY",
        qty: input.qty,
        price,
        fees: costs.total,
        timestamp: new Date(),
        rationale: input.rationale ?? "",
        status: "FILLED",
      });
      return {
        ok: true,
        trade: {
          symbol,
          side: "BUY",
          qty: doc.qty,
          price: doc.price,
          fees: doc.fees,
          timestamp: doc.timestamp,
          rationale: doc.rationale,
          status: "FILLED",
        },
        priceSource: live.source,
        costs,
        cash: updated.cash,
      };
    } catch (err) {
      // Refund so the ledger never loses cash to a trade that was not recorded.
      await PaperAccountModel.updateOne({ userEmail: email }, { $inc: { cash: required } });
      throw err;
    }
  }

  // SELL — no shorting in v1: cannot sell more than the net held quantity.
  const held = netQtyForSymbol(trades, symbol);
  if (input.qty > held) {
    return {
      ok: false,
      status: 422,
      error: `Cannot sell ${input.qty} of ${symbol}: only ${held} held (short selling is not supported)`,
    };
  }

  const proceeds = input.qty * price - costs.total;
  const doc = await PaperTradeModel.create({
    userEmail: email,
    symbol,
    side: "SELL",
    qty: input.qty,
    price,
    fees: costs.total,
    timestamp: new Date(),
    rationale: input.rationale ?? "",
    status: "FILLED",
  });

  const updated = await PaperAccountModel.findOneAndUpdate(
    { userEmail: email },
    { $inc: { cash: proceeds } },
    { returnDocument: "after" }
  );

  return {
    ok: true,
    trade: {
      symbol,
      side: "SELL",
      qty: doc.qty,
      price: doc.price,
      fees: doc.fees,
      timestamp: doc.timestamp,
      rationale: doc.rationale,
      status: "FILLED",
    },
    priceSource: live.source,
    costs,
    cash: updated?.cash ?? account.cash + proceeds,
  };
}

export interface PortfolioPosition extends PaperPosition {
  lastPrice: number | null;
  marketValue: number | null;
  unrealizedPnL: number | null;
  unrealizedPnLPct: number | null;
  priceSource: string | null;
}

export interface Portfolio {
  cash: number;
  startingCapital: number;
  positions: PortfolioPosition[];
  marketValue: number; // open positions marked to live price where available
  equity: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalPnL: number;
  totalPnLPct: number;
  equityCurve: EquityPoint[];
  tradeCount: number;
  pricingDegraded: boolean; // true when some positions could not be marked live
}

export async function getPortfolio(userEmail: string): Promise<Portfolio> {
  const email = userEmail.trim().toLowerCase();
  const account = await getOrCreateAccount(email);
  const trades = await loadTrades(email);
  const positions = computePositions(trades);

  const open = positions.filter((p) => p.qty > 0);
  const quotes = await Promise.all(open.map((p) => getLivePrice(p.symbol, email).catch(() => null)));

  let marketValue = 0;
  let totalUnrealized = 0;
  let pricingDegraded = false;

  const enriched: PortfolioPosition[] = positions.map((p) => {
    if (p.qty <= 0) {
      return {
        ...p,
        lastPrice: null,
        marketValue: null,
        unrealizedPnL: null,
        unrealizedPnLPct: null,
        priceSource: null,
      };
    }
    const q = quotes[open.indexOf(p)];
    if (!q) {
      pricingDegraded = true;
      // Mark at cost when live pricing is unavailable — never at an invented price.
      marketValue += p.invested;
      return {
        ...p,
        lastPrice: null,
        marketValue: null,
        unrealizedPnL: null,
        unrealizedPnLPct: null,
        priceSource: null,
      };
    }
    const mv = p.qty * q.price;
    const unrealized = mv - p.invested;
    marketValue += mv;
    totalUnrealized += unrealized;
    return {
      ...p,
      lastPrice: q.price,
      marketValue: mv,
      unrealizedPnL: unrealized,
      unrealizedPnLPct: p.invested > 0 ? (unrealized / p.invested) * 100 : 0,
      priceSource: q.source,
    };
  });

  const totalRealized = positions.reduce((s, p) => s + p.realizedPnL, 0);
  const equity = account.cash + marketValue;
  const totalPnL = equity - account.startingCapital;

  return {
    cash: account.cash,
    startingCapital: account.startingCapital,
    positions: enriched,
    marketValue,
    equity,
    totalRealizedPnL: totalRealized,
    totalUnrealizedPnL: totalUnrealized,
    totalPnL,
    totalPnLPct: account.startingCapital > 0 ? (totalPnL / account.startingCapital) * 100 : 0,
    equityCurve: computeEquityCurve(trades, account.startingCapital),
    tradeCount: trades.length,
    pricingDegraded,
  };
}

export async function getTradeHistory(userEmail: string, limit = 200) {
  await connectToDatabase();
  const docs = await PaperTradeModel.find({ userEmail: userEmail.trim().toLowerCase() })
    .sort({ timestamp: -1 })
    .limit(Math.min(Math.max(1, limit), 1000))
    .lean();
  return docs.map((d: any) => ({
    symbol: d.symbol,
    side: d.side,
    qty: d.qty,
    price: d.price,
    fees: d.fees ?? 0,
    timestamp: d.timestamp,
    rationale: d.rationale ?? "",
    status: d.status ?? "FILLED",
  }));
}
