
"use client";

import { useState, useEffect } from "react";
import AnalysisDashboard from "@/components/AnalysisDashboard";
import AnalysisHistory from "@/components/AnalysisHistory";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AnalysisPageClient({ id }: { id?: string }) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(id || null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const router = useRouter();

  // Update selectedRequestId when id prop changes (for routing)
  useEffect(() => {
    if (id) {
      setSelectedRequestId(id);
    }
  }, [id]);

  const handleSelectHistory = async (id: string) => {
    setSelectedRequestId(id);
    router.push(`/analysis/${id}`);
    toast.info("Loading analysis from history...");
  };

  const handleAnalysisComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-70px)] bg-[#0A0A0A] overflow-hidden relative font-sans">
      {/* Search/Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-6 z-10 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 space-y-1">
            <h1 className="text-2xl font-semibold text-white tracking-tight sm:text-3xl">
              Investment <span className="text-blue-500">Intelligence</span>
            </h1>
            <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
              Institutional-grade multi-agent analysis for equity markets.
            </p>
          </div>

          <div className="bg-[#111111] border border-[#27272A] rounded-2xl p-1 shadow-sm">
            <AnalysisDashboard 
              initialRequestId={selectedRequestId} 
              onComplete={handleAnalysisComplete}
            />
          </div>
        </div>
      </div>

      {/* Sidebar - History */}
      <div className="w-full lg:w-[320px] z-20 border-t lg:border-t-0 lg:border-l border-[#27272A] bg-[#0A0A0A]">
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
