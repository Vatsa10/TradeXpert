import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import {
  getMarketPulse,
  isPulseScreen,
  PULSE_SCREENS,
} from "@/lib/data/providers/market-pulse";

export async function GET(request: NextRequest) {
  try {
    if (!authInstance) {
      return NextResponse.json({ error: "Auth not initialized" }, { status: 500 });
    }

    const session = await authInstance.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const screenParam = searchParams.get("screen") || "most_actives";

    if (!isPulseScreen(screenParam)) {
      return NextResponse.json(
        { error: `screen must be one of: ${PULSE_SCREENS.join(", ")}` },
        { status: 400 }
      );
    }

    const countParam = searchParams.get("count");
    let count = 25;

    if (countParam !== null) {
      count = Number(countParam);
      if (!Number.isInteger(count) || count < 1 || count > 50) {
        return NextResponse.json(
          { error: "count must be an integer between 1 and 50" },
          { status: 400 }
        );
      }
    }

    const quotes = await getMarketPulse(screenParam, count);

    // The upstream screener is free and unauthenticated, so an empty list means
    // "source unavailable right now", not "no movers today". Say so plainly
    // instead of letting the caller read silence as data.
    return NextResponse.json({
      screen: screenParam,
      count: quotes.length,
      available: quotes.length > 0,
      quotes,
    });
  } catch (error) {
    console.error("[API/market/pulse] Error:", error);
    return NextResponse.json({ error: "Failed to fetch market pulse" }, { status: 500 });
  }
}
