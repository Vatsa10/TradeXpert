
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { startAnalysisAction, getAnalysisStatusAction } from "@/lib/actions/analysis.actions";
import { InvestmentReport as StockAnalysisReport } from "@/lib/analysis/types";
import { getStocksDetails } from "@/lib/actions/finnhub.actions";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, BarChart3, PieChart, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AnalysisDashboard({ 
  initialRequestId, 
  onComplete 
}: { 
  initialRequestId?: string | null;
  onComplete?: () => void;
}) {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(initialRequestId || null);
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "error">("idle");
  const [report, setReport] = useState<StockAnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Polling for analysis result
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (requestId && status === "processing") {
      interval = setInterval(async () => {
        try {
          const res = await getAnalysisStatusAction(requestId);
          if (res.status === "completed" && res.report) {
            setReport(res.report as StockAnalysisReport);
            setStatus("completed");
            setLoading(false);
            setRequestId(null);
            toast.success("Analysis complete!");
            onComplete?.(); // Refresh history
          } else if (res.status === "error") {
            setError(res.error || "Analysis failed");
            setStatus("error");
            setLoading(false);
            setRequestId(null);
            toast.error("Analysis failed");
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [requestId, status, onComplete]);

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol) return;

    setLoading(true);
    setError(null);
    setReport(null);
    setStatus("processing");

    try {
      // 1. First lookup actual company name
      const details = await getStocksDetails(symbol.toUpperCase());
      const companyName = details?.company || symbol.toUpperCase();

      // 2. Start analysis via server action
      const res = await startAnalysisAction(symbol.toUpperCase(), companyName);
      setRequestId(res.request_id);
      toast.info("Analysis started. This may take a minute...");
    } catch (err: any) {
      setError(err.message || "Failed to start analysis");
      setStatus("error");
      setLoading(false);
      toast.error(err.message || "Failed to start analysis");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Search Header */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200"></div>
        <form 
          onSubmit={handleStartAnalysis}
          className="relative flex items-center bg-[#0d0d0f] rounded-2xl p-2 gap-2 shadow-2xl border border-white/5"
        >
          <div className="flex-1 flex items-center px-4 gap-3">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Enter stock symbol (e.g. AAPL, TSLA, NVDA)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-600 font-medium py-3 text-lg"
              disabled={loading}
              required
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading || !symbol}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-6 px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="animate-pulse">Analyzing...</span>
              </div>
            ) : (
              "Generate Intelligence Report"
            )}
          </Button>
        </form>
      </div>

      {/* States Container */}
      <div className="min-h-[400px]">
        {/* Processing State */}
        {status === "processing" && (
          <div className="flex flex-col items-center justify-center p-20 space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
              <div className="relative p-8 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                <BarChart3 className="w-16 h-16 text-indigo-400 animate-bounce" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <h2 className="text-2xl font-bold text-white tracking-tight">Consulting AI Specialized Agents</h2>
              <p className="text-gray-400 max-w-lg mx-auto leading-relaxed">
                Our quantitative and qualitative agents are currently synchronizing datasets for <span className="text-white font-bold">{symbol.toUpperCase()}</span>. This institutional-grade analysis involves cross-referencing market news, technical metrics, and risk factors.
              </p>
            </div>
            <div className="w-full max-w-md space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                <span>Data Ingestion</span>
                <span>In Progress</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 animate-[loading_3s_infinite]" />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="flex flex-col items-center justify-center p-20 space-y-6 text-center border border-rose-500/10 rounded-3xl bg-rose-500/[0.02]">
            <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20">
              <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">System Interruption</h2>
              <p className="text-gray-400 max-w-sm">{error || "The analysis encountered an unexpected data point. Please verify the symbol and try again."}</p>
            </div>
            <Button variant="outline" onClick={() => setStatus("idle")} className="border-white/10 hover:bg-white/5 px-8">Retry Analysis</Button>
          </div>
        )}

        {/* Final Report - The Institutional Look */}
        {status === "completed" && report && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Report Header Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start justify-between border-b border-white/5 pb-10">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-3">
                  <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-1 font-bold tracking-wider">OFFICIAL REPORT</Badge>
                  <span className="text-xs text-gray-500 font-medium">Ref: {report.report_date}</span>
                </div>
                <h2 className="text-5xl font-black text-white tracking-tighter">
                  {report.company_name} <span className="text-gray-600 font-light">{report.stock_symbol}</span>
                </h2>
                <p className="text-xl text-gray-300 leading-relaxed font-medium line-clamp-3">
                  {report.executive_summary}
                </p>
              </div>

              <div className={cn(
                "p-8 rounded-3xl border flex flex-col items-center justify-center min-w-[240px] shadow-2xl transition-all hover:scale-105",
                report.investment_recommendation.includes("Buy") ? "bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10" : 
                report.investment_recommendation.includes("Sell") ? "bg-rose-500/10 border-rose-500/20 shadow-rose-500/10" : 
                "bg-amber-500/10 border-amber-500/20 shadow-amber-500/10"
              )}>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Verdict</span>
                <h3 className={cn(
                  "text-4xl font-black tracking-tight mb-2 text-center",
                  report.investment_recommendation.includes("Buy") ? "text-emerald-400" : 
                  report.investment_recommendation.includes("Sell") ? "text-rose-400" : 
                  "text-amber-400"
                )}>
                  {report.investment_recommendation.toUpperCase()}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className={cn(
                        "w-1.5 h-4 rounded-full",
                        (report.confidence_level / 20) >= s ? "bg-indigo-500" : "bg-white/10"
                      )} />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold text-gray-500">{report.confidence_level}% CNS</span>
                </div>
              </div>
            </div>

            {/* Grid for Analysis Components */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column - Detailed Breakdown */}
              <div className="lg:col-span-8 space-y-12">
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">Quantitative Insight</h4>
                  </div>
                  <div className="p-8 bg-white/[0.02] border border-white/[0.05] rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <BarChart3 className="w-24 h-24 text-white" />
                    </div>
                    <p className="text-gray-300 text-lg leading-relaxed relative z-10 whitespace-pre-wrap">{report.quantitative_summary}</p>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-violet-500 rounded-full" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">Qualitative Context</h4>
                  </div>
                  <div className="p-8 bg-white/[0.02] border border-white/[0.05] rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <PieChart className="w-24 h-24 text-white" />
                    </div>
                    <p className="text-gray-300 text-lg leading-relaxed relative z-10 whitespace-pre-wrap">{report.qualitative_summary}</p>
                  </div>
                </section>
              </div>

              {/* Right Column - Recommendation & Risk */}
              <div className="lg:col-span-4 space-y-10">
                <div className="bg-[#0f0f11] border border-white/5 rounded-3xl p-8 space-y-6 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Rationale</h4>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed italic">
                    "{report.recommendation_rationale}"
                  </p>
                </div>

                <div className="bg-rose-500/[0.02] border border-rose-500/10 rounded-3xl p-8 space-y-6 relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white text-rose-500">Risk Profile</h4>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {report.risk_assessment}
                  </p>
                  <div className="pt-4 border-t border-rose-500/10">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                      <span>MT-SCORE</span>
                      <span className="text-rose-500">ELEVATED</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl text-white space-y-4 shadow-2xl shadow-indigo-500/20">
                  <TrendingUp className="w-8 h-8 text-white/50" />
                  <h4 className="font-bold text-xl">Investment Horizon</h4>
                  <p className="text-sm text-white/80 leading-relaxed">Based on current technical indicators and sentiment scores, the recommended period for this analysis is <span className="font-black underline decoration-2">{report.analysis_period}</span>.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Home State / Capabilities */}
        {status === "idle" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10">
            {[
              { icon: TrendingUp, title: "Multi-Agent Intelligence", color: "text-blue-500", bg: "bg-blue-500/10", desc: "Specialized neural agents for fundamental and technical synthesis." },
              { icon: Search, title: "Contextual Scanning", color: "text-emerald-500", bg: "bg-emerald-500/10", desc: "Advanced news processing with real-time sentiment correlation." },
              { icon: CheckCircle2, title: "Precision Verticts", color: "text-violet-500", bg: "bg-violet-500/10", desc: "Unbiased, institutional-grade buy/sell recommendations." }
            ].map((feature, i) => (
              <div key={i} className="group p-8 bg-white/[0.02] border border-white/[0.05] rounded-3xl hover:bg-white/[0.04] transition-all hover:-translate-y-1">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", feature.bg)}>
                  <feature.icon className={cn("w-7 h-7", feature.color)} />
                </div>
                <h4 className="text-white font-bold text-lg mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
