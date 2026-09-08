"use client";

import { Money, Panel, Percent, Skeleton, StatCard, StatGrid } from "@/components/system";

export function AccountSummary({
  loading,
  equity,
  cash,
  startingCapital,
  realizedPnl,
  unrealizedPnl,
  returnPct,
}: {
  loading: boolean;
  equity: number | null;
  cash: number | null;
  startingCapital: number | null;
  realizedPnl: number | null;
  unrealizedPnl: number | null;
  returnPct: number | null;
}) {
  return (
    <Panel title="Account" description="Simulated equity and profit-and-loss.">
      {loading ? (
        <StatGrid columns={5} aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[86px]" />
          ))}
        </StatGrid>
      ) : (
        <StatGrid columns={5}>
          <StatCard
            index={0}
            label="Equity"
            value={<Money value={equity} currency="INR" digits={2} />}
            hint={
              startingCapital !== null ? (
                <>
                  Start <Money value={startingCapital} currency="INR" digits={0} />
                </>
              ) : undefined
            }
          />
          <StatCard
            index={1}
            label="Cash"
            value={<Money value={cash} currency="INR" digits={2} />}
          />
          <StatCard
            index={2}
            label="Realized P&L"
            value={<Money value={realizedPnl} currency="INR" digits={2} colored signed />}
          />
          <StatCard
            index={3}
            label="Unrealized P&L"
            value={<Money value={unrealizedPnl} currency="INR" digits={2} colored signed />}
          />
          <StatCard
            index={4}
            label="Return"
            value={<Percent value={returnPct} colored signed />}
          />
        </StatGrid>
      )}
    </Panel>
  );
}
