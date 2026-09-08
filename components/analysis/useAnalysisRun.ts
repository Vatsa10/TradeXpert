"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getAnalysisStatusAction, startAnalysisAction } from "@/lib/actions/analysis.actions";
import { getStocksDetails, searchStocks } from "@/lib/actions/finnhub.actions";
import type {
  InvestmentReport as StockAnalysisReport,
  QualitativeAnalysis,
  QuantitativeAnalysis,
} from "@/lib/analysis/types";

import {
  isIndianSymbol,
  normalizeInstantPanel,
  normalizeQual,
  normalizeQuant,
  stageStateFrom,
  type InstantPanelView,
  type StageKey,
  type StageState,
} from "./progressive-types";

export const POLL_INTERVAL_MS = 2000;

export type AnalysisMode = "single" | "compare";
export type AnalysisStatus = "idle" | "processing" | "completed" | "error";

/**
 * All of the progressive-analysis machinery, lifted out of the dashboard so the
 * presentation layer stays declarative.
 *
 * Contract notes (do not change without changing the server):
 *  - the instant panel arrives on `startAnalysisAction`'s response and paints
 *    before the first poll fires;
 *  - polling runs every {@link POLL_INTERVAL_MS} and reveals
 *    quant -> qual -> report as they land;
 *  - stage state is read from `stages.<key>.state` via `stageStateFrom`.
 */
