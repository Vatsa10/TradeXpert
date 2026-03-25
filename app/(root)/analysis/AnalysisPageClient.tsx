
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0A0A0B] overflow-hidden relative font-sans">
      {/* Search/Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 z-10 scrollbar-hide">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 space-y-1">
            <h1 className="text-2xl font-semibold text-white tracking-tight sm:text-3xl">
              Investment <span className="text-indigo-400/90">Intelligence</span>
            </h1>
            <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
              Institutional-grade multi-agent analysis for equity markets.
            </p>
          </div>

          <div className="bg-[#0D0D0E] border border-white/[0.04] rounded-2xl p-1 shadow-sm">
            <AnalysisDashboard 
              initialRequestId={selectedRequestId} 
              onComplete={handleAnalysisComplete}
            />
          </div>
        </div>
      </div>

      {/* Sidebar - History (Refined) */}
      <div className="w-full lg:w-[320px] z-20 border-t lg:border-t-0 lg:border-l border-white/[0.04] bg-[#0A0A0B]">
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
