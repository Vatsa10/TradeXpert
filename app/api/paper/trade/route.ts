import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { executePaperTrade } from "@/lib/paper/engine";

// PAPER ONLY. This route simulates fills locally; it never reaches a broker
// and must never gain an order-placement code path in this phase.
export async function POST(request: NextRequest) {
  try {
    if (!authInstance) {
      return NextResponse.json({ error: "Auth not initialized" }, { status: 500 });
    }

    const session = await authInstance.api.getSession({ headers: await headers() });
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const symbol = typeof body?.symbol === "string" ? body.symbol.trim() : "";
    const side = body?.side;
    const qty = body?.qty;

    if (!symbol) {
      return NextResponse.json({ error: "symbol must be a non-empty string" }, { status: 400 });
    }
    if (side !== "BUY" && side !== "SELL") {
      return NextResponse.json({ error: "side must be 'BUY' or 'SELL'" }, { status: 400 });
    }
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty <= 0) {
      return NextResponse.json({ error: "qty must be a positive integer" }, { status: 400 });
    }

    const result = await executePaperTrade(session.user.email as string, {
      symbol,
      side,
      qty,
      rationale: typeof body?.rationale === "string" ? body.rationale : "",
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, ...(result.riskGate ? { riskGate: result.riskGate } : {}) },
        { status: result.status }
      );
    }

    return NextResponse.json({
      mode: "PAPER",
      trade: result.trade,
      costs: result.costs,
      priceSource: result.priceSource,
      cash: result.cash,
    });
  } catch (error) {
    console.error("Paper trade error:", error);
    return NextResponse.json({ error: "Failed to execute paper trade" }, { status: 500 });
  }
}
