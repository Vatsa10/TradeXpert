// 2-stage Discounted Cash Flow model, ported from
// india-trade-cli/analysis/dcf.py:54-226. Pure arithmetic, no I/O — the
// yfinance-based `dcf_for_symbol` orchestration is intentionally NOT
// ported; callers wire this against TradeXpert's own data providers.
//
// Bug fixed vs the Python original: `compute_wacc` there silently falls
// back to cost-of-equity-only when debtToEquity <= 0 with no beta bounds
// check. Here beta is clamped to a sane range before use, and the
// equity-only fallback is explicit in the return (usedDebtCost: false).

export interface WACCInput {
  riskFreeRate: number; // e.g. 7.0 for 7%
  beta: number;
  equityRiskPremium: number; // e.g. 6.5 for 6.5%
  costOfDebt: number; // pre-tax, e.g. 8.0 for 8%
  corporateTaxRate: number; // e.g. 25.17 for 25.17%
  debtToEquity: number; // total debt / total equity
}

export interface WACCResult {
  costOfEquity: number;
  costOfDebtAfterTax: number;
  wacc: number;
  usedDebtCost: boolean;
}

export function computeWACC(input: WACCInput): WACCResult {
  const clampedBeta = Math.min(3, Math.max(0.2, input.beta));
  const costOfEquity = input.riskFreeRate + clampedBeta * input.equityRiskPremium;

  if (input.debtToEquity <= 0) {
    return { costOfEquity, costOfDebtAfterTax: 0, wacc: costOfEquity, usedDebtCost: false };
  }

  const costOfDebtAfterTax = input.costOfDebt * (1 - input.corporateTaxRate / 100);
  const weightOfDebt = input.debtToEquity / (1 + input.debtToEquity);
  const weightOfEquity = 1 - weightOfDebt;
  const wacc = weightOfEquity * costOfEquity + weightOfDebt * costOfDebtAfterTax;

  return { costOfEquity, costOfDebtAfterTax, wacc, usedDebtCost: true };
}

export interface DCFInput {
  currentFCF: number; // most recent free cash flow
  growthRateStage1: number; // e.g. 12.0 for 12%, applied years 1-5
  growthRateStage2: number; // e.g. 6.0 for 6%, applied years 6-10
  terminalGrowthRate: number; // e.g. 4.0 for 4%, must be < wacc
  wacc: number; // as %, e.g. 11.5
  netDebt: number;
  sharesOutstanding: number;
}

export interface DCFYearProjection {
  year: number;
  fcf: number;
  discountFactor: number;
  presentValue: number;
}

export interface DCFResult {
  projections: DCFYearProjection[];
  sumPVExplicit: number;
  terminalValue: number;
  pvTerminalValue: number;
  enterpriseValue: number;
  equityValue: number;
  fairValuePerShare: number;
}

export function computeDCF(input: DCFInput): DCFResult | null {
  const waccFraction = input.wacc / 100;
  const terminalGrowthFraction = input.terminalGrowthRate / 100;

  if (terminalGrowthFraction >= waccFraction) {
    return null; // Gordon growth model is undefined/negative when g >= r
  }

  const projections: DCFYearProjection[] = [];
  let fcf = input.currentFCF;
  let sumPVExplicit = 0;

  for (let year = 1; year <= 10; year++) {
    const growthRate = year <= 5 ? input.growthRateStage1 : input.growthRateStage2;
    fcf = fcf * (1 + growthRate / 100);

    const discountFactor = 1 / Math.pow(1 + waccFraction, year);
    const presentValue = fcf * discountFactor;
    sumPVExplicit += presentValue;

    projections.push({ year, fcf, discountFactor, presentValue });
  }

  const finalYearFCF = projections[projections.length - 1].fcf;
  const terminalValue = (finalYearFCF * (1 + terminalGrowthFraction)) / (waccFraction - terminalGrowthFraction);
  const pvTerminalValue = terminalValue / Math.pow(1 + waccFraction, 10);

  const enterpriseValue = sumPVExplicit + pvTerminalValue;
  const equityValue = enterpriseValue - input.netDebt;
  const fairValuePerShare = input.sharesOutstanding > 0 ? equityValue / input.sharesOutstanding : 0;

  return {
    projections,
    sumPVExplicit,
    terminalValue,
    pvTerminalValue,
    enterpriseValue,
    equityValue,
    fairValuePerShare,
  };
}

// Sensitivity grid: fair value per share across a growth x WACC matrix.
export interface SensitivityCell {
  growthRate: number;
  wacc: number;
  fairValuePerShare: number | null;
}

export function computeDCFSensitivity(
  base: DCFInput,
  growthRates: number[],
  waccValues: number[]
): SensitivityCell[] {
  const cells: SensitivityCell[] = [];

  for (const growthRate of growthRates) {
    for (const wacc of waccValues) {
      const result = computeDCF({ ...base, growthRateStage1: growthRate, wacc });
      cells.push({ growthRate, wacc, fairValuePerShare: result?.fairValuePerShare ?? null });
    }
  }

  return cells;
}

// Reverse DCF: given the current market price, solve (via bisection) for
// the implied stage-1 growth rate the market is pricing in.
export function reverseDCF(
  input: Omit<DCFInput, "growthRateStage1">,
  currentPricePerShare: number,
  bounds: { min: number; max: number } = { min: -20, max: 60 }
): number | null {
  const impliedValue = (growthRateStage1: number) =>
    computeDCF({ ...input, growthRateStage1 })?.fairValuePerShare ?? null;

  let lo = bounds.min;
  let hi = bounds.max;
  let loVal = impliedValue(lo);
  let hiVal = impliedValue(hi);

  if (loVal === null || hiVal === null) return null;
  if ((loVal - currentPricePerShare) * (hiVal - currentPricePerShare) > 0) return null; // no root in range

  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const midVal = impliedValue(mid);
    if (midVal === null) return null;

    if (Math.abs(midVal - currentPricePerShare) < 0.01) return mid;

    if ((midVal - currentPricePerShare) * (loVal - currentPricePerShare) < 0) {
      hi = mid;
      hiVal = midVal;
    } else {
      lo = mid;
      loVal = midVal;
    }
  }

  return (lo + hi) / 2;
}

// India-market default macro constants, from india-trade-cli/analysis/dcf.py:43-48.
export const INDIA_DCF_DEFAULTS = {
  riskFreeRate: 7.0,
  equityRiskPremium: 6.5,
  terminalGrowthRate: 4.0,
  corporateTaxRate: 25.17,
};
