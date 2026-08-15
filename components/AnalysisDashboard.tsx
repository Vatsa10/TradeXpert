
"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { startAnalysisAction, getAnalysisStatusAction } from "@/lib/actions/analysis.actions";
import { InvestmentReport as StockAnalysisReport } from "@/lib/analysis/types";
import { getStocksDetails, searchStocks } from "@/lib/actions/finnhub.actions";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, BarChart3, PieChart, Info, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import TradingViewWidget from "@/components/TradingViewWidget";
import { SYMBOL_INFO_WIDGET_CONFIG, TECHNICAL_ANALYSIS_WIDGET_CONFIG } from "@/lib/constants";
import InstantSnapshot from "@/components/analysis/InstantSnapshot";
import {
  QualStageCard,
  QuantStageCard,
  StageErrorCard,
  StageRail,
  StageSkeleton,
} from "@/components/analysis/AnalysisStages";
import {
  isIndianSymbol,
  normalizeInstantPanel,
  normalizeQual,
  normalizeQuant,
  stageStateFrom,
  type InstantPanelView,
  type StageKey,
  type StageState,
} from "@/components/analysis/progressive-types";
import { QualitativeAnalysis, QuantitativeAnalysis } from "@/lib/analysis/types";

const POLL_INTERVAL_MS = 2000;

