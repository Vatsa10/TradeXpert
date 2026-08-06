import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getTradeHistory } from "@/lib/paper/engine";

export async function GET(request: NextRequest) {
  try {
    if (!authInstance) {
      return NextResponse.json({ error: "Auth not initialized" }, { status: 500 });
    }

    const session = await authInstance.api.getSession({ headers: await headers() });
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limitParam = Number(request.nextUrl.searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.floor(limitParam) : 200;

    const trades = await getTradeHistory(session.user.email as string, limit);
    return NextResponse.json({ mode: "PAPER", count: trades.length, trades });
  } catch (error) {
    console.error("Paper trades history error:", error);
    return NextResponse.json({ error: "Failed to load trade history" }, { status: 500 });
  }
}
