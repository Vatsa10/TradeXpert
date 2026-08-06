import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { computeWACC, computeDCF, computeDCFSensitivity, INDIA_DCF_DEFAULTS } from "@/lib/analysis/dcf";

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

    const {
      currentFCF,
      beta,
      costOfDebt,
      debtToEquity,
      netDebt,
      sharesOutstanding,
      growthRateStage1,
      growthRateStage2,
      riskFreeRate = INDIA_DCF_DEFAULTS.riskFreeRate,
      equityRiskPremium = INDIA_DCF_DEFAULTS.equityRiskPremium,
      terminalGrowthRate = INDIA_DCF_DEFAULTS.terminalGrowthRate,
      corporateTaxRate = INDIA_DCF_DEFAULTS.corporateTaxRate,
    } = body;

    // typeof NaN === "number", so a NaN/Infinity slipping through here would
    // propagate silently into every projection and out to the client.
    if (!Number.isFinite(currentFCF) || !Number.isFinite(sharesOutstanding) || sharesOutstanding <= 0) {
      return NextResponse.json(
        { error: "currentFCF must be a finite number and sharesOutstanding a positive finite number" },
        { status: 400 }
      );
    }

    const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

    if (
      !isFiniteNumber(riskFreeRate) ||
      !isFiniteNumber(equityRiskPremium) ||
      !isFiniteNumber(terminalGrowthRate) ||
      !isFiniteNumber(corporateTaxRate)
    ) {
      return NextResponse.json(
        { error: "riskFreeRate, equityRiskPremium, terminalGrowthRate and corporateTaxRate must be finite numbers" },
        { status: 400 }
      );
    }

    const waccResult = computeWACC({
      riskFreeRate,
      beta: isFiniteNumber(beta) ? beta : 1,
      equityRiskPremium,
      costOfDebt: isFiniteNumber(costOfDebt) ? costOfDebt : 8,
      corporateTaxRate,
      debtToEquity: isFiniteNumber(debtToEquity) ? debtToEquity : 0,
    });

    const dcfInput = {
      currentFCF,
      growthRateStage1: isFiniteNumber(growthRateStage1) ? growthRateStage1 : 12,
      growthRateStage2: isFiniteNumber(growthRateStage2) ? growthRateStage2 : 6,
      terminalGrowthRate,
      wacc: waccResult.wacc,
      netDebt: isFiniteNumber(netDebt) ? netDebt : 0,
      sharesOutstanding,
    };

    const result = computeDCF(dcfInput);
    if (!result) {
      return NextResponse.json(
        { error: "Invalid inputs: terminal growth rate must be less than WACC" },
        { status: 422 }
      );
    }

    const sensitivity = computeDCFSensitivity(
      dcfInput,
      [dcfInput.growthRateStage1 - 4, dcfInput.growthRateStage1, dcfInput.growthRateStage1 + 4],
      [waccResult.wacc - 2, waccResult.wacc, waccResult.wacc + 2]
    );

    return NextResponse.json({ wacc: waccResult, dcf: result, sensitivity });
  } catch (error) {
    console.error("DCF analysis error:", error);
    return NextResponse.json({ error: "Failed to compute DCF" }, { status: 500 });
  }
}
