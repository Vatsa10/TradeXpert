"use client";

import { useEffect, useState } from "react";
import { getAnalysisStatusAction } from "@/lib/actions/analysis.actions";
import { InvestmentReport as StockAnalysisReport } from "@/lib/analysis/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Scale, TrendingUp, AlertTriangle, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import TradingViewWidget from "@/components/TradingViewWidget";
import { TECHNICAL_ANALYSIS_WIDGET_CONFIG, SYMBOL_INFO_WIDGET_CONFIG } from "@/lib/constants";

const TV_SYMBOL_INFO_URL = "https://www.tradingview.com/external-embedding/embed-widget-symbol-info.js";
const TV_TECHNICAL_ANALYSIS_URL = "https://www.tradingview.com/external-embedding/embed-widget-technical-analysis.js";

interface ComparisonReport extends StockAnalysisReport {
  requestId: string;
}

export default function ComparisonView({ ids }: { ids: string[] }) {
  const [reports, setReports] = useState<ComparisonReport[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await Promise.all(
          ids.map(async (id) => {
            const res = await getAnalysisStatusAction(id);
            if (!res.report) throw new Error("Report not found");
            return { ...res.report, requestId: id } as ComparisonReport;
          })
        );
        setReports(data);
      } catch (err) {
        console.error("Comparison fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (ids.length > 0) fetchReports();
  }, [ids]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading comparison data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 custom-scrollbar overflow-x-hidden px-6">
      <div className="flex items-center justify-between border-b border-[#27272A] pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-500 hover:text-white hover:bg-[#1A1A1A]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <Scale className="w-6 h-6 text-blue-500" />
              Comparative Intelligence
            </h1>
            <p className="text-sm text-gray-500 font-medium">Cross-referencing TV Metrics & AI Sentiment</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {reports.map((report, idx) => (
          <ReportSection key={report.requestId} report={report} idx={idx} />
        ))}
      </div>
    </div>
  );
}

/**
 * Sub-component to manage memoized TradingView configs per report
 */
function ReportSection({ report, idx }: { report: ComparisonReport, idx: number }) {
  const symbolInfoConfig = (report.stock_symbol);
  const technicalAnalysisConfig = (report.stock_symbol);

  return (
    <div className="space-y-8">
      {/* 1. Live TradingView Metrics */}
      <div className="space-y-4">
         <div className="flex items-center gap-2 px-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Live Market Pulse</span>
         </div>
         <div className="bg-[#111111] border border-[#27272A] rounded-2xl p-1 overflow-hidden shadow-sm">
            <TradingViewWidget
              scriptUrl={TV_SYMBOL_INFO_URL}
              config={SYMBOL_INFO_WIDGET_CONFIG(report.stock_symbol)}
              height={160}
            />
            <div className="p-4 bg-black/20">
              <TradingViewWidget
                scriptUrl={TV_TECHNICAL_ANALYSIS_URL}
                config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(report.stock_symbol)}
                height={380}
              />
            </div>
         </div>
      </div>

      {/* 2. AI Strategic Report */}
      <div className="space-y-4">
         <div className="flex items-center gap-2 px-1">
            <TrendingUp className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">AI Strategic Verdict</span>
         </div>
         <Card className="bg-[#111111] border-[#27272A] rounded-2xl shadow-sm overflow-hidden group border">
           <div className={cn(
             "h-1 w-full",
             idx === 0 ? "bg-blue-500" : "bg-blue-600"
           )} />
           <CardHeader className="pb-6">
             <div className="flex items-center justify-between mb-4">
               <Badge variant="outline" className="text-xs font-medium uppercase tracking-widest border-[#27272A] text-gray-400 bg-transparent">
                 {report.stock_symbol} REPORT
               </Badge>
               <Badge className={cn(
                 "text-xs font-semibold uppercase tracking-widest",
                 report.investment_recommendation.includes("Buy") ? "bg-emerald-500/10 text-emerald-400" :
                   report.investment_recommendation.includes("Sell") ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
               )}>
                 {report.investment_recommendation}
               </Badge>
             </div>
             <CardTitle className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
               {report.company_name}
             </CardTitle>
             <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#27272A]">
               <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                     <div key={s} className={cn(
                       "w-1 h-3 rounded-full",
                       (report.confidence_level / 20) >= s ? "bg-blue-500" : "bg-[#27272A]"
                     )} />
                   ))}
               </div>
               <span className="text-xs text-gray-500 font-medium uppercase tracking-tighter ml-1">AI Trust Index: {report.confidence_level}%</span>
             </div>
           </CardHeader>
           <CardContent className="space-y-8 pb-10">
             <div className="bg-[#1A1A1A] border border-[#27272A] p-5 rounded-xl">
               <h3 className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <CheckCircle2 className="w-3 h-3 text-emerald-500/60" /> Core Thesis
               </h3>
               <p className="text-sm text-gray-300 leading-relaxed italic">
                 "{report.executive_summary}"
               </p>
             </div>

             <div className="space-y-6">
               <div className="space-y-3">
                 <h4 className="text-xs font-medium text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <TrendingUp className="w-3 h-3" /> Technical Analysis
                 </h4>
                 <p className="text-sm text-gray-400 leading-relaxed font-normal">{report.quantitative_summary}</p>
               </div>
               <div className="space-y-3">
                 <h4 className="text-xs font-medium text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   Sentiment & News
                 </h4>
                 <p className="text-sm text-gray-400 leading-relaxed font-normal">{report.qualitative_summary}</p>
               </div>
             </div>

             <div className="pt-6 border-t border-[#27272A]">
               <h4 className="text-xs font-medium text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <AlertTriangle className="w-3 h-3" /> Risk Profile
               </h4>
               <p className="text-sm text-gray-400 leading-relaxed bg-red-500/[0.03] p-4 rounded-xl border border-red-500/20">
                 {report.risk_assessment}
               </p>
             </div>
           </CardContent>
         </Card>
       </div>
    </div>
  );
}
