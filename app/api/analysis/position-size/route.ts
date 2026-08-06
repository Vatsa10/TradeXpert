import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { computePositionRecommendation, toReturns } from "@/lib/analysis/position-sizer";

// Research-only endpoint: returns a recommended maximum position size for
// study. It never places, stages, or routes an order.

function asReturnSeries(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const nums = value.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length < 2) return [];
  // Heuristic: price series (all positive, values well above 1) get converted
  // to returns; anything already return-shaped is used as-is.
  const looksLikePrices = nums.every((n) => n > 1);
  return looksLikePrices ? toReturns(nums) : nums;
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

    const {
      symbol,
      accountCapital,
      cashAvailable,
      currentPrice,
      winRate,
      avgWinPct,
      avgLossPct,
      atrPct,
      lotSize,
      vix,
      earningsDate,
      targetRiskPct,
      candidateSeries,
      existingSeries,
    } = body;

    if (typeof symbol !== "string" || !symbol.trim()) {
      return NextResponse.json({ error: "symbol is required" }, { status: 400 });
    }

    const numericFields = { accountCapital, currentPrice, winRate, avgWinPct, avgLossPct, atrPct };
    for (const [key, value] of Object.entries(numericFields)) {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return NextResponse.json({ error: `${key} is required and must be a number` }, { status: 400 });
      }
    }

    if (accountCapital <= 0 || currentPrice <= 0) {
      return NextResponse.json(
        { error: "accountCapital and currentPrice must be greater than zero" },
        { status: 422 }
      );
    }

    if (winRate < 0 || winRate > 1) {
      return NextResponse.json({ error: "winRate must be a fraction between 0 and 1" }, { status: 422 });
    }

    const existingReturnsBySymbol: Record<string, number[]> = {};
    if (existingSeries && typeof existingSeries === "object" && !Array.isArray(existingSeries)) {
      for (const [sym, series] of Object.entries(existingSeries as Record<string, unknown>)) {
        const returns = asReturnSeries(series);
        if (returns.length) existingReturnsBySymbol[sym] = returns;
      }
    }

    const parsedEarnings =
      typeof earningsDate === "string" && !Number.isNaN(Date.parse(earningsDate))
        ? new Date(earningsDate)
        : null;

    const recommendation = computePositionRecommendation({
      riskGate: {
        accountCapital,
        cashAvailable: typeof cashAvailable === "number" ? cashAvailable : accountCapital,
        currentPrice,
        earningsDate: parsedEarnings,
        vix: typeof vix === "number" ? vix : null,
      },
      sizing: {
        symbol: symbol.trim().toUpperCase(),
        winRate,
        avgWinPct,
        avgLossPct,
        atrPct,
        lotSize: typeof lotSize === "number" ? lotSize : 1,
      },
      candidateReturns: asReturnSeries(candidateSeries),
      existingReturnsBySymbol,
      targetRiskPct: typeof targetRiskPct === "number" ? targetRiskPct : undefined,
    });

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error("Position size analysis error:", error);
    return NextResponse.json({ error: "Failed to compute position size" }, { status: 500 });
  }
}
