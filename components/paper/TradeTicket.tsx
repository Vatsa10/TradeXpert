"use client";

import { useState } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/app/ActionButton";
import { FormField, Money, Panel, Surface, TextInput, formatMoney } from "@/components/system";
import { cn } from "@/lib/utils";

import { estimateFees, num, type PaperPosition, type ReviewState, type Side } from "./types";

/**
 * Two-step trade ticket. Step one (Review) prices the order locally and shows
 * the cost breakdown; step two (Confirm) posts it. A 422 from
 * POST /api/paper/trade carries the risk-gate constraints, which are folded
 * back into the review panel — that guardrail is deliberate, do not bypass it.
 */
export function TradeTicket({
  positions,
  cash,
  onTraded,
}: {
  positions: PaperPosition[];
  cash: number | null;
  onTraded: () => Promise<void> | void;
}) {
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<Side>("BUY");
  const [qty, setQty] = useState("1");
  const [review, setReview] = useState<ReviewState | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
        const res = await fetch(`/api/paper/quote?symbol=${encodeURIComponent(cleanSymbol)}`, {
          cache: "no-store",
        });
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
          constraints.push(
            `Estimated cost exceeds available cash (${formatMoney(cash, "INR", 2)}).`
          );
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
      await onTraded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Trade rejected");
    } finally {
      setSubmitting(false);
    }
  };

  const notional = review && review.ltp !== null ? review.ltp * review.qty : null;
  const totalCost =
    notional !== null && review && review.fees !== null
      ? review.side === "BUY"
        ? notional + review.fees
        : notional - review.fees
      : null;

  return (
    <Panel
      title="Trade ticket"
      description="Review the estimated cost and risk checks before confirming."
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <FormField id="paper-symbol" label="Symbol">
          {(props) => (
            <TextInput
              {...props}
              value={symbol}
              placeholder="RELIANCE"
              onChange={(e) => {
                setSymbol(e.target.value.toUpperCase());
                setReview(null);
              }}
            />
          )}
        </FormField>

        <fieldset className="space-y-1.5">
          <legend className="text-xs font-medium text-ink-secondary">Side</legend>
          <div className="inline-flex overflow-hidden rounded-md border border-hairline-strong">
            {(["BUY", "SELL"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={side === option}
                onClick={() => {
                  setSide(option);
                  setReview(null);
                }}
                className={cn(
                  "app-press app-focus cursor-pointer px-4 py-2 text-sm font-medium",
                  "transition-colors duration-200",
                  side === option
                    ? option === "BUY"
                      ? "bg-up/15 text-up"
                      : "bg-down/15 text-down"
                    : "bg-surface-sunken text-ink-faint [@media(hover:hover)]:hover:text-ink-secondary"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <FormField id="paper-qty" label="Qty">
          {(props) => (
            <TextInput
              {...props}
              type="number"
              min={1}
              step={1}
              value={qty}
              className="w-28"
              onChange={(e) => {
                setQty(e.target.value);
                setReview(null);
              }}
            />
          )}
        </FormField>

        <ActionButton variant="brand" onClick={handleReview} loading={reviewing}>
          Review
        </ActionButton>
      </div>

      {review && (
        <Surface level="raised-2" radius="tile" padding="sm" className="app-enter mt-5">
          <p className="text-sm font-medium text-ink">
            {review.side} {review.qty} × {review.symbol}
          </p>

          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-secondary">Live price</dt>
              <dd>
                <Money value={review.ltp} currency="INR" digits={2} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-secondary">Notional</dt>
              <dd>
                <Money value={notional} currency="INR" digits={2} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-secondary">Estimated fees</dt>
              <dd>
                <Money value={review.fees} currency="INR" digits={2} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-secondary">
                {review.side === "BUY" ? "Total cost" : "Net proceeds"}
              </dt>
              <dd className="font-medium">
                <Money value={totalCost} currency="INR" digits={2} />
              </dd>
            </div>
          </dl>

          {review.quoteNote && <p className="mt-3 text-xs text-ink-faint">{review.quoteNote}</p>}

          {review.constraints.length > 0 && (
            <ul
              role="alert"
              className="mt-3 space-y-1 rounded-md border border-negative/30 bg-negative/10 px-3 py-2 text-xs text-negative"
            >
              {review.constraints.map((constraint, index) => (
                <li key={index}>{constraint}</li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton variant="brand" onClick={handleConfirm} loading={submitting}>
              Confirm simulated {review.side.toLowerCase()}
            </ActionButton>
            <ActionButton variant="ghost" onClick={() => setReview(null)}>
              Cancel
            </ActionButton>
          </div>
        </Surface>
      )}
    </Panel>
  );
}
