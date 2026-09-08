"use client";

import {
  NumberValue,
  Percent,
  StatCard,
  StatGrid,
  Surface,
  formatNum,
} from "@/components/system";

export interface PositionRecommendation {
  symbol: string;
  riskGate: {
    maxAllocationPct: number;
    maxAllocationAmount: number;
    maxShares: number;
    constraints: string[];
    cashConstrained: boolean;
  };
  sizing: {
    recommendedQty: number;
    positionPct: number;
    volatilityScalar: number;
    correlationPenalty: number;
    kellyFraction: number;
    rawKelly: number;
    rationale: string;
  };
  recommendedQty: number;
  recommendedValue: number;
  recommendedPct: number;
  bindingConstraint: "risk-gate" | "position-sizer";
  correlation: { maxCorrelation: number; mostCorrelatedSymbol: string | null };
  notes: string[];
  disclaimer: string;
}

export function PositionSizeResult({ result }: { result: PositionRecommendation }) {
  const constraints = result.notes?.length ? result.notes : result.riskGate.constraints;

  const breakdown = [
    { label: "Raw Kelly", value: formatNum(result.sizing.rawKelly, 4) },
    { label: "Half-Kelly applied", value: formatNum(result.sizing.kellyFraction, 4) },
    { label: "Volatility scalar", value: formatNum(result.sizing.volatilityScalar, 3) },
    {
      label: "Correlation penalty",
      value: `${formatNum(result.sizing.correlationPenalty * 100, 1)}%`,
    },
    { label: "Risk-gate share cap", value: String(result.riskGate.maxShares) },
  ];

  return (
    <Surface level="raised-2" radius="tile" padding="md" className="mt-6 space-y-5">
      <StatGrid columns={4}>
        <StatCard
          index={0}
          label="Recommended qty"
          value={<NumberValue value={result.recommendedQty} digits={0} />}
          tone={result.recommendedQty === 0 ? "negative" : "neutral"}
        />
        <StatCard
          index={1}
          label="Position value"
          value={<NumberValue value={result.recommendedValue} digits={2} />}
        />
        <StatCard
          index={2}
          label="Allocation"
          value={<Percent value={result.recommendedPct} as="ratio" />}
        />
        <StatCard
          index={3}
          label="Binding constraint"
          value={result.bindingConstraint === "risk-gate" ? "Risk gate" : "Sizer"}
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <p className="app-label mb-2">Constraints applied</p>
          <ul className="space-y-1.5">
            {constraints.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-secondary">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {note}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="app-label mb-2">Sizing breakdown</p>
          <dl className="divide-y divide-hairline">
            {breakdown.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 py-2">
                <dt className="text-sm text-ink-secondary">{row.label}</dt>
                <dd className="tnum text-sm font-medium text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <p className="text-xs text-ink-faint">{result.disclaimer}</p>
    </Surface>
  );
}
