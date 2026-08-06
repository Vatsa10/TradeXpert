"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Calculator, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PositionRecommendation {
  symbol: string;
  riskGate: {
    maxAllocationPct: number;
    maxAllocationAmount: number;
    maxShares: number;
    constraints: string[];
    cashConstrained: boolean;
  };
  sizing: {
    recommendedQty: number;
    positionPct: number;
    volatilityScalar: number;
    correlationPenalty: number;
    kellyFraction: number;
    rawKelly: number;
    rationale: string;
  };
  recommendedQty: number;
  recommendedValue: number;
  recommendedPct: number;
  bindingConstraint: "risk-gate" | "position-sizer";
  correlation: { maxCorrelation: number; mostCorrelatedSymbol: string | null };
  notes: string[];
  disclaimer: string;
}

function parseNum(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function money(value: number): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function SizerField({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="form-label">
        {label}
      </Label>
      <Input
        id={id}
        className="form-input"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default function PositionSizeCalculator({
  symbol: symbolFromValuation,
  currentPrice: priceFromValuation,
}: {
  symbol?: string;
  currentPrice?: string;
}) {
  const [symbol, setSymbol] = useState(symbolFromValuation ?? "");
  const [price, setPrice] = useState(priceFromValuation ?? "");
  const [capital, setCapital] = useState("");
  const [cash, setCash] = useState("");
  const [winRate, setWinRate] = useState("55");
  const [avgWin, setAvgWin] = useState("5");
  const [avgLoss, setAvgLoss] = useState("3");
  const [atr, setAtr] = useState("1.8");
  const [lotSize, setLotSize] = useState("1");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PositionRecommendation | null>(null);

  // Follow the valuation form while the user has not overridden these fields.
  useEffect(() => {
    if (symbolFromValuation) setSymbol((prev) => (prev ? prev : symbolFromValuation));
  }, [symbolFromValuation]);

  useEffect(() => {
    if (priceFromValuation) setPrice((prev) => (prev ? prev : priceFromValuation));
  }, [priceFromValuation]);

  async function calculate() {
    const sym = symbol.trim().toUpperCase();
    const accountCapital = parseNum(capital);
    const currentPrice = parseNum(price);
    const winRatePct = parseNum(winRate);
    const avgWinPct = parseNum(avgWin);
    const avgLossPct = parseNum(avgLoss);
    const atrPct = parseNum(atr);

    if (!sym) return toast.error("Symbol is required");
    if (accountCapital === null || accountCapital <= 0) return toast.error("Account capital must be greater than zero");
    if (currentPrice === null || currentPrice <= 0) return toast.error("Current price must be greater than zero");
    if (winRatePct === null || winRatePct < 0 || winRatePct > 100) return toast.error("Win rate must be between 0 and 100");
    if (avgWinPct === null || avgWinPct <= 0) return toast.error("Average win % must be greater than zero");
    if (avgLossPct === null || avgLossPct <= 0) return toast.error("Average loss % must be greater than zero");
    if (atrPct === null || atrPct < 0) return toast.error("ATR % must be zero or greater");

    setLoading(true);
    try {
      const res = await fetch("/api/analysis/position-size", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: sym,
          accountCapital,
          cashAvailable: parseNum(cash) ?? accountCapital,
          currentPrice,
          // The API takes fractions, the form takes percentages.
          winRate: winRatePct / 100,
          avgWinPct: avgWinPct / 100,
          avgLossPct: avgLossPct / 100,
          atrPct: atrPct / 100,
          lotSize: parseNum(lotSize) ?? 1,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data?.error as string) || "Failed to compute position size");
        return;
      }

      setResult(data as PositionRecommendation);
      toast.success("Position size computed");
    } catch (error) {
      console.error("Position size error:", error);
      toast.error("Failed to compute position size");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-gray-600 bg-gray-800 p-4 md:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-700/50">
          <Calculator className="h-4 w-4 text-yellow-500" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Position size calculator</h3>
          <p className="mt-1 text-sm text-gray-400">
            Half-Kelly sizing scaled by volatility, then clamped by a deterministic risk gate
            (10% base limit, earnings proximity, VIX, available cash).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SizerField id="ps-symbol" label="Symbol" value={symbol} onChange={setSymbol} placeholder="INFY" />
        <SizerField
          id="ps-capital"
          label="Account capital"
          value={capital}
          onChange={setCapital}
          placeholder="e.g. 500000"
        />
        <SizerField
          id="ps-cash"
          label="Cash available"
          hint="Defaults to full account capital"
          value={cash}
          onChange={setCash}
          placeholder="optional"
        />
        <SizerField id="ps-price" label="Current price" value={price} onChange={setPrice} placeholder="e.g. 1520" />
        <SizerField
          id="ps-winrate"
          label="Win rate (%)"
          hint="Historical hit rate of the strategy"
          value={winRate}
          onChange={setWinRate}
          placeholder="55"
        />
        <SizerField
          id="ps-avgwin"
          label="Average win (%)"
          value={avgWin}
          onChange={setAvgWin}
          placeholder="5"
        />
        <SizerField
          id="ps-avgloss"
          label="Average loss (%)"
          value={avgLoss}
          onChange={setAvgLoss}
          placeholder="3"
        />
        <SizerField
          id="ps-atr"
          label="ATR (% of price)"
          hint="Daily true range as a percentage"
          value={atr}
          onChange={setAtr}
          placeholder="1.8"
        />
        <SizerField
          id="ps-lot"
          label="Lot size"
          hint="1 for cash equity, contract size for F&O"
          value={lotSize}
          onChange={setLotSize}
          placeholder="1"
        />
      </div>

      <Button onClick={calculate} disabled={loading} className="yellow-btn mt-5 w-full sm:w-auto sm:px-6">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Calculating
          </>
        ) : (
          <>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Calculate size
          </>
        )}
      </Button>

      {result ? (
        <div className="mt-6 rounded-lg border border-gray-600 bg-gray-700/30 p-4 md:p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Recommended qty", value: `${result.recommendedQty}` },
              { label: "Position value", value: money(result.recommendedValue) },
              { label: "Allocation", value: `${(result.recommendedPct * 100).toFixed(2)}%` },
              {
                label: "Binding constraint",
                value: result.bindingConstraint === "risk-gate" ? "Risk gate" : "Sizer",
              },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
                <p
                  className={cn(
                    "mt-1 text-lg font-semibold",
                    stat.label === "Recommended qty" && result.recommendedQty === 0
                      ? "text-red-400"
                      : "text-gray-100"
                  )}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-300">Constraints applied</p>
              <ul className="space-y-1.5">
                {(result.notes?.length ? result.notes : result.riskGate.constraints).map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-300">Sizing breakdown</p>
              <dl className="divide-y divide-gray-600">
                {[
                  { label: "Raw Kelly", value: result.sizing.rawKelly.toFixed(4) },
                  { label: "Half-Kelly applied", value: result.sizing.kellyFraction.toFixed(4) },
                  { label: "Volatility scalar", value: result.sizing.volatilityScalar.toFixed(3) },
                  { label: "Correlation penalty", value: `${(result.sizing.correlationPenalty * 100).toFixed(1)}%` },
                  { label: "Risk-gate share cap", value: `${result.riskGate.maxShares}` },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2">
                    <dt className="text-sm text-gray-400">{row.label}</dt>
                    <dd className="text-sm font-medium text-gray-100 tabular-nums">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <p className="mt-5 text-xs text-gray-500">{result.disclaimer}</p>
        </div>
      ) : null}
    </section>
  );
}
