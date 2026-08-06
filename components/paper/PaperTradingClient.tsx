"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState, Panel, Skeleton, StatCard } from "@/components/tools/shared";
import { cn } from "@/lib/utils";

type Side = "BUY" | "SELL";

// Field names mirror lib/paper/engine.ts PortfolioPosition exactly.
interface PaperPosition {
  symbol?: string;
  qty?: number;
  avgCost?: number;
  lastPrice?: number | null;
  unrealizedPnL?: number | null;
  priceSource?: string | null;
}

interface PaperTrade {
  id?: string;
  _id?: string;
  symbol?: string;
  side?: string;
  qty?: number;
  price?: number;
  fees?: number;
  timestamp?: string;
}

// GET /api/paper/account -> { mode, portfolio }. Cash and startingCapital live
// on the portfolio object, not a separate `account` key.
interface AccountResponse {
  mode?: string;
  portfolio?: {
    positions?: PaperPosition[];
    cash?: number;
    startingCapital?: number;
    equity?: number;
    totalRealizedPnL?: number;
    totalUnrealizedPnL?: number;
    pricingDegraded?: boolean;
  };
}

interface ReviewState {
  symbol: string;
  side: Side;
  qty: number;
  ltp: number | null;
  fees: number | null;
  constraints: string[];
  quoteNote: string | null;
}

/** Indian delivery-equity cost approximation, used only for the review preview. */
const BROKERAGE_RATE = 0.0003; // 0.03%, capped
const BROKERAGE_CAP = 20;
const STT_RATE = 0.001; // 0.1% delivery, both sides
const OTHER_RATE = 0.0004; // exchange txn + SEBI + stamp + GST, rounded

function estimateFees(notional: number): number {
  if (!Number.isFinite(notional) || notional <= 0) return 0;
  const brokerage = Math.min(notional * BROKERAGE_RATE, BROKERAGE_CAP);
  return brokerage + notional * STT_RATE + notional * OTHER_RATE;
}

const inr = (value: unknown, digits = 2) =>
  typeof value === "number" && Number.isFinite(value)
    ? `₹${value.toLocaleString("en-IN", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })}`
    : "—";

const num = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const tone = (value: number | null) =>
  value === null || value === 0 ? "neutral" : value > 0 ? "positive" : "negative";

const pnlClass = (value: number | null) =>
  value === null || value === 0
    ? "text-gray-300"
    : value > 0
      ? "text-emerald-400"
      : "text-red-400";

