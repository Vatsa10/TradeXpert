import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { searchMutualFundSchemes } from "@/lib/data/providers/mutual-fund";

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
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json({ error: "Query param 'q' is required" }, { status: 400 });
    }

    const schemes = await searchMutualFundSchemes(query);

    return NextResponse.json({
      query,
      count: schemes.length,
      schemes,
    });
  } catch (error) {
    console.error("Mutual fund search error:", error);
    return NextResponse.json({ error: "Failed to search mutual funds" }, { status: 500 });
  }
}
