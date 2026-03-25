
"use client";

import { useState } from "react";
import AnalysisDashboard from "@/components/AnalysisDashboard";
import AnalysisHistory from "@/components/AnalysisHistory";
import { getAnalysisStatusAction } from "@/lib/actions/analysis.actions";
import { InvestmentReport as StockAnalysisReport } from "@/lib/analysis/types";
import { toast } from "sonner";

export default function AnalysisPageClient() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectHistory = async (id: string) => {
    setSelectedRequestId(id);
    toast.info("Loading analysis from history...");
  };

  const handleAnalysisComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#070708] overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      {/* Search/Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-10 z-10 scrollbar-hide">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-1 bg-indigo-500 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Advanced Intelligence</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
              Stock <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Analysis</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
              Generate institutional-grade investment reports powered by our specialized multi-agent AI engine.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-1 backdrop-blur-3xl shadow-2xl">
            <AnalysisDashboard 
              initialRequestId={selectedRequestId} 
              onComplete={handleAnalysisComplete}
            />
          </div>
        </div>
      </div>

      {/* Sidebar - History (Refined) */}
      <div className="w-full lg:w-[350px] z-20 border-t lg:border-t-0 lg:border-l border-white/[0.08] bg-black/40 backdrop-blur-xl">
        <AnalysisHistory 
          key={refreshTrigger}
          onSelect={handleSelectHistory}
          onCompare={setCompareIds}
          selectedIds={compareIds}
        />
      </div>
    </div>
  );
}
