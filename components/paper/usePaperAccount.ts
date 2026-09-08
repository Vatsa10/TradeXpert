"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { num, type AccountResponse, type PaperTrade } from "./types";

/**
 * Loads and refreshes the simulated account. Endpoints and response shapes are
 * unchanged: GET /api/paper/account and GET /api/paper/trades.
 */
export function usePaperAccount() {
  const [data, setData] = useState<AccountResponse | null>(null);
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isBackground = false) => {
    if (isBackground) setRefreshing(true);
    else setLoading(true);

    try {
      const [accountRes, tradesRes] = await Promise.all([
        fetch("/api/paper/account", { cache: "no-store" }),
        fetch("/api/paper/trades", { cache: "no-store" }),
      ]);

      const accountJson = await accountRes.json().catch(() => ({}));
      if (!accountRes.ok) {
        throw new Error(accountJson?.error || "Failed to load paper account");
      }

      setData(accountJson as AccountResponse);
      setError(null);

      // A failing history request should not blank out the account summary.
      if (tradesRes.ok) {
        const tradesJson = await tradesRes.json().catch(() => ({}));
        setTrades(Array.isArray(tradesJson?.trades) ? tradesJson.trades : []);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load paper account";
      setError(message);
      if (!isBackground) setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The engine returns every symbol ever traded, including fully-closed ones
  // (qty 0) so realized P&L survives — only open lots belong in this table.
  const positions = useMemo(
    () =>
      (Array.isArray(data?.portfolio?.positions) ? data!.portfolio!.positions! : []).filter(
        (p) => (num(p.qty) ?? 0) > 0
      ),
    [data]
  );

  const cash = num(data?.portfolio?.cash);
  const startingCapital = num(data?.portfolio?.startingCapital);
  const equity = num(data?.portfolio?.equity);
  const realizedPnl = num(data?.portfolio?.totalRealizedPnL);
  const unrealizedPnl = num(data?.portfolio?.totalUnrealizedPnL);
  const pricingDegraded = Boolean(data?.portfolio?.pricingDegraded);

  const returnPct =
    equity !== null && startingCapital !== null && startingCapital > 0
      ? ((equity - startingCapital) / startingCapital) * 100
      : null;

  return {
    load,
    trades,
    setTrades,
    loading,
    refreshing,
    error,
    positions,
    cash,
    startingCapital,
    equity,
    realizedPnl,
    unrealizedPnl,
    pricingDegraded,
    returnPct,
  };
}
