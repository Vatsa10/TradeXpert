"use client";

import { TrendingUp } from "lucide-react";

import { Panel, Surface } from "@/components/system";
import type { InvestmentReport } from "@/lib/analysis/types";
import { cn } from "@/lib/utils";

import { ReportCharts } from "./ReportCharts";

/** Buy / Sell are market calls, so they use the up/down direction tokens. */
function verdictTone(recommendation: string) {
  if (recommendation.includes("Buy")) {
    return { text: "text-up", surface: "border-up/30 bg-up/[0.06]" };
  }
  if (recommendation.includes("Sell")) {
    return { text: "text-down", surface: "border-down/30 bg-down/[0.06]" };
  }
  return { text: "text-warning", surface: "border-warning/30 bg-warning/[0.06]" };
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="app-label flex items-center gap-3">
        <span className="h-px w-4 bg-hairline-strong" aria-hidden />
        {title}
      </h3>
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-ink-secondary">{children}</p>
    </section>
  );
}

export function ReportView({ report }: { report: InvestmentReport }) {
  const verdict = verdictTone(report.investment_recommendation);
  const confidenceSteps = Math.round(report.confidence_level / 20);

  return (
    <div className="app-enter space-y-10">
      <ReportCharts symbol={report.stock_symbol} />

      <header className="flex flex-col items-start justify-between gap-8 border-b border-hairline pb-8 md:flex-row">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="app-label">Investment Memo</span>
            <span className="size-1 rounded-full bg-hairline-strong" aria-hidden />
            <span className="app-label">{report.report_date}</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {report.company_name}{" "}
            <span className="font-normal text-ink-faint">/</span>{" "}
            <span className="font-medium text-ink-secondary">{report.stock_symbol}</span>
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-ink-secondary">
            {report.executive_summary}
          </p>
        </div>

        <Surface
          padding="lg"
          className={cn(
            "flex min-w-[200px] flex-col items-center justify-center",
            verdict.surface
          )}
        >
          <span className="app-label mb-2">Verdict</span>
          <p className={cn("mb-2 text-2xl font-bold tracking-tight", verdict.text)}>
            {report.investment_recommendation}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((step) => (
              <span
                key={step}
                aria-hidden
                className={cn(
                  "h-3 w-1 rounded-full",
                  confidenceSteps >= step ? "bg-brand" : "bg-hairline-strong"
                )}
              />
            ))}
            <span className="tnum ml-1 text-xs font-medium text-ink-faint">
              {report.confidence_level}% Confidence
            </span>
          </div>
        </Surface>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-8">
          <ReportSection title="Quantitative Research">{report.quantitative_summary}</ReportSection>
          <ReportSection title="Qualitative Analysis">{report.qualitative_summary}</ReportSection>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Panel title="Key Rationale">
            <p className="text-sm leading-relaxed text-ink-secondary">
              {report.recommendation_rationale}
            </p>
          </Panel>

          <Panel
            title={<span className="text-negative">Risk Profile</span>}
            className="border-negative/30 bg-negative/[0.04]"
          >
            <p className="text-sm leading-relaxed text-ink-secondary">{report.risk_assessment}</p>
            <div className="mt-3 flex items-center justify-between border-t border-negative/20 pt-3 text-xs font-medium text-ink-faint">
              <span>MT-SCORE</span>
              <span className="text-negative">Elevated</span>
            </div>
          </Panel>

          <Panel
            title={
              <span className="flex items-center gap-2">
                <TrendingUp className="size-4 text-brand" aria-hidden />
                Horizon
              </span>
            }
          >
            <p className="text-sm leading-relaxed text-ink-secondary">
              Strategic window set for{" "}
              <span className="font-medium text-ink">{report.analysis_period}</span> based on
              multi-agent synthesis.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
