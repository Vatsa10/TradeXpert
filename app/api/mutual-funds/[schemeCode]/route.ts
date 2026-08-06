import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import {
  getMutualFundDetail,
  calculateSIPReturns,
  getStaleNavWarning,
} from "@/lib/data/providers/mutual-fund";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schemeCode: string }> }
) {
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

    const { schemeCode: rawSchemeCode } = await params;
    const schemeCode = Number(rawSchemeCode);

    if (!Number.isInteger(schemeCode) || schemeCode <= 0) {
      return NextResponse.json({ error: "Invalid scheme code" }, { status: 400 });
    }

    const detail = await getMutualFundDetail(schemeCode);

    if (!detail) {
      return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const sipAmountParam = searchParams.get("sipAmount");
    const sipMonthsParam = searchParams.get("sipMonths");

    let sip = null;

    if (sipAmountParam || sipMonthsParam) {
      const sipAmount = Number(sipAmountParam);
      const sipMonths = Number(sipMonthsParam);

      if (!Number.isFinite(sipAmount) || sipAmount <= 0) {
        return NextResponse.json(
          { error: "sipAmount must be a positive number" },
          { status: 400 }
        );
      }

      if (!Number.isFinite(sipMonths) || sipMonths < 1) {
        return NextResponse.json(
          { error: "sipMonths must be a number >= 1" },
          { status: 400 }
        );
      }

      sip = calculateSIPReturns(detail.navHistory, sipAmount, sipMonths);
    }

    // mfapi.in still serves closed/merged schemes with a years-old final NAV, so
    // SIP output can look like a live quote. Flag it rather than silently
    // presenting stale-NAV maths as current.
    const staleNavWarning = getStaleNavWarning(detail.latestNav);

    return NextResponse.json({
      scheme: {
        schemeCode: detail.schemeCode,
        schemeName: detail.schemeName,
        fundHouse: detail.fundHouse,
        schemeType: detail.schemeType,
        schemeCategory: detail.schemeCategory,
      },
      latestNav: detail.latestNav,
      navHistoryCount: detail.navHistory.length,
      navHistory: detail.navHistory,
      sip,
      staleNavWarning,
    });
  } catch (error) {
    console.error("Mutual fund detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mutual fund detail" },
      { status: 500 }
    );
  }
}
