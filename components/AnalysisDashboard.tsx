
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { startAnalysisAction, getAnalysisStatusAction } from "@/lib/actions/analysis.actions";
import { InvestmentReport as StockAnalysisReport } from "@/lib/analysis/types";
import { getStocksDetails } from "@/lib/actions/finnhub.actions";
import { Search, Loader2, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, BarChart3, PieChart, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AnalysisDashboard() {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "error">("idle");
  const [report, setReport] = useState<StockAnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  }, [requestId, status]);

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
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl shadow-xl">
        <form onSubmit={handleStartAnalysis} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Enter stock symbol (e.g. AAPL, TSLA, NVDA)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="pl-10 h-12 bg-black/40 border-white/10 text-white focus:ring-yellow-500/50"
              disabled={loading}
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading || !symbol}
            className="h-12 px-8 bg-yellow-500 hover:bg-yellow-600 font-bold transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Generate Report"
            )}
          </Button>
        </form>
      </div>

      {/* Progress State */}
      {status === "processing" && (
        <div className="bg-[#141414] border border-yellow-500/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 animate-pulse">
            <div className="p-4 bg-yellow-500/10 rounded-full">
                <TrendingUp className="w-12 h-12 text-yellow-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Aggregating Insights...</h2>
            <p className="text-gray-400 max-w-md">Our AI agents are currently fetching data, analyzing technicals, and scanning latest news for {symbol}. This usually takes 30-60 seconds.</p>
            <div className="w-full max-w-xs bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
            </div>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="bg-[#141414] border border-red-500/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-red-500/10 rounded-full">
                <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-white">Analysis Failed</h2>
            <p className="text-gray-400">{error || "Something went wrong during the analysis process."}</p>
            <Button variant="outline" onClick={() => setStatus("idle")} className="border-white/10 hover:bg-white/5">Try Again</Button>
        </div>
      )}

      {/* Final Report */}
      {status === "completed" && report && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Summary Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#141414] border border-white/5 p-8 rounded-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                        <span className="text-sm font-medium text-green-500 uppercase tracking-wider">Analysis Complete</span>
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-2">{report.company_name} <span className="text-gray-500 font-normal">({report.stock_symbol})</span></h2>
                    <p className="text-gray-300 leading-relaxed mb-6">{report.executive_summary}</p>
                    
                    <div className="flex flex-wrap gap-4">
                        <div className="px-4 py-2 bg-black/40 border border-white/5 rounded-lg">
                            <span className="text-xs text-gray-500 uppercase block mb-1">Date</span>
                            <span className="text-white font-medium">{report.report_date}</span>
                        </div>
                        <div className="px-4 py-2 bg-black/40 border border-white/5 rounded-lg">
                            <span className="text-xs text-gray-500 uppercase block mb-1">Confidence</span>
                            <span className="text-white font-medium">{report.confidence_level}%</span>
                        </div>
                        <div className="px-4 py-2 bg-black/40 border border-white/5 rounded-lg">
                            <span className="text-xs text-gray-500 uppercase block mb-1">Period</span>
                            <span className="text-white font-medium">{report.analysis_period}</span>
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "p-8 rounded-2xl flex flex-col justify-between border",
                    report.investment_recommendation.includes("Buy") ? "bg-green-500/10 border-green-500/20" : 
                    report.investment_recommendation.includes("Sell") ? "bg-red-500/10 border-red-500/20" : 
                    "bg-yellow-500/10 border-yellow-500/20"
                )}>
                    <div>
                        <span className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Recommendation</span>
                        <h3 className={cn(
                            "text-3xl font-black mb-4",
                            report.investment_recommendation.includes("Buy") ? "text-green-500" : 
                            report.investment_recommendation.includes("Sell") ? "text-red-400" : 
                            "text-yellow-500"
                        )}>{report.investment_recommendation}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{report.recommendation_rationale}</p>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs text-gray-500 uppercase">Trust Score</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className={cn(
                                    "w-3 h-3 rounded-full",
                                    (report.confidence_level / 20) >= i ? "bg-yellow-500" : "bg-white/10"
                                )}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#141414] border border-white/5 p-8 rounded-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        <h3 className="text-xl font-bold text-white">Quantitative Findings</h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{report.quantitative_summary}</p>
                </div>

                <div className="bg-[#141414] border border-white/5 p-8 rounded-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <PieChart className="w-5 h-5 text-purple-400" />
                        <h3 className="text-xl font-bold text-white">Qualitative Findings</h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{report.qualitative_summary}</p>
                </div>
            </div>

            {/* Risk Section */}
            <div className="bg-[#141414] border border-red-500/10 p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <AlertCircle className="w-32 h-32 text-red-500" />
                </div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                    <Info className="w-5 h-5 text-red-500" />
                    <h3 className="text-xl font-bold text-white">Risk Assessment</h3>
                </div>
                <p className="text-gray-400 leading-relaxed relative z-10">{report.risk_assessment}</p>
            </div>
        </div>
      )}

      {/* Empty State / Tips */}
      {status === "idle" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl space-y-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <h4 className="text-white font-semibold">Multi-Agent Engine</h4>
                <p className="text-sm text-gray-500">Utilizes specialized agents for data fetching, quantitative metrics, and sentiment analysis.</p>
            </div>
            <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl space-y-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-green-500" />
                </div>
                <h4 className="text-white font-semibold">Deep Scrutiny</h4>
                <p className="text-sm text-gray-500">Scans thousands of news articles and financial statements to find hidden correlations.</p>
            </div>
            <div className="bg-[#141414] border border-white/5 p-6 rounded-2xl space-y-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-purple-500" />
                </div>
                <h4 className="text-white font-semibold">Smart Verdicts</h4>
                <p className="text-sm text-gray-500">Generates clear Buy/Hold/Sell signals with deep reasoning and risk scoring.</p>
            </div>
        </div>
      )}
    </div>
  );
}
