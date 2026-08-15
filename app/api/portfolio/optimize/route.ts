import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { fetchDailySeries } from "@/lib/analysis/technical-indicators";
import {
  alignReturns,
  computeHRPWeights,
  computeInverseVolWeights,
  computeMeanVarianceWeights,
} from "@/lib/analysis/portfolio-optimizer";
import { computePortfolioMetrics } from "@/lib/analysis/portfolio-metrics";

const METHODS = ["hrp", "inverse_vol", "mean_variance"] as const;
type OptimizeMethod = (typeof METHODS)[number];

// An absent ?method= defaults to hrp, but an unknown one is a caller mistake and
// must not be silently coerced into a different optimization than was asked for.
function parseMethod(value: string | null): OptimizeMethod | null {
  if (value === null || value === "") return "hrp";
  return METHODS.includes(value as OptimizeMethod) ? (value as OptimizeMethod) : null;
}

export async function POST(request: NextRequest) {
  try {
    if (!authInstance) {
      return NextResponse.json({ error: "Auth not initialized" }, { status: 500 });
    }

    const session = await authInstance.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    let symbols: string[] = Array.isArray(body?.symbols) ? body.symbols : [];

    if (symbols.length === 0) {
      symbols = await getWatchlistSymbolsByEmail(session.user.email);
    }

    symbols = symbols.slice(0, 10);

    if (symbols.length < 2) {
      return NextResponse.json(
        { error: "Need at least 2 symbols (watchlist or provided) to optimize a portfolio" },
        { status: 400 }
      );
    }

    const methodParam = request.nextUrl.searchParams.get("method");
    const method = parseMethod(methodParam);
    if (!method) {
      return NextResponse.json(
        { error: `Unknown method "${methodParam}". Allowed values: ${METHODS.join(", ")}` },
        { status: 400 }
      );
    }

    const seriesResults = await Promise.all(symbols.map((s) => fetchDailySeries(s)));

    const symbolPrices: Record<string, number[]> = {};
    const symbolDates: Record<string, string[]> = {};
    // A symbol can drop out either because the upstream fetch failed (null) or
    // because it genuinely has too little history; the caller needs to know which.
    const droppedSymbols: string[] = [];
    const fetchFailed: string[] = [];
    const shortHistory: string[] = [];
    symbols.forEach((symbol, i) => {
      const rows = seriesResults[i];
      if (rows && rows.length >= 20) {
        symbolPrices[symbol] = rows.map((r) => r.close);
        symbolDates[symbol] = rows.map((r) => r.date);
        return;
      }
      droppedSymbols.push(symbol);
      if (rows === null) fetchFailed.push(symbol);
      else shortHistory.push(symbol);
    });

    if (Object.keys(symbolPrices).length < 2) {
      // Say *which* symbols dropped and why — a bare "insufficient history" is
      // indistinguishable from an outage on the client side.
      const failReasons: string[] = [];
      if (fetchFailed.length) failReasons.push(`price data unavailable: ${fetchFailed.join(", ")}`);
      if (shortHistory.length)
        failReasons.push(`insufficient price history (<20 days): ${shortHistory.join(", ")}`);
      return NextResponse.json(
        {
          error: "Insufficient price history for optimization",
          droppedSymbols,
          detail: failReasons.join("; ") || null,
        },
        { status: 422 }
      );
    }

    const result =
      method === "inverse_vol"
        ? computeInverseVolWeights(symbolPrices)
        : method === "mean_variance"
          ? computeMeanVarianceWeights(symbolPrices)
          : computeHRPWeights(symbolPrices);
    if (!result) {
      return NextResponse.json({ error: "Optimization failed" }, { status: 500 });
    }

    const aligned = alignReturns(symbolPrices);
    const returnSeries: Record<string, number[]> = {};
    if (aligned) {
      aligned.symbols.forEach((s, i) => {
        returnSeries[s] = aligned.returns[i];
      });
    }

    const performance = computePortfolioMetrics(result.weights, returnSeries);

    // Returns lose the first observation of each price series, so line up the
    // dates with the trailing window the metrics were actually computed over.
    const seriesLength = performance?.portfolioCumulative.length ?? 0;
    const dateSource = result.symbols
      .map((s) => symbolDates[s] ?? [])
      .reduce((a, b) => (b.length && (!a.length || b.length < a.length) ? b : a), [] as string[]);
    const dates = seriesLength > 0 ? dateSource.slice(dateSource.length - seriesLength) : [];

    // The optimizer can also drop a symbol during alignment, so reconcile against
    // what actually came back rather than only against the fetch stage.
    const missing = symbols.filter((s) => !result.symbols.includes(s));
    const dropped = [...droppedSymbols, ...missing.filter((s) => !droppedSymbols.includes(s))];
    const reasons: string[] = [];
    if (fetchFailed.length) reasons.push(`price data unavailable: ${fetchFailed.join(", ")}`);
    if (shortHistory.length)
      reasons.push(`insufficient price history (<20 days): ${shortHistory.join(", ")}`);
    const unexplained = dropped.filter(
      (s) => !fetchFailed.includes(s) && !shortHistory.includes(s)
    );
    if (unexplained.length) reasons.push(`excluded during return alignment: ${unexplained.join(", ")}`);

    return NextResponse.json({
      ...result,
      method,
      dates,
      droppedSymbols: dropped,
      warning: dropped.length
        ? `${dropped.length} of ${symbols.length} requested symbols were excluded (${reasons.join("; ")})`
        : null,
      metrics: performance?.metrics ?? null,
      portfolioCumulative: performance?.portfolioCumulative ?? [],
      assetCumulative: performance?.assetCumulative ?? {},
    });
  } catch (error) {
    console.error("Portfolio optimize error:", error);
    return NextResponse.json({ error: "Failed to optimize portfolio" }, { status: 500 });
  }
}
