"use client";

import { useEffect, useState } from "react";
import { getAnalysisStatusAction } from "@/lib/actions/analysis.actions";
import { InvestmentReport as StockAnalysisReport } from "@/lib/analysis/types";
import { AlertTriangle, ArrowLeft, CheckCircle2, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import TradingViewWidget from "@/components/TradingViewWidget";
import { TECHNICAL_ANALYSIS_WIDGET_CONFIG, SYMBOL_INFO_WIDGET_CONFIG } from "@/lib/constants";
import {
  Badge,
  EmptyState,
  PageShell,
  Panel,
  SectionHeader,
  Skeleton,
  Surface,
} from "@/components/system";

const TV_SYMBOL_INFO_URL = "https://www.tradingview.com/external-embedding/embed-widget-symbol-info.js";
const TV_TECHNICAL_ANALYSIS_URL = "https://www.tradingview.com/external-embedding/embed-widget-technical-analysis.js";

interface ComparisonReport extends StockAnalysisReport {
  requestId: string;
}

/** Buy / Sell / Hold mapped onto the one semantic tone scale used app-wide. */
function recommendationTone(recommendation: string) {
  if (recommendation.includes("Buy")) return "positive" as const;
  if (recommendation.includes("Sell")) return "negative" as const;
  return "warning" as const;
}

export default function ComparisonView({ ids }: { ids: string[] }) {
  const [reports, setReports] = useState<ComparisonReport[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await Promise.all(
          ids.map(async (id) => {
            const res = await getAnalysisStatusAction(id);
            if (!res.report) throw new Error("Report not found");
            return { ...res.report, requestId: id } as ComparisonReport;
          })
        );
        setReports(data);
      } catch (err) {
        console.error("Comparison fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (ids.length > 0) fetchReports();
  }, [ids]);

  return (
    <PageShell
      width="wide"
      eyebrow="Analysis"
      title="Comparative Intelligence"
      description="Cross-referencing live market metrics and AI sentiment."
      actions={
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Go back"
          className="app-press app-focus text-ink-secondary hover:bg-surface-raised-2 hover:text-ink"
        >
          <ArrowLeft className="size-5" />
        </Button>
      }
    >
      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {ids.map((id) => (
            <div key={id} className="space-y-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-[540px] w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          title="Reports unavailable"
          description="These analyses could not be loaded. Try running them again from the analysis page."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {reports.map((report, idx) => (
            <ReportSection key={report.requestId} report={report} idx={idx} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

/** One column of the comparison: live TradingView metrics above the AI verdict. */
function ReportSection({ report, idx }: { report: ComparisonReport; idx: number }) {
  return (
    <div className="app-enter space-y-6" style={{ "--i": idx } as React.CSSProperties}>
      {/* 1. Live TradingView Metrics */}
      <div className="space-y-3">
        <SectionHeader
          as="h3"
          title={
            <span className="app-label flex items-center gap-2">
              <Zap className="size-3 text-brand" />
              Live Market Pulse
            </span>
          }
        />
        <Panel padding="none" className="overflow-hidden">
          <TradingViewWidget
            scriptUrl={TV_SYMBOL_INFO_URL}
            config={SYMBOL_INFO_WIDGET_CONFIG(report.stock_symbol)}
            height={160}
          />
          <div className="bg-surface-sunken p-4">
            <TradingViewWidget
              scriptUrl={TV_TECHNICAL_ANALYSIS_URL}
              config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(report.stock_symbol)}
              height={380}
            />
          </div>
        </Panel>
      </div>

      {/* 2. AI Strategic Report */}
      <div className="space-y-3">
        <SectionHeader
          as="h3"
          title={
            <span className="app-label flex items-center gap-2">
              <TrendingUp className="size-3 text-brand" />
              AI Strategic Verdict
            </span>
          }
        />
        <Panel padding="none" className="overflow-hidden">
          <div className="space-y-4 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <Badge tone="neutral" size="sm" uppercase>
                {report.stock_symbol} Report
              </Badge>
              <Badge tone={recommendationTone(report.investment_recommendation)} size="sm" uppercase pill>
                {report.investment_recommendation}
              </Badge>
            </div>

            <h3 className="text-xl font-semibold tracking-tight text-ink">{report.company_name}</h3>

            <div className="flex items-center gap-2 border-t border-hairline pt-4">
              <div className="flex items-center gap-1.5" aria-hidden>
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "h-3 w-1 rounded-full",
                      report.confidence_level / 20 >= s ? "bg-brand" : "bg-surface-raised-2"
                    )}
                  />
                ))}
              </div>
              <span className="app-label ml-1 tnum">
                AI Trust Index: {report.confidence_level}%
              </span>
            </div>
          </div>

          <div className="space-y-6 border-t border-hairline p-4 sm:p-6">
            <Surface level="raised-2" radius="tile" padding="sm">
              <h4 className="app-label mb-2 flex items-center gap-2">
                <CheckCircle2 className="size-3 text-positive" /> Core Thesis
              </h4>
              <p className="text-sm italic leading-relaxed text-ink-secondary">
                &ldquo;{report.executive_summary}&rdquo;
              </p>
            </Surface>

            <div className="space-y-3">
              <h4 className="app-label flex items-center gap-2">
                <TrendingUp className="size-3" /> Technical Analysis
              </h4>
              <p className="text-sm leading-relaxed text-ink-secondary">
                {report.quantitative_summary}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="app-label">Sentiment &amp; News</h4>
              <p className="text-sm leading-relaxed text-ink-secondary">
                {report.qualitative_summary}
              </p>
            </div>

            <div className="border-t border-hairline pt-6">
              <h4 className="app-label mb-3 flex items-center gap-2 text-negative">
                <AlertTriangle className="size-3" /> Risk Profile
              </h4>
              <p className="rounded-lg border border-negative/20 bg-negative/5 p-4 text-sm leading-relaxed text-ink-secondary">
                {report.risk_assessment}
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
