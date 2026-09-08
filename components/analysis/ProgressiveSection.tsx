"use client";

import type { QualitativeAnalysis, QuantitativeAnalysis } from "@/lib/analysis/types";

import InstantSnapshot from "./InstantSnapshot";
import { QualStageCard } from "./QualStageCard";
import { QuantStageCard } from "./QuantStageCard";
import { StageRail } from "./StageRail";
import { StageErrorCard, StageSkeleton } from "./StageShell";
import type { InstantPanelView, StageKey, StageState } from "./progressive-types";

/**
 * The progressive reveal: rail on top, then instant snapshot -> quant -> qual,
 * each swapping its skeleton for real content the moment that stage lands.
 * `awaitingReport` adds the memo placeholder while the report is still being
 * compiled.
 */
export function ProgressiveSection({
  awaitingReport,
  stageStates,
  stageErrors,
  instantPanel,
  quant,
  qual,
  currency,
}: {
  awaitingReport: boolean;
  stageStates: Record<StageKey, StageState>;
  stageErrors: Partial<Record<StageKey, string>>;
  instantPanel: InstantPanelView | null;
  quant: QuantitativeAnalysis | null;
  qual: QualitativeAnalysis | null;
  currency: "INR" | "USD";
}) {
  return (
    <div className="space-y-4">
      <StageRail stages={stageStates} />

      {instantPanel ? (
        <InstantSnapshot panel={instantPanel} />
      ) : stageErrors.instant ? (
        <StageErrorCard title="Instant Snapshot" message={stageErrors.instant} />
      ) : (
        <StageSkeleton label="Building instant snapshot…" />
      )}

      {quant ? (
        <QuantStageCard quant={quant} currency={currency} error={stageErrors.quant} />
      ) : stageErrors.quant ? (
        <StageErrorCard title="Quantitative Agent" message={stageErrors.quant} />
      ) : (
        <StageSkeleton label="Quantitative agent analyzing…" />
      )}

      {qual ? (
        <QualStageCard qual={qual} error={stageErrors.qual} />
      ) : stageErrors.qual ? (
        <StageErrorCard title="Sentiment Agent" message={stageErrors.qual} />
      ) : (
        <StageSkeleton label="Sentiment agent analyzing…" />
      )}

      {awaitingReport &&
        (stageErrors.report ? (
          <StageErrorCard title="Investment Memo" message={stageErrors.report} />
        ) : (
          <StageSkeleton label="Compiling investment memo…" />
        ))}
    </div>
  );
}
