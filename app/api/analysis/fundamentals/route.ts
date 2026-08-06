import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { cleanStatement, computeGrowthRates, extractDCFInputs } from "@/lib/analysis/fundamentals";
import { fetchFundamentals } from "@/lib/data/providers/fundamentals";

export async function GET(request: NextRequest) {
  try {
    if (!authInstance) {
      return NextResponse.json({ error: "Auth not initialized" }, { status: 500 });
    }

    const session = await authInstance.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const symbol = request.nextUrl.searchParams.get("symbol")?.trim().toUpperCase();
    if (!symbol) {
      return NextResponse.json({ error: "symbol query parameter is required" }, { status: 400 });
    }

    const raw = await fetchFundamentals(symbol);
    if (!raw) {
      return NextResponse.json(
        { error: `No financial statements available for ${symbol}` },
        { status: 404 }
      );
    }

    const quarterly = {
      income: cleanStatement(raw.income.quarterly),
      balance: cleanStatement(raw.balance.quarterly, 4),
      cashFlow: cleanStatement(raw.cashFlow.quarterly),
    };
    const annual = {
      income: cleanStatement(raw.income.annual, 5),
      balance: cleanStatement(raw.balance.annual, 3),
      cashFlow: cleanStatement(raw.cashFlow.annual, 5),
    };

    // Quarterly YoY is four periods back; annual YoY is the prior year, hence
    // the different lag. Both share the same growth routine.
    const growth = {
      quarterly: computeGrowthRates(quarterly.income, undefined, 4),
      annual: computeGrowthRates(annual.income, undefined, 1),
    };

    // Annual statements drive the DCF: a single quarter's cash flow is seasonal
    // and would understate a trailing free-cash-flow base.
    const dcfInputs = extractDCFInputs(annual.income, annual.balance, annual.cashFlow);

    return NextResponse.json({
      symbol,
      statements: { annual, quarterly },
      growth,
      dcfInputs,
    });
  } catch (error) {
    console.error("Fundamentals analysis error:", error);
    return NextResponse.json({ error: "Failed to fetch fundamentals" }, { status: 500 });
  }
}
