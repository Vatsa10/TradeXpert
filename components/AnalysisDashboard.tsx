"use client";

import { BarChart3 } from "lucide-react";

import { ActionButton } from "@/components/app/ActionButton";
import { AnalysisSearchBar } from "@/components/analysis/AnalysisSearchBar";
import { ProgressiveSection } from "@/components/analysis/ProgressiveSection";
import { ReportView } from "@/components/analysis/ReportView";
import { useAnalysisRun } from "@/components/analysis/useAnalysisRun";
import { EmptyState, ErrorState, Skeleton } from "@/components/system";

const QUICK_TICKERS = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN"];

/**
 * Progressive analysis surface: search bar, staged reveal, finished memo.
 * All of the polling and stage-folding logic lives in `useAnalysisRun`; this
 * component is presentation only.
 */
export default function AnalysisDashboard({
  initialRequestId,
  onComplete,
}: {
  initialRequestId?: string | null;
  onComplete?: () => void;
}) {
  const run = useAnalysisRun({ initialRequestId, onComplete });

  const progressive = (awaitingReport: boolean) => (
    <ProgressiveSection
      awaitingReport={awaitingReport}
      stageStates={run.stageStates}
      stageErrors={run.stageErrors}
      instantPanel={run.instantPanel}
      quant={run.quant}
      qual={run.qual}
      currency={run.currency}
    />
  );

  return (
    <div className="space-y-6">
      <AnalysisSearchBar
        mode={run.mode}
        setMode={run.setMode}
        status={run.status}
        loading={run.loading}
        symbol={run.symbol}
        setSymbol={run.setSymbol}
        symbolB={run.symbolB}
        setSymbolB={run.setSymbolB}
        suggestionsA={run.suggestionsA}
        suggestionsB={run.suggestionsB}
        onPick={run.pickSymbol}
        onSubmit={run.handleStartAnalysis}
      />

      <div className="min-h-[400px]">
        {run.status === "processing" && run.showProgressive && progressive(true)}

        {run.status === "processing" && !run.showProgressive && (
          <div className="space-y-4" aria-busy="true">
            <p className="text-sm text-ink-secondary">
              Running multi-agent analysis on{" "}
              <span className="font-medium text-ink">
                {run.symbol.toUpperCase() || run.symbolB.toUpperCase()}
              </span>
              …
            </p>
            <Skeleton className="h-12" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        )}

        {run.status === "error" && (
          <ErrorState
            title="Analysis failed"
            message={run.error || "Data service unavailable for this symbol."}
            onRetry={() => run.setStatus("idle")}
          />
        )}

        {run.status === "completed" && run.report && (
          <div className="space-y-10">
            {/* Stage output kept above the memo; absent for pre-pipeline analyses. */}
            {run.showProgressive && progressive(false)}
            <ReportView report={run.report} />
          </div>
        )}

        {run.status === "idle" && (
          <EmptyState
            className="py-20"
            icon={<BarChart3 aria-hidden />}
            title="Start an analysis"
            description="Enter a stock ticker above to generate AI-powered investment insights."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_TICKERS.map((ticker) => (
                  <ActionButton key={ticker} size="sm" onClick={() => run.pickSymbol("a", ticker)}>
                    {ticker}
                  </ActionButton>
                ))}
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
