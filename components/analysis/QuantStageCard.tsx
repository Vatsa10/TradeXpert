"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";

import { Money, NumberValue, Percent, StatCard, StatGrid } from "@/components/system";
import type { QuantitativeAnalysis } from "@/lib/analysis/types";

import { StageCard, StageProse } from "./StageShell";

export function QuantStageCard({
  quant,
  currency,
  error,
}: {
  quant: QuantitativeAnalysis;
  currency: "INR" | "USD";
  error?: string | null;
}) {
  const stats: { label: string; value: React.ReactNode }[] = [
    { label: "Price", value: <Money value={quant.current_price} currency={currency} /> },
  ];
  if (typeof quant.price_change_percentage_24h === "number") {
    stats.push({
      label: "24h",
      value: <Percent value={quant.price_change_percentage_24h} colored signed />,
    });
  }
  if (typeof quant.pe_ratio === "number") {
    stats.push({ label: "P/E", value: <NumberValue value={quant.pe_ratio} digits={1} /> });
  }
  if (typeof quant.market_cap === "number") {
    stats.push({
      label: "Mkt Cap",
      value: <Money value={quant.market_cap} currency={currency} compact />,
    });
  }
  if (typeof quant.week_high_52 === "number") {
    stats.push({
      label: "52w High",
      value: <Money value={quant.week_high_52} currency={currency} />,
    });
  }
  if (typeof quant.week_low_52 === "number") {
    stats.push({
      label: "52w Low",
      value: <Money value={quant.week_low_52} currency={currency} />,
    });
  }

  return (
    <StageCard
      icon={<TrendingUp className="size-3.5 text-brand" aria-hidden />}
      title="Quantitative Agent"
      error={error}
    >
      <StatGrid columns={3}>
        {stats.map((stat, i) => (
          <StatCard key={stat.label} index={i} size="sm" label={stat.label} value={stat.value} />
        ))}
      </StatGrid>
      {quant.trend_analysis && (
        <StageProse label="Trend Analysis">{quant.trend_analysis}</StageProse>
      )}
      {quant.key_metrics_summary && (
        <StageProse label="Key Metrics">{quant.key_metrics_summary}</StageProse>
      )}
    </StageCard>
  );
}