export default function AnalysisDashboard({
  initialRequestId,
  onComplete
}: {
  initialRequestId?: string | null;
  onComplete?: () => void;
}) {
  const [mode, setMode] = useState<"single" | "compare">("single");
  const [symbol, setSymbol] = useState("");
  const [symbolB, setSymbolB] = useState(""); // For comparison mode

  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(initialRequestId || null);
  const [requestIdB, setRequestIdB] = useState<string | null>(null);

  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "error">("idle");
  const [report, setReport] = useState<StockAnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Progressive stage payloads. All optional: analyses created before the
  // staged pipeline simply never populate them and render report-only.
  const [instantPanel, setInstantPanel] = useState<InstantPanelView | null>(null);
  const [quant, setQuant] = useState<QuantitativeAnalysis | null>(null);
  const [qual, setQual] = useState<QualitativeAnalysis | null>(null);
  const [stageErrors, setStageErrors] = useState<Partial<Record<StageKey, string>>>({});
  const [serverStages, setServerStages] = useState<Partial<Record<StageKey, StageState>>>({});

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
          let resA = requestId ? await getAnalysisStatusAction(requestId) : null;
          // Check Stock B
          let resB = requestIdB ? await getAnalysisStatusAction(requestIdB) : null;

          // Reveal whatever stages have landed so far (single-symbol mode only:
          // the comparison view renders from the two finished reports).
          if (mode === "single") applyStageData(resA);

          const doneA = !requestId || (resA?.status === "completed");
          const doneB = !requestIdB || (resB?.status === "completed");
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

  const [suggestionsA, setSuggestionsA] = useState<any[]>([]);
  const [suggestionsB, setSuggestionsB] = useState<any[]>([]);

  // Track if we just selected a symbol to prevent dropdown from reappearing immediately
  const justSelected = useRef(false);

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

      toast.info(mode === "compare" ? "Dual-stock analysis initialized" : "Analysis initialized...");
    } catch (err: any) {
      console.error("Start analysis error:", err);
      setError(err.message || "Failed to start analysis");
      setStatus("error");
      setLoading(false);
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

  const progressiveSection = (awaitingReport: boolean) => (
    <div className="space-y-4">
      <StageRail stages={stageStates} />

      {instantPanel ? (
        <InstantSnapshot panel={instantPanel} />
      ) : stageErrors.instant ? (
        <StageErrorCard title="Instant Snapshot" message={stageErrors.instant} />
      ) : (
        <StageSkeleton label="Building instant snapshot…" />
      )}

      {quant ? (
        <QuantStageCard quant={quant} currency={currency} error={stageErrors.quant} />
      ) : stageErrors.quant ? (
        <StageErrorCard title="Quantitative Agent" message={stageErrors.quant} />
      ) : (
        <StageSkeleton label="Quantitative agent analyzing…" />
      )}

      {qual ? (
        <QualStageCard qual={qual} error={stageErrors.qual} />
      ) : stageErrors.qual ? (
        <StageErrorCard title="Sentiment Agent" message={stageErrors.qual} />
      ) : (
        <StageSkeleton label="Sentiment agent analyzing…" />
      )}

      {awaitingReport &&
        (stageErrors.report ? (
          <StageErrorCard title="Investment Memo" message={stageErrors.report} />
        ) : (
          <StageSkeleton label="Compiling investment memo…" />
        ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Search Mode Toggle - Improved with border-b-2 */}
      <div className="flex items-center justify-start border-b border-[#27272A] gap-4">
        <button
          onClick={() => setMode("single")}
          className={cn(
            "pb-3 text-sm font-medium uppercase tracking-wider transition-all relative",
            mode === "single" ? "text-white" : "text-gray-500 hover:text-gray-300"
          )}
        >
          Single Analysis
          {mode === "single" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
        </button>
        <button
          onClick={() => setMode("compare")}
          className={cn(
            "pb-3 text-sm font-medium uppercase tracking-wider transition-all relative",
            mode === "compare" ? "text-white" : "text-gray-500 hover:text-gray-300"
          )}
        >
          Comparative
          {mode === "compare" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
        </button>
      </div>

      {/* Command Bar - Input Section */}
      <div className="bg-[#1A1A1A] border border-[#27272A] rounded-xl p-2">
        <form
          onSubmit={handleStartAnalysis}
          className="flex flex-col md:flex-row items-center gap-2"
        >
          <div className="flex-1 flex flex-col md:flex-row items-center gap-2 w-full">
            {/* Input A - Command bar style */}
            <div className="flex-1 relative w-full">
              <div className="flex items-center px-4 gap-3 bg-[#111111] border border-[#27272A] rounded-lg w-full focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder={mode === "single" ? "Enter ticker (AAPL, TSLA, NVDA...)" : "Ticker 1"}
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && symbol) {
                      e.preventDefault();
                      handleStartAnalysis(e as any);
                    }
                  }}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-zinc-500 font-medium py-3 text-sm"
                  disabled={loading}
                  required
                />
              </div>
              {/* Auto-complete dropdown */}
              {suggestionsA.length > 0 && (
                 <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-[#27272A] rounded-xl shadow-2xl z-50 overflow-hidden py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {suggestionsA.map((s, idx) => (
                       <button
                          key={`${s.symbol}-${idx}`}
                          type="button"
                          onClick={() => { justSelected.current = true; setSymbol(s.symbol); setSuggestionsA([]); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-500/10 transition-colors group"
                       >
                          <div className="flex items-center gap-3">
                             <span className="text-sm font-bold text-blue-400 tracking-widest">{s.symbol}</span>
                             <span className="text-xs text-gray-400 font-medium truncate max-w-[150px]">{s.name}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400" />
                       </button>
                    ))}
                 </div>
               )}
            </div>

            {mode === "compare" && (
              <>
                 <div className="px-1 text-xs text-gray-500 font-bold uppercase tracking-tighter">vs</div>
                 {/* Input B */}
                 <div className="flex-1 relative w-full">
                    <div className="flex items-center px-4 gap-3 bg-[#111111] border border-[#27272A] rounded-lg w-full focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
                      <Search className="w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Ticker 2"
                        value={symbolB}
                        onChange={(e) => setSymbolB(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && symbolB) {
                            e.preventDefault();
                            handleStartAnalysis(e as any);
                          }
                        }}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-zinc-500 font-medium py-3 text-sm"
                        disabled={loading}
                        required
                      />
                    </div>
                    {suggestionsB.length > 0 && (
                       <div className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-[#27272A] rounded-xl shadow-2xl z-50 overflow-hidden py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {suggestionsB.map((s, idx) => (
                             <button
                                key={`${s.symbol}-${idx}`}
                                type="button"
                                onClick={() => { justSelected.current = true; setSymbolB(s.symbol); setSuggestionsB([]); }}
                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-500/10 transition-colors group"
                             >
                                <div className="flex items-center gap-3">
                                   <span className="text-sm font-bold text-blue-400 tracking-widest">{s.symbol}</span>
                                   <span className="text-xs text-gray-400 font-medium truncate max-w-[150px]">{s.name}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400" />
                             </button>
                          ))}
                       </div>
                    )}
                 </div>
               </>
             )}
          </div>

          {/* CTA Button - Prominent */}
          <Button
            type="submit"
            disabled={loading || !symbol || (mode === "compare" && !symbolB)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-8 rounded-lg shadow-lg disabled:opacity-50 w-full md:w-auto text-sm transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
          </Button>
        </form>
        
        {/* Quick ticker suggestions */}
        {!loading && status === "idle" && (
          <div className="flex gap-2 mt-3 px-2">
            <span className="text-xs text-zinc-600 self-center">Popular:</span>
            {["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL"].map((ticker) => (
              <button
                key={ticker}
                onClick={() => {
                  setSymbol(ticker);
                  justSelected.current = true;
                }}
                className="text-xs bg-[#27272A] hover:bg-[#3A3A3A] text-gray-400 hover:text-white px-2.5 py-1 rounded-md transition-colors"
              >
                {ticker}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Container */}
      <div className="min-h-[400px]">
        {status === "processing" && showProgressive && progressiveSection(true)}

        {status === "processing" && !showProgressive && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 border border-blue-500/20 rounded-full animate-ping" />
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-base font-semibold text-white tracking-wide">Running Multi-Agent Analysis</h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto">Analyzing {symbol.toUpperCase() || symbolB.toUpperCase()} through our AI agents...</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center border border-red-500/20 rounded-2xl bg-red-500/[0.02]">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <div className="space-y-2">
              <h2 className="text-base font-bold text-white">Analysis Failed</h2>
              <p className="text-sm text-gray-400 max-w-xs">{error || "Data service unavailable for this symbol."}</p>
            </div>
            <Button 
              onClick={() => setStatus("idle")} 
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </Button>
          </div>
        )}

        {status === "completed" && report && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-1000">
            {/* Stage output kept above the memo; absent for pre-pipeline analyses. */}
            {showProgressive && progressiveSection(false)}

            {/* Real-time Technical Visuals Overlay */}
            <div className="space-y-6">
              {/* Main Technical Chart - Full Width */}
              <div className="bg-[#111111] border border-[#27272A] rounded-2xl overflow-hidden shadow-sm h-[450px]">
                <TradingViewWidget
                  scriptUrl="https://www.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
                  config={{
                    "width": "100%",
                    "height": 450,
                    "symbol": report.stock_symbol.includes(":") ? report.stock_symbol : `NASDAQ:${report.stock_symbol}`,
                    "interval": "D",
                    "timezone": "Etc/UTC",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "enable_publishing": false,
                    "allow_symbol_change": true,
                    "calendar": false,
                    "support_host": "https://www.tradingview.com"
                  }}
                  height={450}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1 space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest leading-none">Market Pulse</span>
                    </div>
                    <div className="bg-[#111111] border border-[#27272A] rounded-2xl overflow-hidden shadow-sm h-[200px]">
                      <TradingViewWidget
                          scriptUrl="https://www.tradingview.com/external-embedding/embed-widget-symbol-info.js"
                          config={SYMBOL_INFO_WIDGET_CONFIG(report.stock_symbol)}
                          height={200}
                        />
                    </div>
                  </div>
                  <div className="md:col-span-3 space-y-4">
                    <div className="flex items-center gap-2 px-1 justify-end">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest leading-none">Technical Indicators</span>
                    </div>
                    <div className="bg-[#111111] border border-[#27272A] rounded-2xl overflow-hidden shadow-sm h-[200px]">
                       <TradingViewWidget
                          scriptUrl="https://www.tradingview.com/external-embedding/embed-widget-technical-analysis.js"
                          config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(report.stock_symbol)}
                          height={200}
                        />
                    </div>
                  </div>
              </div>
            </div>

            {/* Report Header Section */}
            <div className="flex flex-col md:flex-row gap-10 items-start justify-between border-b border-[#27272A] pb-8">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-widest leading-none">Investment Memo</span>
                  <div className="w-1 h-1 bg-[#27272A] rounded-full" />
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-widest leading-none">{report.report_date}</span>
                </div>
                <h2 className="text-4xl font-semibold text-white tracking-tight leading-none">
                  {report.company_name} <span className="text-gray-600 font-normal">/</span> <span className="text-gray-500 font-medium">{report.stock_symbol}</span>
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
                  {report.executive_summary}
                </p>
              </div>

              <div className={cn(
                "p-6 rounded-2xl border flex flex-col items-center justify-center min-w-[200px] shadow-sm",
                report.investment_recommendation.includes("Buy") ? "bg-emerald-500/[0.03] border-emerald-500/30" :
                  report.investment_recommendation.includes("Sell") ? "bg-red-500/[0.03] border-red-500/30" :
                    "bg-amber-500/[0.03] border-amber-500/30"
              )}>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500 mb-2">Verdict</span>
                <h3 className={cn(
                  "text-2xl font-bold tracking-tight mb-2",
                  report.investment_recommendation.includes("Buy") ? "text-emerald-400" :
                    report.investment_recommendation.includes("Sell") ? "text-red-400" :
                      "text-amber-400"
                )}>
                  {report.investment_recommendation}
                </h3>
                <div className="flex items-center gap-1.5 mt-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className={cn(
                      "w-1 h-3 rounded-full",
                      (report.confidence_level / 20) >= s ? "bg-blue-500" : "bg-[#27272A]"
                    )} />
                  ))}
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-tighter ml-1">{report.confidence_level}% Confidence</span>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-12">
                <section className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-3">
                    <span className="w-4 h-[1px] bg-[#27272A]" /> Quantitative Research
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed font-normal whitespace-pre-wrap">{report.quantitative_summary}</p>
                </section>

                <section className="space-y-4">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-3">
                    <span className="w-4 h-[1px] bg-[#27272A]" /> Qualitative Analysis
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed font-normal whitespace-pre-wrap">{report.qualitative_summary}</p>
                </section>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#111111] border border-[#27272A] rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-blue-400">Key Rationale</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {report.recommendation_rationale}
                  </p>
                </div>

                <div className="bg-red-500/[0.03] border border-red-500/20 rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-red-400">Risk Profile</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {report.risk_assessment}
                  </p>
                  <div className="pt-3 border-t border-red-500/20">
                    <div className="flex justify-between items-center text-xs font-medium text-gray-500">
                      <span>MT-SCORE</span>
                      <span className="text-red-400">Elevated</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-[#111111] border border-[#27272A] rounded-xl space-y-3">
                  <div className="w-8 h-8 bg-[#1A1A1A] rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  <h4 className="font-semibold text-sm text-white">Horizon</h4>
                  <p className="text-sm text-gray-400 leading-relaxed">Strategic window set for <span className="text-white font-medium">{report.analysis_period}</span> based on multi-agent synthesis.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Guided with quick actions */}
        {status === "idle" && (
          <div className="flex flex-col items-center justify-center py-32 animate-in fade-in duration-500">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 bg-[#111111] border border-[#27272A] rounded-2xl flex items-center justify-center mx-auto">
                <BarChart3 className="w-8 h-8 text-blue-500/60" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-white">Start an Analysis</h2>
                <p className="text-sm text-gray-500">
                  Enter a stock ticker above to generate AI-powered investment insights
                </p>
              </div>
              
              {/* Quick action buttons */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN"].map((ticker) => (
                  <button
                    key={ticker}
                    onClick={() => {
                      setSymbol(ticker);
                      justSelected.current = true;
                    }}
                    className="bg-[#1A1A1A] hover:bg-[#27272A] border border-[#27272A] hover:border-blue-500/30 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    {ticker}
                  </button>
                ))}
              </div>
              
              <p className="text-xs text-gray-600 mt-4">
                Or type any ticker symbol to analyze
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
