"use client";

import { useEffect, useState } from "react";
import { Calculator, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { ActionButton } from "@/components/app/ActionButton";
import { FormField, Panel, TextInput } from "@/components/system";
import {
  PositionSizeResult,
  type PositionRecommendation,
} from "@/components/tools/valuation/PositionSizeResult";
import { parseNum } from "@/components/tools/valuation/types";

const FIELDS: {
  key: keyof SizerForm;
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
}[] = [
  { key: "symbol", id: "ps-symbol", label: "Symbol", placeholder: "INFY" },
  { key: "capital", id: "ps-capital", label: "Account capital", placeholder: "e.g. 500000" },
  {
    key: "cash",
    id: "ps-cash",
    label: "Cash available",
    hint: "Defaults to full account capital",
    placeholder: "optional",
  },
  { key: "price", id: "ps-price", label: "Current price", placeholder: "e.g. 1520" },
  {
    key: "winRate",
    id: "ps-winrate",
    label: "Win rate (%)",
    hint: "Historical hit rate of the strategy",
    placeholder: "55",
  },
  { key: "avgWin", id: "ps-avgwin", label: "Average win (%)", placeholder: "5" },
  { key: "avgLoss", id: "ps-avgloss", label: "Average loss (%)", placeholder: "3" },
  {
    key: "atr",
    id: "ps-atr",
    label: "ATR (% of price)",
    hint: "Daily true range as a percentage",
    placeholder: "1.8",
  },
  {
    key: "lotSize",
    id: "ps-lot",
    label: "Lot size",
    hint: "1 for cash equity, contract size for F&O",
    placeholder: "1",
  },
];

interface SizerForm {
  symbol: string;
  capital: string;
  cash: string;
  price: string;
  winRate: string;
  avgWin: string;
  avgLoss: string;
  atr: string;
  lotSize: string;
}

export default function PositionSizeCalculator({
  symbol: symbolFromValuation,
  currentPrice: priceFromValuation,
}: {
  symbol?: string;
  currentPrice?: string;
}) {
  const [form, setForm] = useState<SizerForm>({
    symbol: symbolFromValuation ?? "",
    capital: "",
    cash: "",
    price: priceFromValuation ?? "",
    winRate: "55",
    avgWin: "5",
    avgLoss: "3",
    atr: "1.8",
    lotSize: "1",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PositionRecommendation | null>(null);

  const set = (key: keyof SizerForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Follow the valuation form while the user has not overridden these fields.
  useEffect(() => {
    if (symbolFromValuation) {
      setForm((prev) => (prev.symbol ? prev : { ...prev, symbol: symbolFromValuation }));
    }
  }, [symbolFromValuation]);

  useEffect(() => {
    if (priceFromValuation) {
      setForm((prev) => (prev.price ? prev : { ...prev, price: priceFromValuation }));
    }
  }, [priceFromValuation]);

  async function calculate() {
    const sym = form.symbol.trim().toUpperCase();
    const accountCapital = parseNum(form.capital);
    const currentPrice = parseNum(form.price);
    const winRatePct = parseNum(form.winRate);
    const avgWinPct = parseNum(form.avgWin);
    const avgLossPct = parseNum(form.avgLoss);
    const atrPct = parseNum(form.atr);

    if (!sym) return toast.error("Symbol is required");
    if (accountCapital === null || accountCapital <= 0)
      return toast.error("Account capital must be greater than zero");
    if (currentPrice === null || currentPrice <= 0)
      return toast.error("Current price must be greater than zero");
    if (winRatePct === null || winRatePct < 0 || winRatePct > 100)
      return toast.error("Win rate must be between 0 and 100");
    if (avgWinPct === null || avgWinPct <= 0)
      return toast.error("Average win % must be greater than zero");
    if (avgLossPct === null || avgLossPct <= 0)
      return toast.error("Average loss % must be greater than zero");
    if (atrPct === null || atrPct < 0) return toast.error("ATR % must be zero or greater");

    setLoading(true);
    try {
      const res = await fetch("/api/analysis/position-size", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: sym,
          accountCapital,
          cashAvailable: parseNum(form.cash) ?? accountCapital,
          currentPrice,
          // The API takes fractions, the form takes percentages.
          winRate: winRatePct / 100,
          avgWinPct: avgWinPct / 100,
          avgLossPct: avgLossPct / 100,
          atrPct: atrPct / 100,
          lotSize: parseNum(form.lotSize) ?? 1,
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
    <Panel
      title={
        <span className="flex items-center gap-2">
          <Calculator className="size-4 text-brand" aria-hidden />
          Position size calculator
        </span>
      }
      description="Half-Kelly sizing scaled by volatility, then clamped by a deterministic risk gate (10% base limit, earnings proximity, VIX, available cash)."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FIELDS.map((field) => (
          <FormField key={field.key} id={field.id} label={field.label} hint={field.hint}>
            {(props) => (
              <TextInput
                {...props}
                inputMode="decimal"
                value={form[field.key]}
                placeholder={field.placeholder}
                onChange={(e) => set(field.key, e.target.value)}
              />
            )}
          </FormField>
        ))}
      </div>

      <ActionButton
        variant="brand"
        onClick={calculate}
        loading={loading}
        className="mt-5 w-full sm:w-auto sm:px-6"
      >
        {!loading && <ShieldCheck aria-hidden />}
        {loading ? "Calculating" : "Calculate size"}
      </ActionButton>

      {result && <PositionSizeResult result={result} />}
    </Panel>
  );
}
