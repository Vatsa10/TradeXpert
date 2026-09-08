"use client";

import { SectionHeader, formatNum } from "@/components/system";

/**
 * Diverging fill: negative (down/red) for co-movement, positive (up/green) for
 * hedging, transparent near zero. Uses the market direction tokens so the
 * legend reads the same way as every other figure in the app.
 */
function correlationFill(value: number) {
  if (!Number.isFinite(value)) return "transparent";
  const magnitude = Math.min(1, Math.abs(value)) * 0.55;
  return value >= 0
    ? `color-mix(in oklab, var(--app-down) ${magnitude * 100}%, transparent)`
    : `color-mix(in oklab, var(--app-up) ${magnitude * 100}%, transparent)`;
}

export function CorrelationMatrix({
  symbols,
  matrix,
}: {
  symbols: string[];
  matrix: number[][];
}) {
  if (!matrix?.length) return null;

  return (
    <div>
      <SectionHeader
        as="h3"
        title="Correlation matrix"
        description="Red = moves together, green = hedges."
        className="mb-3"
      />
      <div className="horizontal-scroll overflow-x-auto">
        <table className="w-full min-w-[420px] border-separate border-spacing-0.5 text-xs">
          <caption className="sr-only">Pairwise return correlation</caption>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface-raised px-2 py-1.5" />
              {symbols.map((symbol) => (
                <th
                  key={symbol}
                  scope="col"
                  className="px-2 py-1.5 text-center font-medium text-ink-secondary"
                >
                  {symbol}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={symbols[i] ?? i}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-surface-raised px-2 py-1.5 text-left font-medium whitespace-nowrap text-ink-secondary"
                >
                  {symbols[i]}
                </th>
                {row.map((value, j) => (
                  <td
                    key={j}
                    className="tnum rounded px-2 py-1.5 text-center text-ink"
                    style={{ backgroundColor: correlationFill(value) }}
                    title={`${symbols[i]} / ${symbols[j]}: ${formatNum(value)}`}
                  >
                    {formatNum(value)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
