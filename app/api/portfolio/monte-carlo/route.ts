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

    // `Number(x) || fallback` swallows legitimate zeros (winRate: 0 silently
    // became 0.5), so fall back only when the value is genuinely absent/invalid.
    const num = (value: unknown, fallback: number): number => {
      const n = Number(value);
      return value === null || value === undefined || value === "" || !Number.isFinite(n)
        ? fallback
        : n;
    };

    // Out-of-range inputs used to be clamped, which turned nonsense like
    // winRate: 999 into a confident 100%-win simulation. Reject them instead.
    const startingCapital = num(body.startingCapital, 10000);
    const winRate = num(body.winRate, 0.5);
    const rewardRiskRatio = num(body.rewardRiskRatio, 2);
    const riskPct = num(body.riskPct, 0.01);
    const tradeCount = num(body.tradeCount, 100);
    const numSimulations = num(body.numSimulations, 1000);
    const ruinThreshold = num(body.ruinThreshold, 0.5);

    const invalid =
      startingCapital <= 0
        ? "startingCapital must be greater than zero"
        : winRate < 0 || winRate > 1
          ? "winRate must be a fraction between 0 and 1"
          : riskPct < 0 || riskPct > 1
            ? "riskPct must be a fraction between 0 and 1"
            : rewardRiskRatio <= 0
              ? "rewardRiskRatio must be greater than zero"
              : tradeCount < 1 || tradeCount > 2000
                ? "tradeCount must be between 1 and 2000"
                : numSimulations < 1 || numSimulations > 5000
                  ? "numSimulations must be between 1 and 5000"
                  : ruinThreshold < 0 || ruinThreshold >= 1
                    ? "ruinThreshold must be a fraction between 0 and 1 (exclusive)"
                    : null;

    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 422 });
    }

    const params: MonteCarloParams = {
      startingCapital,
      winRate,
      rewardRiskRatio,
      riskPct,
      tradeCount: Math.floor(tradeCount),
      numSimulations: Math.floor(numSimulations),
      ruinThreshold,
    };

    const result = runMonteCarlo(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Monte Carlo simulation error:", error);
    return NextResponse.json({ error: "Simulation failed" }, { status: 500 });
  }
}
