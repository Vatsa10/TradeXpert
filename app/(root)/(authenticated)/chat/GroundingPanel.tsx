import * as React from "react";
import { ExternalLink, Newspaper, Search, Database, Cpu, LineChart } from "lucide-react";

import { Badge, Pill, Surface } from "@/components/system";
import { getConfidenceLabel } from "@/lib/chat/confidence";
import { cn } from "@/lib/utils";

import type { GroundingSource, LLMResponse, Trend } from "./chat-types";

const TREND_TONE = {
  bullish: "up",
  bearish: "down",
  neutral: "neutral",
} as const;

const TREND_LABEL: Record<Trend, string> = {
  bullish: "Bullish",
  bearish: "Bearish",
  neutral: "Neutral",
};

const ADVICE_TONE = {
  Buy: "up",
  Sell: "down",
  Hold: "neutral",
  Wait: "warning",
} as const;

const SOURCE_ICON: Record<GroundingSource["type"], React.ElementType> = {
  finnhub: Database,
  news: Newspaper,
  search: Search,
  alpha: LineChart,
  llm: Cpu,
};

const QUALITY_TONE = { high: "positive", medium: "warning", low: "negative" } as const;

/** 0..1 confidence rendered as a labelled meter. */
function ConfidenceMeter({ value, trend }: { value: number; trend: Trend }) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const pct = Math.round(safe * 100);
  const fill =
    trend === "bullish" ? "bg-up" : trend === "bearish" ? "bg-down" : "bg-brand";

  return (
    <div className="min-w-40 flex-1">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="app-label">Confidence</span>
        <span className="tnum text-xs text-ink-secondary">
          {getConfidenceLabel(safe)} · {pct}%
        </span>
      </div>
      <div
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Model confidence"
        className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]"
      >
        <div
          className={cn(
            "h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out-strong",
            fill
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SourcesStrip({ sources }: { sources: GroundingSource[] }) {
  return (
    <div>
      <p className="app-label mb-1.5">Sources</p>
      <ul className="flex flex-wrap gap-1.5">
        {sources.map((source, i) => {
          const Icon = SOURCE_ICON[source.type] ?? Cpu;
          const label = source.title?.trim() || source.type;
          const chip = (
            <>
              <Icon className="size-3 shrink-0" aria-hidden />
              <span className="max-w-56 truncate">{label}</span>
              {source.url && <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />}
            </>
          );
          return (
            <li key={`${source.type}-${i}`}>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="app-focus app-press rounded-md"
                >
                  <Badge tone="neutral" className="[@media(hover:hover)]:hover:border-brand/40 [@media(hover:hover)]:hover:text-ink">
                    {chip}
                  </Badge>
                </a>
              ) : (
                <Badge tone="neutral" title={label}>
                  {chip}
                </Badge>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Structured grounding for one assistant turn: trend, advice, confidence,
 * numbered evidence, signal trace and the sources the claims rest on.
 * Rendered only when the API returned `llmResponse`.
 */
export function GroundingPanel({ response }: { response: LLMResponse }) {
  const reasoning = response.reasoning?.filter((r) => r?.trim()) ?? [];
  const trace = response.signalTrace?.filter((s) => s?.trim()) ?? [];
  const sources = response.sources?.filter(Boolean) ?? [];

  return (
    <Surface
      level="raised-2"
      radius="tile"
      padding="sm"
      className="app-enter mt-3 space-y-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={TREND_TONE[response.trend] ?? "neutral"} pill uppercase>
          {TREND_LABEL[response.trend] ?? response.trend}
        </Badge>
        {response.advice && (
          <Badge tone={ADVICE_TONE[response.advice] ?? "neutral"} pill>
            {response.advice}
          </Badge>
        )}
        {response.dataQuality && (
          <Badge tone={QUALITY_TONE[response.dataQuality] ?? "neutral"} pill>
            {response.dataQuality} data
          </Badge>
        )}
      </div>

      <ConfidenceMeter value={response.confidence} trend={response.trend} />

      {response.recommendation && (
        <p className="text-sm text-ink-secondary">{response.recommendation}</p>
      )}

      {reasoning.length > 0 && (
        <div>
          <p className="app-label mb-1.5">Evidence</p>
          <ol className="space-y-1.5">
            {reasoning.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-secondary">
                <span className="tnum mt-px w-4 shrink-0 text-right text-xs text-ink-faint">
                  {i + 1}.
                </span>
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {trace.length > 0 && (
        <div>
          <p className="app-label mb-1.5">Signal trace</p>
          <div className="flex flex-wrap gap-1.5">
            {trace.map((signal, i) => (
              <Pill key={i} tone="accent" title={signal}>
                <span className="max-w-64 truncate">{signal}</span>
              </Pill>
            ))}
          </div>
        </div>
      )}

      {sources.length > 0 && <SourcesStrip sources={sources} />}
    </Surface>
  );
}

/** Fallback for older sessions: the flat `sources: string[]` field. */
export function PlainSources({ sources }: { sources: string[] }) {
  const clean = sources.filter((s) => s?.trim());
  if (clean.length === 0) return null;
  return (
    <div className="mt-3 border-t border-hairline pt-2">
      <p className="app-label mb-1.5">Sources</p>
      <div className="flex flex-wrap gap-1.5">
        {clean.map((s, i) => (
          <Badge key={`${s}-${i}`} tone="neutral" title={s}>
            <span className="max-w-56 truncate">{s}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
