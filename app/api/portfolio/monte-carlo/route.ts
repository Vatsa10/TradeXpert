import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { runMonteCarlo, MonteCarloParams } from "@/lib/analysis/monte-carlo";

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

    const params: MonteCarloParams = {
      startingCapital: Number(body.startingCapital) || 10000,
      winRate: Math.min(1, Math.max(0, Number(body.winRate) || 0.5)),
      rewardRiskRatio: Number(body.rewardRiskRatio) || 2,
      riskPct: Math.min(1, Math.max(0, Number(body.riskPct) || 0.01)),
      tradeCount: Math.min(2000, Math.max(1, Number(body.tradeCount) || 100)),
      numSimulations: Math.min(5000, Math.max(1, Number(body.numSimulations) || 1000)),
    };

    const result = runMonteCarlo(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Monte Carlo simulation error:", error);
    return NextResponse.json({ error: "Simulation failed" }, { status: 500 });
  }
}
