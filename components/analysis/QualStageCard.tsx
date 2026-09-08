"use client";

import { Newspaper } from "lucide-react";

import { Badge, NumberValue, type SemanticTone } from "@/components/system";
import type { QualitativeAnalysis } from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

import { StageCard, StageProse } from "./StageShell";

const SENTIMENT_TONE: Record<string, SemanticTone> = {
  positive: "up",
  negative: "down",
};

function BulletList({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "up" | "down";
}) {
  return (
    <div className="space-y-1.5">
      <h4
        className={cn(
          "text-xs font-medium tracking-widest uppercase",
          tone === "up" ? "text-up" : "text-down"
        )}
      >
        {label}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, idx) => (
          <li key={idx} className="flex gap-2 text-sm leading-relaxed text-ink-secondary">
            <span
              className={cn(
                "mt-1.5 size-1 shrink-0 rounded-full",
                tone === "up" ? "bg-up/60" : "bg-down/60"
              )}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function QualStageCard({
  qual,
  error,
}: {
  qual: QualitativeAnalysis;
  error?: string | null;
}) {
  const score = typeof qual.sentiment_score === "number" ? qual.sentiment_score : 0;
  const tone: SemanticTone = SENTIMENT_TONE[qual.overall_sentiment ?? ""] ?? "warning";
  // Map -1..1 onto a 0..100% track so the marker reads as a gauge position.
  const gaugePosition = Math.min(100, Math.max(0, ((score + 1) / 2) * 100));

  return (
    <StageCard
      icon={<Newspaper className="size-3.5 text-brand" aria-hidden />}
      title="Sentiment Agent"
      error={error}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={tone} pill uppercase>
          {qual.overall_sentiment || "neutral"}
        </Badge>
        <NumberValue value={score} digits={2} className="text-sm font-semibold text-ink" />
        <div
          className="relative h-1.5 min-w-[140px] flex-1 rounded-full bg-surface-raised-2"
          role="img"
          aria-label={"Sentiment score " + score.toFixed(2) + " on a -1 to 1 scale"}
        >
          <div
            className={cn(
              "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full",
              "transition-[left] duration-200 ease-out-strong",
              tone === "up" ? "bg-up" : tone === "down" ? "bg-down" : "bg-warning"
            )}
            style={{ left: `${gaugePosition}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!!qual.key_opportunities?.length && (
          <BulletList label="Opportunities" items={qual.key_opportunities} tone="up" />
        )}
        {!!qual.key_risks?.length && (
          <BulletList label="Risks" items={qual.key_risks} tone="down" />
        )}
      </div>

      {qual.news_summary && <StageProse label="News Summary">{qual.news_summary}</StageProse>}
    </StageCard>
  );
}
