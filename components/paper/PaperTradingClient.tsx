"use client";

import { useState } from "react";
import { RefreshCw, RotateCcw } from "lucide-react";

import { ActionButton } from "@/components/app/ActionButton";
import { ErrorState, InlineNotice, PageShell } from "@/components/system";
import { cn } from "@/lib/utils";

import { AccountSummary } from "./AccountSummary";
import { PositionsPanel } from "./PositionsPanel";
import { ResetDialog } from "./ResetDialog";
import { TradeHistory } from "./TradeHistory";
import { TradeTicket } from "./TradeTicket";
import { usePaperAccount } from "./usePaperAccount";

/**
 * Paper trading workspace. Every route contract is unchanged:
 * GET /api/paper/account, GET /api/paper/trades, GET /api/paper/quote,
 * POST /api/paper/trade and POST /api/paper/account (reset).
 */
export default function PaperTradingClient() {
  const account = usePaperAccount();
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <PageShell
      title="Paper Trading"
      description="Practise Indian equity trades against live prices with simulated capital."
      actions={
        <>
          <ActionButton
            onClick={() => account.load(true)}
            disabled={account.refreshing || account.loading}
          >
            <RefreshCw
              className={cn(account.refreshing && "motion-safe:animate-spin")}
              aria-hidden
            />
            Refresh
          </ActionButton>
          <ActionButton variant="danger" onClick={() => setResetOpen(true)}>
            <RotateCcw aria-hidden />
            Reset
          </ActionButton>
        </>
      }
      notice={
        <InlineNotice tone="warn">
          Paper trading — simulated fills, no real orders.
        </InlineNotice>
      }
    >
      {account.error && <ErrorState message={account.error} onRetry={() => account.load()} />}

      <AccountSummary
        loading={account.loading}
        equity={account.equity}
        cash={account.cash}
        startingCapital={account.startingCapital}
        realizedPnl={account.realizedPnl}
        unrealizedPnl={account.unrealizedPnl}
        returnPct={account.returnPct}
      />

      <PositionsPanel
        loading={account.loading}
        positions={account.positions}
        pricingDegraded={account.pricingDegraded}
      />

      <TradeTicket
        positions={account.positions}
        cash={account.cash}
        onTraded={() => account.load(true)}
      />

      <TradeHistory loading={account.loading} trades={account.trades} />

      <ResetDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        onReset={async () => {
          account.setTrades([]);
          await account.load(true);
        }}
      />
    </PageShell>
  );
}