export default function PaperTradingClient() {
  const [data, setData] = useState<AccountResponse | null>(null);
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<Side>("BUY");
  const [qty, setQty] = useState("1");
  const [review, setReview] = useState<ReviewState | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async (isBackground = false) => {
    if (isBackground) setRefreshing(true);
    else setLoading(true);

    try {
      const [accountRes, tradesRes] = await Promise.all([
        fetch("/api/paper/account", { cache: "no-store" }),
        fetch("/api/paper/trades", { cache: "no-store" }),
      ]);

      const accountJson = await accountRes.json().catch(() => ({}));
      if (!accountRes.ok) {
        throw new Error(accountJson?.error || "Failed to load paper account");
      }

      setData(accountJson as AccountResponse);
      setError(null);

      // A failing history request should not blank out the account summary.
      if (tradesRes.ok) {
        const tradesJson = await tradesRes.json().catch(() => ({}));
        setTrades(Array.isArray(tradesJson?.trades) ? tradesJson.trades : []);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load paper account";
      setError(message);
      if (!isBackground) setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const positions = useMemo(
    () => (Array.isArray(data?.portfolio?.positions) ? data!.portfolio!.positions! : []),
    [data]
  );

  const cash = num(data?.portfolio?.cash);
  const startingCapital = num(data?.portfolio?.startingCapital);
  const equity = num(data?.portfolio?.equity);
  const realizedPnl = num(data?.portfolio?.totalRealizedPnL);
  const unrealizedPnl = num(data?.portfolio?.totalUnrealizedPnL);
  const pricingDegraded = Boolean(data?.portfolio?.pricingDegraded);

  const returnPct =
    equity !== null && startingCapital !== null && startingCapital > 0
      ? ((equity - startingCapital) / startingCapital) * 100
      : null;

  /** Step one: pull a live quote (when available) and show the cost breakdown. */
  const handleReview = async () => {
    const cleanSymbol = symbol.trim().toUpperCase();
    const parsedQty = Number(qty);

    if (!cleanSymbol) return toast.error("Enter a symbol");
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      return toast.error("Quantity must be a positive whole number");
    }

    setReviewing(true);
    try {
      let ltp: number | null = null;
      let quoteNote: string | null = null;

      try {
        const res = await fetch(
          `/api/paper/quote?symbol=${encodeURIComponent(cleanSymbol)}`,
          { cache: "no-store" }
        );
        const json = await res.json().catch(() => ({}));
        ltp = res.ok ? num(json?.ltp ?? json?.price ?? json?.quote?.last_price) : null;
        if (ltp === null) {
          quoteNote =
            json?.error || "Live quote unavailable — fill price is set at execution time.";
        }
      } catch {
        quoteNote = "Live quote unavailable — fill price is set at execution time.";
      }

      // Fall back to the last price already known for an open position.
      if (ltp === null) {
        const held = positions.find((p) => p.symbol?.toUpperCase() === cleanSymbol);
        const heldLtp = num(held?.lastPrice);
        if (heldLtp !== null) {
          ltp = heldLtp;
          quoteNote = "Using last known price from your open position.";
        }
      }

      const notional = ltp !== null ? ltp * parsedQty : null;
      const fees = notional !== null ? estimateFees(notional) : null;

      const constraints: string[] = [];
      if (side === "BUY" && notional !== null && fees !== null && cash !== null) {
        if (notional + fees > cash) {
          constraints.push(`Estimated cost exceeds available cash (${inr(cash)}).`);
        }
      }
      if (side === "SELL") {
        const held = positions.find((p) => p.symbol?.toUpperCase() === cleanSymbol);
        const heldQty = num(held?.qty) ?? 0;
        if (heldQty < parsedQty) {
          constraints.push(`You hold ${heldQty} share(s) — cannot sell ${parsedQty}.`);
        }
      }

      setReview({
        symbol: cleanSymbol,
        side,
        qty: parsedQty,
        ltp,
        fees,
        constraints,
        quoteNote,
      });
    } finally {
      setReviewing(false);
    }
  };

  /** Step two: actually submit the simulated order. */
  const handleConfirm = async () => {
    if (!review) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/paper/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: review.symbol,
          side: review.side,
          qty: review.qty,
        }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // The trade route reports risk-gate rejections as { error, riskGate }.
        const raw = Array.isArray(json?.riskGate?.constraints)
          ? json.riskGate.constraints
          : Array.isArray(json?.constraints)
            ? json.constraints
            : [];
        const constraints: string[] = raw.map((c: unknown) =>
          typeof c === "string" ? c : JSON.stringify(c)
        );
        setReview({ ...review, constraints });
        throw new Error(json?.error || "Trade rejected");
      }

      toast.success(`Simulated ${review.side} ${review.qty} ${review.symbol}`);
      setReview(null);
      setSymbol("");
      setQty("1");
      await load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Trade rejected");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/paper/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to reset account");

      toast.success("Paper account reset");
      setResetOpen(false);
      setTrades([]);
      await load(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset account");
    } finally {
      setResetting(false);
    }
  };

  const notional = review?.ltp !== null && review ? review.ltp! * review.qty : null;
  const totalCost =
    notional !== null && review?.fees !== null && review
      ? review.side === "BUY"
        ? notional + review.fees!
        : notional - review.fees!
      : null;

  return (
    <section className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Paper <span className="text-yellow-500">Trading</span>
          </h1>
          <p className="text-sm text-gray-500">
            Practise Indian equity trades against live prices with simulated capital.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => load(true)}
            disabled={refreshing || loading}
            className="cursor-pointer border-zinc-800 bg-[#141414] text-gray-300 hover:bg-zinc-800 hover:text-white"
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setResetOpen(true)}
            className="cursor-pointer border-red-900/60 bg-red-950/20 text-red-300 hover:bg-red-950/40 hover:text-red-200"
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-yellow-700/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>Paper trading — simulated fills, no real orders.</span>
      </div>

      {error && <ErrorState message={error} onRetry={() => load()} />}

      <Panel title="Account" description="Simulated equity and profit-and-loss.">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[86px]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Equity"
              value={inr(equity)}
              hint={startingCapital !== null ? `Start ${inr(startingCapital, 0)}` : undefined}
            />
            <StatCard label="Cash" value={inr(cash)} />
            <StatCard
              label="Realized P&L"
              value={inr(realizedPnl)}
              tone={tone(realizedPnl)}
            />
            <StatCard
              label="Unrealized P&L"
              value={inr(unrealizedPnl)}
              tone={tone(unrealizedPnl)}
            />
            <StatCard
              label="Return"
              value={returnPct === null ? "—" : `${returnPct.toFixed(2)}%`}
              tone={tone(returnPct)}
            />
          </div>
        )}
      </Panel>

      <Panel title="Positions" description="Open simulated holdings, marked to the last price.">
        {loading ? (
          <Skeleton className="h-40" />
        ) : positions.length === 0 ? (
          <EmptyState>No open positions. Place a paper trade to get started.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            {pricingDegraded && (
              <p className="mb-3 text-xs text-yellow-500/90">
                Some positions could not be marked to a live price and are shown at cost.
              </p>
            )}
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-gray-500">Symbol</TableHead>
                  <TableHead className="text-right text-gray-500">Qty</TableHead>
                  <TableHead className="text-right text-gray-500">Avg cost</TableHead>
                  <TableHead className="text-right text-gray-500">LTP</TableHead>
                  <TableHead className="text-right text-gray-500">Unrealized P&L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position, index) => {
                  const positionPnl = num(position.unrealizedPnL);
                  return (
                    <TableRow
                      key={`${position.symbol ?? "row"}-${index}`}
                      className="border-zinc-800 hover:bg-zinc-900/50"
                    >
                      <TableCell className="font-medium text-gray-100">
                        {position.symbol ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-300">
                        {num(position.qty) ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-300">
                        {inr(position.avgCost)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-300">
                        {inr(position.lastPrice)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          pnlClass(positionPnl)
                        )}
                      >
                        {inr(position.unrealizedPnL)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      <Panel
        title="Trade ticket"
        description="Review the estimated cost and risk checks before confirming."
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
          <div className="space-y-1.5">
            <label htmlFor="paper-symbol" className="text-xs text-gray-500 uppercase">
              Symbol
            </label>
            <Input
              id="paper-symbol"
              value={symbol}
              placeholder="RELIANCE"
              onChange={(e) => {
                setSymbol(e.target.value.toUpperCase());
                setReview(null);
              }}
              className="border-zinc-800 bg-[#1A1A1A] text-gray-100 placeholder:text-gray-600"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs text-gray-500 uppercase">Side</span>
            <div className="inline-flex overflow-hidden rounded-md border border-zinc-800">
              {(["BUY", "SELL"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSide(option);
                    setReview(null);
                  }}
                  className={cn(
                    "cursor-pointer px-4 py-2 text-sm font-medium transition-colors",
                    side === option
                      ? option === "BUY"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-red-500/20 text-red-400"
                      : "bg-[#1A1A1A] text-gray-500 hover:text-gray-300"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="paper-qty" className="text-xs text-gray-500 uppercase">
              Qty
            </label>
            <Input
              id="paper-qty"
              type="number"
              min={1}
              step={1}
              value={qty}
              onChange={(e) => {
                setQty(e.target.value);
                setReview(null);
              }}
              className="w-28 border-zinc-800 bg-[#1A1A1A] text-gray-100"
            />
          </div>

          <Button
            onClick={handleReview}
            disabled={reviewing}
            className="cursor-pointer bg-yellow-500 text-zinc-900 hover:bg-yellow-400"
          >
            {reviewing && <Loader2 className="size-4 animate-spin" />}
            Review
          </Button>
        </div>

        {review && (
          <div className="mt-5 rounded-lg border border-zinc-800 bg-[#1A1A1A] p-4">
            <p className="text-sm font-medium text-gray-100">
              {review.side} {review.qty} × {review.symbol}
            </p>

            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Live price</dt>
                <dd className="tabular-nums text-gray-200">{inr(review.ltp)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Notional</dt>
                <dd className="tabular-nums text-gray-200">{inr(notional)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Estimated fees</dt>
                <dd className="tabular-nums text-gray-200">{inr(review.fees)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">
                  {review.side === "BUY" ? "Total cost" : "Net proceeds"}
                </dt>
                <dd className="font-medium tabular-nums text-gray-100">{inr(totalCost)}</dd>
              </div>
            </dl>

            {review.quoteNote && (
              <p className="mt-3 text-xs text-gray-500">{review.quoteNote}</p>
            )}

            {review.constraints.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-md border border-red-900/50 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                {review.constraints.map((constraint, index) => (
                  <li key={index}>{constraint}</li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex gap-2">
              <Button
                onClick={handleConfirm}
                disabled={submitting}
                className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Confirm simulated {review.side.toLowerCase()}
              </Button>
              <Button
                variant="outline"
                onClick={() => setReview(null)}
                className="cursor-pointer border-zinc-800 bg-transparent text-gray-400 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Trade history" description="Every simulated fill on this account.">
        {loading ? (
          <Skeleton className="h-32" />
        ) : trades.length === 0 ? (
          <EmptyState>No trades yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-gray-500">Time</TableHead>
                  <TableHead className="text-gray-500">Symbol</TableHead>
                  <TableHead className="text-gray-500">Side</TableHead>
                  <TableHead className="text-right text-gray-500">Qty</TableHead>
                  <TableHead className="text-right text-gray-500">Price</TableHead>
                  <TableHead className="text-right text-gray-500">Fees</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade, index) => {
                  const timestamp = trade.timestamp;
                  const parsed = timestamp ? new Date(timestamp) : null;
                  const isBuy = trade.side?.toUpperCase() === "BUY";
                  return (
                    <TableRow
                      key={trade.id ?? trade._id ?? index}
                      className="border-zinc-800 hover:bg-zinc-900/50"
                    >
                      <TableCell className="text-gray-400">
                        {parsed && !Number.isNaN(parsed.getTime())
                          ? parsed.toLocaleString("en-IN")
                          : "—"}
                      </TableCell>
                      <TableCell className="font-medium text-gray-100">
                        {trade.symbol ?? "—"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-medium",
                          isBuy ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {trade.side?.toUpperCase() ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-300">
                        {num(trade.qty) ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-300">
                        {inr(trade.price)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-gray-400">
                        {inr(trade.fees)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="border-zinc-800 bg-[#111111] text-gray-100">
          <DialogHeader>
            <DialogTitle>Reset paper account?</DialogTitle>
            <DialogDescription className="text-gray-500">
              This clears all simulated positions and trade history and restores your
              starting capital. It cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetOpen(false)}
              className="cursor-pointer border-zinc-800 bg-transparent text-gray-400 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReset}
              disabled={resetting}
              className="cursor-pointer bg-red-600 text-white hover:bg-red-500"
            >
              {resetting && <Loader2 className="size-4 animate-spin" />}
              Reset account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
