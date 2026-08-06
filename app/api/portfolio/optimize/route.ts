import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { fetchDailySeries } from "@/lib/analysis/technical-indicators";
import { computeHRPWeights } from "@/lib/analysis/portfolio-optimizer";

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

    const seriesResults = await Promise.all(symbols.map((s) => fetchDailySeries(s)));

    const symbolPrices: Record<string, number[]> = {};
    symbols.forEach((symbol, i) => {
      const rows = seriesResults[i];
      if (rows && rows.length >= 20) {
        symbolPrices[symbol] = rows.map((r) => r.close);
      }
    });

    if (Object.keys(symbolPrices).length < 2) {
      return NextResponse.json(
        { error: "Insufficient price history for optimization" },
        { status: 422 }
      );
    }

    const result = computeHRPWeights(symbolPrices);
    if (!result) {
      return NextResponse.json({ error: "Optimization failed" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Portfolio optimize error:", error);
    return NextResponse.json({ error: "Failed to optimize portfolio" }, { status: 500 });
  }
}
