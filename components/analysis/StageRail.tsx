"use client";

import { StatusChip } from "@/components/system";

import type { StageKey, StageState } from "./progressive-types";

const STAGE_LABELS: Record<StageKey, string> = {
  instant: "Instant",
  quant: "Quant",
  qual: "Sentiment",
  report: "Report",
};

export const STAGE_ORDER: StageKey[] = ["instant", "quant", "qual", "report"];

/**
 * Horizontal progress rail: Instant → Quant → Sentiment → Report.
 * Reads `stages.<key>.state` as normalized by `stageStateFrom`.
 */
export function StageRail({ stages }: { stages: Record<StageKey, StageState> }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-xl border border-hairline bg-surface-raised px-4 py-3">
      {STAGE_ORDER.map((key, idx) => (
        <li key={key} className="flex items-center gap-2">
          <StatusChip status={stages[key]} label={STAGE_LABELS[key]} />
          {idx < STAGE_ORDER.length - 1 && (
            <span className="h-px w-3 bg-hairline-strong" aria-hidden />
          )}
        </li>
      ))}
    </ol>
  );
}
