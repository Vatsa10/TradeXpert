
"use client";

import { useEffect, useState } from "react";
import { getAnalysisStatusAction } from "@/lib/actions/analysis.actions";
import { InvestmentReport as StockAnalysisReport } from "@/lib/analysis/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Scale, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-400">Loading comparison data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Report Comparison</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, idx) => (
          <div key={report.requestId} className="space-y-6">
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl overflow-hidden group">
              <div className={cn(
                "h-1 w-full",
                idx === 0 ? "bg-indigo-500" : "bg-emerald-500"
              )} />
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs border-white/20 text-white px-2 py-0.5">
                    {report.stock_symbol}
                  </Badge>
                  <Badge className={cn(
                    "text-[10px] h-5",
                    report.investment_recommendation.includes("Buy") ? "bg-emerald-500/20 text-emerald-400" :
                      report.investment_recommendation.includes("Sell") ? "bg-rose-500/20 text-rose-400" : "bg-slate-500/20 text-slate-400"
                  )}>
                    {report.investment_recommendation}
                  </Badge>
                </div>
                <CardTitle className="text-xl text-white group-hover:text-indigo-400 transition-colors">
                  {report.company_name}
                </CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-1000"
                      style={{ width: `${report.confidence_level}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">{report.confidence_level}% Confidence</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Executive Summary
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed italic">
                    "{report.executive_summary}"
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" /> Quantitative
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">{report.quantitative_summary}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                    <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      Qualitative
                    </h4>
                    <p className="text-xs text-gray-300 leading-relaxed">{report.qualitative_summary}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" /> Risk Assessment
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed bg-white/5 p-3 rounded-lg italic">
                    {report.risk_assessment}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
