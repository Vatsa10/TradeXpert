
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

  const router = useRouter();

  // Handle loading initial report from history
  useEffect(() => {
    if (initialRequestId) {
      const loadHistory = async () => {
        setLoading(true);
        setStatus("processing");
        try {
          const res = await getAnalysisStatusAction(initialRequestId);
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
      }, 3000);
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

    try {
      // 1. Fetch Company Name(s) - Optional but good for DB
      const detailsA = await getStocksDetails(symbol);
      const nameA = detailsA?.company || symbol;

      // 2. Start Analysis for A
      const resA = await startAnalysisAction(symbol.toUpperCase(), nameA);
      setRequestId(resA.request_id);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Search Mode Toggle - Subtle */}
      <div className="flex items-center justify-start border-b border-white/[0.04] p-1 gap-6">
        <button
          onClick={() => setMode("single")}
          className={cn(
            "pb-3 text-xs font-semibold uppercase tracking-wider transition-all relative",
            mode === "single" ? "text-white" : "text-gray-600 hover:text-gray-400"
          )}
        >
          Single Analysis
          {mode === "single" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />}
        </button>
        <button
          onClick={() => setMode("compare")}
          className={cn(
            "pb-3 text-xs font-semibold uppercase tracking-wider transition-all relative",
            mode === "compare" ? "text-white" : "text-gray-600 hover:text-gray-400"
          )}
        >
          Comparative
          {mode === "compare" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />}
        </button>
      </div>

      {/* Search Tool */}
      <div className="bg-[#0A0A0B] border border-white/[0.04] rounded-xl p-1.5 shadow-sm">
        <form
          onSubmit={handleStartAnalysis}
          className="flex flex-col md:flex-row items-center gap-2"
        >
          <div className="flex-1 flex flex-col md:flex-row items-center gap-2 w-full">
            {/* Input A */}
            <div className="flex-1 relative w-full">
              <div className="flex items-center px-4 gap-3 bg-white/[0.01] border border-white/[0.02] rounded-lg w-full">
                <Search className="w-4 h-4 text-gray-700" />
                <input
                  type="text"
                  placeholder={mode === "single" ? "Enter ticker (e.g. AAPL)" : "Ticker 1"}
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-700 font-medium py-3 text-sm"
                  disabled={loading}
                  required
                />
              </div>
              {suggestionsA.length > 0 && (
                 <div className="absolute top-full left-0 right-0 mt-1 bg-[#0D0D0E] border border-white/[0.06] rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                    {suggestionsA.map((s, idx) => (
                       <button
                          key={`${s.symbol}-${idx}`}
                          type="button"
                          onClick={() => { justSelected.current = true; setSymbol(s.symbol); setSuggestionsA([]); }}
                          className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/[0.02] transition-colors group"
                       >
                          <div className="flex items-center gap-3">
                             <span className="text-xs font-bold text-white tracking-widest">{s.symbol}</span>
                             <span className="text-[10px] text-gray-600 font-medium truncate max-w-[150px] uppercase">{s.name}</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-gray-800 group-hover:text-gray-500" />
                       </button>
                    ))}
                 </div>
              )}
            </div>

            {mode === "compare" && (
              <>
                 <div className="px-1 text-[10px] text-gray-700 font-bold uppercase tracking-tighter">vs</div>
                 {/* Input B */}
                 <div className="flex-1 relative w-full">
                    <div className="flex items-center px-4 gap-3 bg-white/[0.01] border border-white/[0.02] rounded-lg w-full">
                      <Search className="w-4 h-4 text-gray-700" />
                      <input
                        type="text"
                        placeholder="Ticker 2"
                        value={symbolB}
                        onChange={(e) => setSymbolB(e.target.value)}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-700 font-medium py-3 text-sm"
                        disabled={loading}
                        required
                      />
                    </div>
                    {suggestionsB.length > 0 && (
                       <div className="absolute top-full left-0 right-0 mt-1 bg-[#0D0D0E] border border-white/[0.06] rounded-xl shadow-2xl z-50 overflow-hidden py-1">
                          {suggestionsB.map((s, idx) => (
                             <button
                                key={`${s.symbol}-${idx}`}
                                type="button"
                                onClick={() => { justSelected.current = true; setSymbolB(s.symbol); setSuggestionsB([]); }}
                                className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/[0.02] transition-colors group"
                             >
                                <div className="flex items-center gap-3">
                                   <span className="text-xs font-bold text-white tracking-widest">{s.symbol}</span>
                                   <span className="text-[10px] text-gray-600 font-medium truncate max-w-[150px] uppercase">{s.name}</span>
                                </div>
                                <ChevronRight className="w-3 h-3 text-gray-800 group-hover:text-gray-500" />
                             </button>
                          ))}
                       </div>
                    )}
                 </div>
              </>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !symbol || (mode === "compare" && !symbolB)}
            className="bg-white text-black hover:bg-white/90 font-bold py-3 px-8 rounded-lg shadow-xl active:scale-95 disabled:opacity-50 w-full md:w-auto text-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Analysis"}
          </Button>
        </form>
      </div>

      {/* Analysis Container - Refined Document Style */}
      <div className="min-h-[400px]">
        {status === "processing" && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 border border-indigo-500/20 rounded-full animate-ping" />
              <Loader2 className="w-8 h-8 text-indigo-500/40 animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-sm font-semibold text-white uppercase tracking-widest leading-none">Agents Synchronizing Intelligence</h2>
              <p className="text-xs text-gray-600 max-w-xs mx-auto">Cross-referencing technical data points and market sentiment for {symbol.toUpperCase()}.</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center border border-rose-500/5 rounded-2xl bg-rose-500/[0.01]">
            <AlertCircle className="w-8 h-8 text-rose-500/40" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Analysis Interrupted</h2>
              <p className="text-xs text-gray-500 max-w-xs">{error || "Data service unavailable for this symbol."}</p>
            </div>
            <Button variant="ghost" onClick={() => setStatus("idle")} className="text-[10px] uppercase font-black text-gray-500 hover:text-white mt-2">Dismiss</Button>
          </div>
        )}

        {status === "completed" && report && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-1000">
            {/* Real-time Technical Visuals Overlay */}
            <div className="space-y-6">
              {/* Main Technical Chart - Full Width */}
              <div className="bg-[#0A0A0B] border border-white/[0.04] rounded-2xl overflow-hidden shadow-sm h-[450px]">
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
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Market Pulse</span>
                    </div>
                    <div className="bg-[#0D0D0E] border border-white/[0.04] rounded-2xl overflow-hidden shadow-sm h-[200px]">
                      <TradingViewWidget
                          scriptUrl="https://www.tradingview.com/external-embedding/embed-widget-symbol-info.js"
                          config={SYMBOL_INFO_WIDGET_CONFIG(report.stock_symbol)}
                          height={200}
                        />
                    </div>
                  </div>
                  <div className="md:col-span-3 space-y-4">
                    <div className="flex items-center gap-2 px-1 justify-end">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Technical Indicators</span>
                    </div>
                    <div className="bg-[#0D0D0E] border border-white/[0.04] rounded-2xl overflow-hidden shadow-sm h-[200px]">
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
            <div className="flex flex-col md:flex-row gap-10 items-start justify-between border-b border-white/[0.04] pb-10">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-none">Investment Memo</span>
                  <div className="w-1 h-1 bg-gray-800 rounded-full" />
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest leading-none">{report.report_date}</span>
                </div>
                <h2 className="text-4xl font-semibold text-white tracking-tight leading-none">
                  {report.company_name} <span className="text-gray-700 font-normal">/</span> <span className="text-gray-500 font-medium">{report.stock_symbol}</span>
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed max-w-xl">
                  {report.executive_summary}
                </p>
              </div>

              <div className={cn(
                "p-6 rounded-2xl border flex flex-col items-center justify-center min-w-[200px] shadow-sm",
                report.investment_recommendation.includes("Buy") ? "bg-emerald-500/[0.02] border-emerald-500/10" :
                  report.investment_recommendation.includes("Sell") ? "bg-rose-500/[0.02] border-rose-500/10" :
                    "bg-amber-500/[0.02] border-amber-500/10"
              )}>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 mb-2">Verdict</span>
                <h3 className={cn(
                  "text-2xl font-bold tracking-tight mb-2",
                  report.investment_recommendation.includes("Buy") ? "text-emerald-400" :
                    report.investment_recommendation.includes("Sell") ? "text-rose-400" :
                      "text-amber-400"
                )}>
                  {report.investment_recommendation}
                </h3>
                <div className="flex items-center gap-1.5 mt-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className={cn(
                      "w-1 h-3 rounded-full",
                      (report.confidence_level / 20) >= s ? "bg-indigo-500/60" : "bg-white/5"
                    )} />
                  ))}
                  <span className="text-[9px] font-bold text-gray-700 uppercase tracking-tighter ml-1">{report.confidence_level}% Confidence</span>
                </div>
              </div>
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-12">
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-3">
                    <span className="w-4 h-[1px] bg-gray-800" /> Quantitative Research
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed font-normal whitespace-pre-wrap">{report.quantitative_summary}</p>
                </section>

                <section className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-3">
                    <span className="w-4 h-[1px] bg-gray-800" /> Qualitative Analysis
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed font-normal whitespace-pre-wrap">{report.qualitative_summary}</p>
                </section>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <div className="bg-[#0D0D0E] border border-white/[0.03] rounded-xl p-6 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/80">Key Rationale</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {report.recommendation_rationale}
                  </p>
                </div>

                <div className="bg-rose-500/[0.01] border border-rose-500/[0.04] rounded-xl p-6 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-500/60">Risk Profile</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {report.risk_assessment}
                  </p>
                  <div className="pt-3 border-t border-rose-500/[0.04]">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-700">
                      <span>MT-SCORE</span>
                      <span className="text-rose-500/40 uppercase">Elevated</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-[#0A0A0B] border border-white/[0.02] rounded-xl space-y-3">
                  <div className="w-6 h-6 bg-white/[0.02] rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-3 h-3 text-gray-700" />
                  </div>
                  <h4 className="font-semibold text-sm text-white">Horizon</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">Strategic window set for <span className="text-white font-medium">{report.analysis_period}</span> based on multi-agent synthesis.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Minimalist */}
        {status === "idle" && (
          <div className="flex flex-col items-center justify-center py-40 animate-in fade-in duration-1000">
            <div className="w-12 h-12 bg-white/[0.01] border border-white/[0.03] rounded-2xl flex items-center justify-center mb-6">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Engine Standby</p>
              <p className="text-[10px] text-gray-700 uppercase font-bold tracking-wider">Awaiting equity ticker entry for analysis</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
