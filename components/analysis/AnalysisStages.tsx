"use client";

import { Check, Loader2, X, TrendingUp, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuantitativeAnalysis, QualitativeAnalysis } from "@/lib/analysis/types";
import { formatCompact, formatMoney, type StageKey, type StageState } from "./progressive-types";

const STAGE_LABELS: Record<StageKey, string> = {
  instant: "Instant",
  quant: "Quant",
  qual: "Sentiment",
  report: "Report",
};

const STAGE_ORDER: StageKey[] = ["instant", "quant", "qual", "report"];

/** Small horizontal rail: Instant → Quant → Sentiment → Report. */
export function StageRail({ stages }: { stages: Record<StageKey, StageState> }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 rounded-xl border border-[#27272A] bg-[#111111] px-4 py-3">
      {STAGE_ORDER.map((key, idx) => {
        const state = stages[key];
        return (
          <div key={key} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest transition-colors duration-300",
                state === "done" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
                state === "error" && "border-red-500/30 bg-red-500/10 text-red-400",
                state === "pending" && "border-[#27272A] bg-[#1A1A1A] text-gray-500"
              )}
            >
              {state === "done" && <Check className="h-3 w-3" />}
              {state === "error" && <X className="h-3 w-3" />}
              {state === "pending" && <Loader2 className="h-3 w-3 animate-spin" />}
              {STAGE_LABELS[key]}
            </span>
            {idx < STAGE_ORDER.length - 1 && <span className="h-px w-3 bg-[#27272A]" />}
          </div>
        );
      })}
    </div>
  );
}

function StageCard({
  icon,
  title,
  error,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out rounded-2xl border border-[#27272A] bg-[#111111] p-5 space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-medium uppercase tracking-widest text-gray-400 leading-none">
          {title}
        </h3>
      </div>
      {error && (
        <p className="rounded-lg border border-red-500/20 bg-red-500/[0.03] px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {children}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#27272A] bg-[#1A1A1A] p-3">
      <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-gray-100 tabular-nums">{value}</p>
    </div>
  );
}

export function QuantStageCard({
  quant,
  currency,
  error,
}: {
  quant: QuantitativeAnalysis;
  currency: "INR" | "USD";
  error?: string | null;
}) {
  const stats: { label: string; value: string }[] = [
    { label: "Price", value: formatMoney(quant.current_price, currency) },
  ];
  if (typeof quant.price_change_percentage_24h === "number") {
    stats.push({ label: "24h", value: `${quant.price_change_percentage_24h.toFixed(2)}%` });
  }
  if (typeof quant.pe_ratio === "number") stats.push({ label: "P/E", value: quant.pe_ratio.toFixed(1) });
  if (typeof quant.market_cap === "number")
    stats.push({ label: "Mkt Cap", value: formatCompact(quant.market_cap, currency) });
  if (typeof quant.week_high_52 === "number")
    stats.push({ label: "52w High", value: formatMoney(quant.week_high_52, currency) });
  if (typeof quant.week_low_52 === "number")
    stats.push({ label: "52w Low", value: formatMoney(quant.week_low_52, currency) });

  return (
    <StageCard
      icon={<TrendingUp className="h-3.5 w-3.5 text-blue-500" />}
      title="Quantitative Agent"
      error={error}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map((stat) => (
          <MiniStat key={stat.label} {...stat} />
        ))}
      </div>
      {quant.trend_analysis && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Trend Analysis
          </h4>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
            {quant.trend_analysis}
          </p>
        </div>
      )}
      {quant.key_metrics_summary && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Key Metrics
          </h4>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
            {quant.key_metrics_summary}
          </p>
        </div>
      )}
    </StageCard>
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
  const tone =
    qual.overall_sentiment === "positive"
      ? "emerald"
      : qual.overall_sentiment === "negative"
        ? "red"
        : "amber";
  // Map -1..1 onto a 0..100% track so the marker reads as a gauge position.
  const gaugePosition = Math.min(100, Math.max(0, ((score + 1) / 2) * 100));

  return (
    <StageCard
      icon={<Newspaper className="h-3.5 w-3.5 text-blue-500" />}
      title="Sentiment Agent"
      error={error}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest",
            tone === "emerald" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
            tone === "red" && "border-red-500/30 bg-red-500/10 text-red-400",
            tone === "amber" && "border-amber-500/30 bg-amber-500/10 text-amber-400"
          )}
        >
          {qual.overall_sentiment || "neutral"}
        </span>
        <span className="text-sm font-semibold text-gray-200 tabular-nums">
          {score >= 0 ? "+" : ""}
          {score.toFixed(2)}
        </span>
        <div className="relative h-1.5 min-w-[140px] flex-1 rounded-full bg-[#1A1A1A]">
          <div
            className={cn(
              "absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ease-out",
              tone === "emerald" && "bg-emerald-400",
              tone === "red" && "bg-red-400",
              tone === "amber" && "bg-amber-400"
            )}
            style={{ left: `${gaugePosition}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {!!qual.key_opportunities?.length && (
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
              Opportunities
            </h4>
            <ul className="space-y-1.5">
              {qual.key_opportunities.map((item, idx) => (
                <li key={idx} className="flex gap-2 text-sm leading-relaxed text-gray-400">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-500/60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!!qual.key_risks?.length && (
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-semibold uppercase tracking-widest text-red-400">
              Risks
            </h4>
            <ul className="space-y-1.5">
              {qual.key_risks.map((item, idx) => (
                <li key={idx} className="flex gap-2 text-sm leading-relaxed text-gray-400">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500/60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {qual.news_summary && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            News Summary
          </h4>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
            {qual.news_summary}
          </p>
        </div>
      )}
    </StageCard>
  );
}

/** A stage that failed with nothing to render — the other cards keep going. */
export function StageErrorCard({ title, message }: { title: string; message: string }) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5 space-y-2">
      <div className="flex items-center gap-2">
        <X className="h-3.5 w-3.5 text-red-400" />
        <h3 className="text-xs font-medium uppercase tracking-widest text-red-400 leading-none">{title}</h3>
      </div>
      <p className="text-sm leading-relaxed text-gray-400">{message}</p>
    </section>
  );
}

/** Shimmer placeholder shown while an agent is still running. */
export function StageSkeleton({ label }: { label: string }) {
  return (
    <section className="rounded-2xl border border-[#27272A] bg-[#111111] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
        <span className="text-xs font-medium uppercase tracking-widest text-gray-500 leading-none">
          {label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-[#1A1A1A]" />
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#1A1A1A]" />
        <div className="h-3 w-full animate-pulse rounded bg-[#1A1A1A]" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-[#1A1A1A]" />
      </div>
    </section>
  );
}
