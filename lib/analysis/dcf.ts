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
  // Math.min/Math.max propagate NaN, so an unparsed beta would clamp to NaN
  // and make the whole WACC (and every DCF built on it) NaN.
  const beta = Number.isFinite(input.beta) ? input.beta : 1;
  const clampedBeta = Math.min(3, Math.max(0.2, beta));
  const costOfEquity = input.riskFreeRate + clampedBeta * input.equityRiskPremium;

  if (!Number.isFinite(input.debtToEquity) || input.debtToEquity <= 0) {
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

  // Non-finite inputs would propagate NaN silently all the way to
  // fairValuePerShare, which reads as a real (but meaningless) number downstream.
  if (
    !Number.isFinite(waccFraction) ||
    !Number.isFinite(terminalGrowthFraction) ||
    !Number.isFinite(input.currentFCF) ||
    !Number.isFinite(input.growthRateStage1) ||
    !Number.isFinite(input.growthRateStage2) ||
    !Number.isFinite(input.netDebt)
  ) {
    return null;
  }

  // A non-positive discount rate makes the present-value sum divergent.
  if (waccFraction <= 0) return null;

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

  if (!Number.isFinite(currentPricePerShare) || currentPricePerShare <= 0) return null;
  if (!(bounds.min < bounds.max)) return null;

  let lo = bounds.min;
  let hi = bounds.max;
  let loVal = impliedValue(lo);
  const hiVal = impliedValue(hi);

  if (loVal === null || hiVal === null) return null;

  let loDiff = loVal - currentPricePerShare;
  const hiDiff = hiVal - currentPricePerShare;

  // Either endpoint may already BE the root; the strict `> 0` bracket test
  // rejected that case as "no root in range" instead of returning it.
  if (loDiff === 0) return lo;
  if (hiDiff === 0) return hi;
  if (loDiff * hiDiff > 0) return null; // genuinely no sign change in range

  // Tolerance is relative to the price so this converges equally well for a
  // Rs 20 penny stock and a Rs 60,000 share, where an absolute 0.01 either
  // terminated far too early or never at all.
  const tolerance = Math.max(1e-6, Math.abs(currentPricePerShare) * 1e-4);

  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const midVal = impliedValue(mid);
    if (midVal === null) return null;

    const midDiff = midVal - currentPricePerShare;
    if (Math.abs(midDiff) < tolerance) return mid;

    if (midDiff * loDiff < 0) {
      hi = mid;
    } else {
      lo = mid;
      loDiff = midDiff;
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
