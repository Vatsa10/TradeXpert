import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getLivePrice } from "@/lib/paper/engine";

// READ-ONLY. Backs the paper trade ticket's "Review" step so the user sees the
// price and cost breakdown before confirming. No order path, paper or real.
export async function GET(request: NextRequest) {
  try {
    if (!authInstance) {
      return NextResponse.json({ error: "Auth not initialized" }, { status: 500 });
    }

    const session = await authInstance.api.getSession({ headers: await headers() });
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const symbol = (request.nextUrl.searchParams.get("symbol") || "").trim();
    if (!symbol) {
      return NextResponse.json({ error: "symbol is required" }, { status: 400 });
    }

    const live = await getLivePrice(symbol, session.user.email as string);
    if (!live) {
      // 200 with ltp:null — the ticket degrades to "priced at execution time"
      // rather than surfacing this as a hard failure.
      return NextResponse.json({
        symbol: symbol.toUpperCase(),
        ltp: null,
        source: null,
        error: "Live quote unavailable — fill price is set at execution time.",
      });
    }

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      ltp: live.price,
      source: live.source,
    });
  } catch (error) {
    console.error("Paper quote error:", error);
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 });
  }
}
