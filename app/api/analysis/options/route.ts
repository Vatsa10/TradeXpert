import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { computeGreeks, classifyMoneyness, RISK_FREE_RATE } from "@/lib/analysis/options";
import { analyzeGEX, DEFAULT_LOT_SIZE, type StrikeInput } from "@/lib/analysis/gex";

interface StrikeBody {
  strike?: unknown;
  callOI?: unknown;
  putOI?: unknown;
  iv?: unknown;
  callPrice?: unknown;
  putPrice?: unknown;
  dte?: unknown;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
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
    const { spot, strikes, lotSize, rate = RISK_FREE_RATE } = body;

    if (typeof spot !== "number" || !Number.isFinite(spot) || spot <= 0) {
      return NextResponse.json({ error: "spot must be a positive number" }, { status: 400 });
    }

    if (!Array.isArray(strikes) || strikes.length === 0) {
      return NextResponse.json(
        { error: "strikes must be a non-empty array of {strike, callOI, putOI, iv, dte}" },
        { status: 400 }
      );
    }

    const rows: StrikeInput[] = [];
    for (const raw of strikes as StrikeBody[]) {
      if (typeof raw?.strike !== "number" || !Number.isFinite(raw.strike) || raw.strike <= 0) {
        return NextResponse.json(
          { error: "each strike entry requires a positive numeric `strike`" },
          { status: 400 }
        );
      }
      if (typeof raw.dte !== "number" || !Number.isFinite(raw.dte)) {
        return NextResponse.json(
          { error: `strike ${raw.strike} is missing a numeric \`dte\`` },
          { status: 400 }
        );
      }
      rows.push({
        strike: raw.strike,
        callOI: num(raw.callOI, 0),
        putOI: num(raw.putOI, 0),
        iv: typeof raw.iv === "number" && Number.isFinite(raw.iv) ? raw.iv : undefined,
        callPrice:
          typeof raw.callPrice === "number" && Number.isFinite(raw.callPrice)
            ? raw.callPrice
            : undefined,
        putPrice:
          typeof raw.putPrice === "number" && Number.isFinite(raw.putPrice)
            ? raw.putPrice
            : undefined,
        dte: raw.dte,
      });
    }

    const resolvedRate = num(rate, RISK_FREE_RATE);

    const greeks = rows.map((row) => {
      const call = computeGreeks({
        spot,
        strike: row.strike,
        dteDays: row.dte,
        optionType: "CE",
        iv: row.iv,
        marketPrice: row.callPrice,
        rate: resolvedRate,
      });
      const put = computeGreeks({
        spot,
        strike: row.strike,
        dteDays: row.dte,
        optionType: "PE",
        iv: row.iv,
        marketPrice: row.putPrice,
        rate: resolvedRate,
      });
      return {
        strike: row.strike,
        dte: row.dte,
        call: { ...call, moneyness: classifyMoneyness(spot, row.strike, "CE") },
        put: { ...put, moneyness: classifyMoneyness(spot, row.strike, "PE") },
      };
    });

    const gex = analyzeGEX(spot, rows, {
      lotSize: num(lotSize, DEFAULT_LOT_SIZE),
    });

    const totalCallOI = rows.reduce((sum, r) => sum + r.callOI, 0);
    const totalPutOI = rows.reduce((sum, r) => sum + r.putOI, 0);

    return NextResponse.json({
      spot,
      rate: resolvedRate,
      greeks,
      gex: {
        strikes: gex.strikes,
        totalNetGEX: gex.totalNetGEX,
        regime: gex.regime,
        maxGEXStrike: gex.maxGEXStrike,
        skippedStrikes: gex.skippedStrikes,
        interpretation: gex.interpretation,
      },
      flipPoint: gex.flipPoint,
      putCallRatio: totalCallOI > 0 ? totalPutOI / totalCallOI : null,
    });
  } catch (error) {
    console.error("Options analysis error:", error);
    return NextResponse.json({ error: "Failed to compute options analytics" }, { status: 500 });
  }
}
