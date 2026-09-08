"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { ActionButton } from "@/components/app/ActionButton";
import { FormField, InlineNotice, Panel, TextInput } from "@/components/system";
import PositionSizeCalculator from "@/components/tools/PositionSizeCalculator";
import {
  DcfAssumptions,
  type DcfField,
  type DcfForm,
} from "@/components/tools/valuation/DcfAssumptions";
import { DcfResults } from "@/components/tools/valuation/DcfResults";
import { GrowthSummary, toGrowthRows } from "@/components/tools/valuation/GrowthSummary";
import {
  parseNum,
  type DCFResponse,
  type FundamentalsResponse,
} from "@/components/tools/valuation/types";

const INITIAL_FORM: DcfForm = {
  currentFCF: "",
  sharesOutstanding: "",
  netDebt: "",
  beta: "1.0",
  debtToEquity: "0",
  growth1: "12",
  growth2: "6",
  currentPrice: "",
};

/**
 * Two-stage DCF workspace. API contracts preserved exactly:
 * GET /api/analysis/fundamentals?symbol=… and POST /api/analysis/dcf.
 */
export default function ValuationClient() {
  const [symbol, setSymbol] = useState("");
  const [loadingFundamentals, setLoadingFundamentals] = useState(false);
  const [fundamentals, setFundamentals] = useState<FundamentalsResponse | null>(null);
  const [fundamentalsError, setFundamentalsError] = useState<string | null>(null);

  // DCF form (strings so the inputs stay controlled and clearable)
  const [form, setForm] = useState<DcfForm>(INITIAL_FORM);
  const setField = (key: DcfField, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const [runningDCF, setRunningDCF] = useState(false);
  const [dcf, setDCF] = useState<DCFResponse | null>(null);

  const price = parseNum(form.currentPrice);

  const upside = useMemo(() => {
    if (!dcf || price === null || price <= 0) return null;
    return ((dcf.dcf.fairValuePerShare - price) / price) * 100;
  }, [dcf, price]);

  const growthRows = useMemo(() => toGrowthRows(fundamentals), [fundamentals]);

  async function loadFundamentals() {
    const sym = symbol.trim().toUpperCase();
    if (!sym) {
      toast.error("Enter a symbol first");
      return;
    }

    setLoadingFundamentals(true);
    setFundamentalsError(null);

    try {
      const res = await fetch(`/api/analysis/fundamentals?symbol=${encodeURIComponent(sym)}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Alpha Vantage free tier throttles hard; make that recoverable rather
        // than terminal — manual entry below is always available.
        const message =
          res.status === 429
            ? "Rate limit reached on the fundamentals provider. Enter the DCF inputs manually below."
            : (data?.error as string) || `Failed to load fundamentals for ${sym}`;
        setFundamentalsError(message);
        toast.error(message);
        return;
      }

      const payload = data as FundamentalsResponse;
      setFundamentals(payload);

      const inputs = payload.dcfInputs ?? {
        currentFCF: null,
        netDebt: null,
        sharesOutstanding: null,
        missing: [],
      };
      setForm((prev) => ({
        ...prev,
        currentFCF: inputs.currentFCF !== null ? String(inputs.currentFCF) : prev.currentFCF,
        netDebt: inputs.netDebt !== null ? String(inputs.netDebt) : prev.netDebt,
        sharesOutstanding:
          inputs.sharesOutstanding !== null
            ? String(inputs.sharesOutstanding)
            : prev.sharesOutstanding,
      }));

      const missing = inputs.missing ?? [];
      if (missing.length) {
        setFundamentalsError(
          `Partial data for ${sym}: ${missing.join(", ")} not reported. Fill those in manually.`
        );
        toast.warning(`Loaded ${sym} with gaps — ${missing.join(", ")} needs manual entry`);
      } else {
        toast.success(`Fundamentals loaded for ${sym}`);
      }
    } catch (error) {
      console.error("Fundamentals load error:", error);
      const message = "Could not reach the fundamentals service. Enter inputs manually below.";
      setFundamentalsError(message);
      toast.error(message);
    } finally {
      setLoadingFundamentals(false);
    }
  }

  async function runDCF() {
    const fcf = parseNum(form.currentFCF);
    const shares = parseNum(form.sharesOutstanding);

    if (fcf === null) {
      toast.error("Current free cash flow is required");
      return;
    }
    if (shares === null || shares <= 0) {
      toast.error("Shares outstanding must be greater than zero");
      return;
    }

    setRunningDCF(true);
    try {
      const res = await fetch("/api/analysis/dcf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentFCF: fcf,
          sharesOutstanding: shares,
          netDebt: parseNum(form.netDebt) ?? 0,
          beta: parseNum(form.beta) ?? 1,
          debtToEquity: parseNum(form.debtToEquity) ?? 0,
          growthRateStage1: parseNum(form.growth1) ?? 12,
          growthRateStage2: parseNum(form.growth2) ?? 6,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data?.error as string) || "DCF failed");
        return;
      }

      setDCF(data as DCFResponse);
      toast.success("Fair value computed");
    } catch (error) {
      console.error("DCF error:", error);
      toast.error("Failed to compute DCF");
    } finally {
      setRunningDCF(false);
    }
  }

  return (
    <>
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FormField id="valuation-symbol" label="Symbol" className="flex-1">
            {(props) => (
              <TextInput
                {...props}
                placeholder="e.g. INFY, RELIANCE.BSE, AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") loadFundamentals();
                }}
              />
            )}
          </FormField>

          <ActionButton
            variant="brand"
            onClick={loadFundamentals}
            loading={loadingFundamentals}
            className="w-full sm:w-auto sm:px-6"
          >
            {!loadingFundamentals && <Search aria-hidden />}
            {loadingFundamentals ? "Loading" : "Load fundamentals"}
          </ActionButton>
        </div>

        {fundamentalsError && (
          <InlineNotice tone="warn" className="mt-4">
            {fundamentalsError}
          </InlineNotice>
        )}
      </Panel>

      <GrowthSummary symbol={fundamentals?.symbol} rows={growthRows} />

      <DcfAssumptions form={form} onChange={setField} onRun={runDCF} running={runningDCF} />

      {dcf && (
        <DcfResults
          dcf={dcf}
          price={price}
          upside={upside}
          debtToEquity={parseNum(form.debtToEquity)}
        />
      )}

      <PositionSizeCalculator
        symbol={symbol.trim().toUpperCase()}
        currentPrice={form.currentPrice}
      />
    </>
  );
}
