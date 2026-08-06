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

    if (typeof currentFCF !== "number" || typeof sharesOutstanding !== "number") {
      return NextResponse.json(
        { error: "currentFCF and sharesOutstanding are required numbers" },
        { status: 400 }
      );
    }

    const waccResult = computeWACC({
      riskFreeRate,
      beta: typeof beta === "number" ? beta : 1,
      equityRiskPremium,
      costOfDebt: typeof costOfDebt === "number" ? costOfDebt : 8,
      corporateTaxRate,
      debtToEquity: typeof debtToEquity === "number" ? debtToEquity : 0,
    });

    const dcfInput = {
      currentFCF,
      growthRateStage1: typeof growthRateStage1 === "number" ? growthRateStage1 : 12,
      growthRateStage2: typeof growthRateStage2 === "number" ? growthRateStage2 : 6,
      terminalGrowthRate,
      wacc: waccResult.wacc,
      netDebt: typeof netDebt === "number" ? netDebt : 0,
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