export function useAnalysisRun({
  initialRequestId,
  onComplete,
}: {
  initialRequestId?: string | null;
  onComplete?: () => void;
}) {
  const [mode, setMode] = useState<AnalysisMode>("single");
  const [symbol, setSymbol] = useState("");
  const [symbolB, setSymbolB] = useState(""); // For comparison mode

  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(initialRequestId || null);
  const [requestIdB, setRequestIdB] = useState<string | null>(null);

  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [report, setReport] = useState<StockAnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Progressive stage payloads. All optional: analyses created before the
  // staged pipeline simply never populate them and render report-only.
  const [instantPanel, setInstantPanel] = useState<InstantPanelView | null>(null);
  const [quant, setQuant] = useState<QuantitativeAnalysis | null>(null);
  const [qual, setQual] = useState<QualitativeAnalysis | null>(null);
  const [stageErrors, setStageErrors] = useState<Partial<Record<StageKey, string>>>({});
  const [serverStages, setServerStages] = useState<Partial<Record<StageKey, StageState>>>({});

  const [suggestionsA, setSuggestionsA] = useState<any[]>([]);
  const [suggestionsB, setSuggestionsB] = useState<any[]>([]);

  // Track if we just selected a symbol to prevent dropdown from reappearing immediately
  const justSelected = useRef(false);

  const router = useRouter();

  const resetStages = () => {
    setInstantPanel(null);
    setQuant(null);
    setQual(null);
    setStageErrors({});
    setServerStages({});
  };

  /** Folds one polling response into the per-stage UI state. */
  const applyStageData = (res: any, fallbackSymbol?: string) => {
    if (!res) return;

    const panel = normalizeInstantPanel(res.instant_panel, fallbackSymbol || res.symbol);
    if (panel) setInstantPanel(panel);

    const nextQuant = normalizeQuant(res.quant_analysis);
    if (nextQuant) setQuant(nextQuant);

    const nextQual = normalizeQual(res.qual_analysis);
    if (nextQual) setQual(nextQual);

    const stages = res.stages;
    if (stages && typeof stages === "object") {
      const states: Partial<Record<StageKey, StageState>> = {};
      const errors: Partial<Record<StageKey, string>> = {};
      (["instant", "quant", "qual", "report"] as StageKey[]).forEach((key) => {
        const state = stageStateFrom(stages[key]);
        if (state) states[key] = state;
        if (typeof stages[key]?.error === "string" && stages[key].error) {
          errors[key] = stages[key].error;
        }
      });
      setServerStages(states);
      setStageErrors(errors);
    }
  };

  // Handle loading initial report from history
  useEffect(() => {
    if (initialRequestId) {
      const loadHistory = async () => {
        setLoading(true);
        setStatus("processing");
        try {
          const res = await getAnalysisStatusAction(initialRequestId);
          resetStages();
          applyStageData(res);
          if (res.status === "completed" && res.report) {
            setReport(res.report as StockAnalysisReport);
            setStatus("completed");
            justSelected.current = true;
            setSymbol(res.symbol || "");
          } else {
            setRequestId(initialRequestId);
          }
        } catch (err) {
          console.error("Failed to load history item", err);
          setError("Failed to load history");
          setStatus("error");
        } finally {
          setLoading(false);
        }
      };
      loadHistory();
    }
  }, [initialRequestId]);

  // Polling for analysis result(s)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if ((requestId || requestIdB) && status === "processing") {
      interval = setInterval(async () => {
        try {
          // Check Stock A
          const resA = requestId ? await getAnalysisStatusAction(requestId) : null;
          // Check Stock B
          const resB = requestIdB ? await getAnalysisStatusAction(requestIdB) : null;

          // Reveal whatever stages have landed so far (single-symbol mode only:
          // the comparison view renders from the two finished reports).
          if (mode === "single") applyStageData(resA);

          const doneA = !requestId || resA?.status === "completed";
          const doneB = !requestIdB || resB?.status === "completed";
          const errorA = resA?.status === "error";
          const errorB = resB?.status === "error";

          if (errorA || errorB) {
            setError(resA?.error || resB?.error || "Analysis failed");
            setStatus("error");
            setLoading(false);
            setRequestId(null);
            setRequestIdB(null);
            toast.error("Analysis interrupted");
            return;
          }

          if (doneA && doneB) {
            if (mode === "compare" && resA?.request_id && resB?.request_id) {
              toast.success("Comparative analysis complete!");
              router.push(`/analysis/compare?ids=${resA.request_id},${resB.request_id}`);
            } else if (resA?.report) {
              setReport(resA.report as StockAnalysisReport);
              setStatus("completed");
              toast.success("Report generated!");

              // Update URL to reflect the new report
              if (resA.request_id) {
                router.push(`/analysis/${resA.request_id}`);
              }
            }

            setLoading(false);
            setRequestId(null);
            setRequestIdB(null);
            onComplete?.(); // Refresh history
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, POLL_INTERVAL_MS);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [requestId, requestIdB, status, onComplete, mode, router]);

  // Fuzzy Search Effect for Symbol A
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (symbol.length < 2 || justSelected.current) {
        setSuggestionsA([]);
        if (justSelected.current) justSelected.current = false;
        return;
      }
      const results = await searchStocks(symbol);
      setSuggestionsA(results);
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [symbol]);

  // Fuzzy Search Effect for Symbol B
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (symbolB.length < 2 || justSelected.current) {
        setSuggestionsB([]);
        if (justSelected.current) justSelected.current = false;
        return;
      }
      const results = await searchStocks(symbolB);
      setSuggestionsB(results);
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [symbolB]);

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol) return;
    if (mode === "compare" && !symbolB) return;

    setLoading(true);
    setStatus("processing");
    setError(null);
    setReport(null);
    setSuggestionsA([]);
    setSuggestionsB([]);
    resetStages();

    try {
      // 1. Fetch Company Name(s) - Optional but good for DB
      const detailsA = await getStocksDetails(symbol);
      const nameA = detailsA?.company || symbol;

      // 2. Start Analysis for A
      const resA = await startAnalysisAction(symbol.toUpperCase(), nameA);
      setRequestId(resA.request_id);

      // The instant panel comes back with the very first response, so it paints
      // before the first poll ever fires.
      if (mode === "single") {
        const panel = normalizeInstantPanel(resA.instant_panel, symbol.toUpperCase());
        if (panel) setInstantPanel(panel);
      }

      // 3. Start Analysis for B if in compare mode
      if (mode === "compare") {
        const detailsB = await getStocksDetails(symbolB);
        const nameB = detailsB?.company || symbolB;
        const resB = await startAnalysisAction(symbolB.toUpperCase(), nameB);
        setRequestIdB(resB.request_id);
      }

      toast.info(
        mode === "compare" ? "Dual-stock analysis initialized" : "Analysis initialized..."
      );
    } catch (err: any) {
      console.error("Start analysis error:", err);
      setError(err.message || "Failed to start analysis");
      setStatus("error");
      setLoading(false);
    }
  };

  const pickSymbol = (which: "a" | "b", value: string) => {
    justSelected.current = true;
    if (which === "a") {
      setSymbol(value);
      setSuggestionsA([]);
    } else {
      setSymbolB(value);
      setSuggestionsB([]);
    }
  };

  const currency: "INR" | "USD" =
    instantPanel?.currency ?? (isIndianSymbol(symbol) ? "INR" : "USD");

  const stageState = (key: StageKey, hasPayload: boolean): StageState =>
    hasPayload ? "done" : stageErrors[key] ? "error" : (serverStages[key] ?? "pending");

  const stageStates: Record<StageKey, StageState> = {
    instant: stageState("instant", !!instantPanel),
    quant: stageState("quant", !!quant),
    qual: stageState("qual", !!qual),
    report: stageState("report", !!report),
  };

  // Only single-symbol runs are progressive; comparisons render from the two
  // finished reports on the compare route.
  const showProgressive =
    mode === "single" &&
    (!!instantPanel || !!quant || !!qual || Object.keys(serverStages).length > 0);

  return {
    mode,
    setMode,
    symbol,
    setSymbol,
    symbolB,
    setSymbolB,
    loading,
    status,
    setStatus,
    report,
    error,
    instantPanel,
    quant,
    qual,
    stageErrors,
    stageStates,
    showProgressive,
    currency,
    suggestionsA,
    suggestionsB,
    pickSymbol,
    handleStartAnalysis,
  };
}
