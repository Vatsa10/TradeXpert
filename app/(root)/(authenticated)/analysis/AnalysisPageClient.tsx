"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import AnalysisDashboard from "@/components/AnalysisDashboard";
import AnalysisHistory from "@/components/AnalysisHistory";
import { PageShell } from "@/components/system";

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
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="relative flex h-[calc(100vh-70px)] flex-col overflow-hidden bg-surface lg:flex-row">
      <div className="custom-scrollbar z-10 flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6">
        <PageShell
          title="Investment Intelligence"
          description="Institutional-grade multi-agent analysis for equity markets."
        >
          <AnalysisDashboard
            initialRequestId={selectedRequestId}
            onComplete={handleAnalysisComplete}
          />
        </PageShell>
      </div>

      <aside
        aria-label="Analysis history"
        className="z-20 w-full border-t border-hairline bg-surface lg:w-[320px] lg:border-t-0 lg:border-l"
      >
        <AnalysisHistory
          key={refreshTrigger}
          onSelect={handleSelectHistory}
          onCompare={setCompareIds}
          selectedIds={compareIds}
        />
      </aside>
    </div>
  );
}
