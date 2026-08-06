// Black-Scholes options analytics, ported from
// india-trade-cli/analysis/options.py:103-247. Pure math, no I/O — the
// py_vollib dependency and the yfinance/broker-chain orchestration
// (`analyse_option`, `compute_iv_rank_from_history`) are intentionally NOT
// ported; callers wire this against TradeXpert's own data providers.
//
// Bug fixed vs the Python original: `_bs_greeks_manual` runs a damped
// Newton-Raphson loop that silently `break`s on zero vega, on an exception,
// or simply exhausts its 100 iterations — and then returns whatever sigma it
// happened to land on as if it were a solved IV. Here the solver returns an
// explicit `converged: boolean` so callers can reject a bogus IV instead of
// trading on it.

// RBI repo rate, as a decimal.
export const RISK_FREE_RATE = 0.065

const MIN_SIGMA = 0.001
const MAX_SIGMA = 5.0

export type OptionType = "CE" | "PE"

export interface Greeks {
  delta: number
  gamma: number
  theta: number // per calendar day
  vega: number // per 1% change in IV
  rho: number // per 1% change in rate
  iv: number // decimal
  ivPct: number
}

export interface GreeksResult extends Greeks {
  converged: boolean
  theoreticalPrice: number
  iterations: number
}

// ── Normal distribution helpers ───────────────────────────────

export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

// Abramowitz & Stegun 7.1.26 based erf approximation, |error| < 1.5e-7.
export function normCdf(x: number): number {
  if (!Number.isFinite(x)) return x > 0 ? 1 : 0
  const sign = x < 0 ? -1 : 1
  const z = Math.abs(x) / Math.SQRT2
  const t = 1 / (1 + 0.3275911 * z)
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-z * z)
  return 0.5 * (1 + sign * y)
}

// ── Black-Scholes ─────────────────────────────────────────────

export interface BSInput {
  spot: number
  strike: number
  timeToExpiry: number // in years
  rate: number // decimal
  sigma: number // decimal
  optionType: OptionType
}

export function daysToYears(dteDays: number): number {
  return Math.max(1, dteDays) / 365
}

function d1d2(input: BSInput): { d1: number; d2: number } {
  const { spot, strike, timeToExpiry: t, rate, sigma } = input
  const sqrtT = Math.sqrt(t)
  const d1 = (Math.log(spot / strike) + (rate + 0.5 * sigma * sigma) * t) / (sigma * sqrtT)
  return { d1, d2: d1 - sigma * sqrtT }
}

export function blackScholesPrice(input: BSInput): number {
  const { spot, strike, timeToExpiry: t, rate, optionType } = input
  const { d1, d2 } = d1d2(input)
  const disc = strike * Math.exp(-rate * t)
  return optionType === "CE"
    ? spot * normCdf(d1) - disc * normCdf(d2)
    : disc * normCdf(-d2) - spot * normCdf(-d1)
}

export function blackScholesGreeks(input: BSInput): Greeks {
  const { spot, strike, timeToExpiry: t, rate, sigma, optionType } = input
  const { d1, d2 } = d1d2(input)
  const sqrtT = Math.sqrt(t)
  const disc = strike * Math.exp(-rate * t)
  const pdfD1 = normPdf(d1)

  const delta = optionType === "CE" ? normCdf(d1) : normCdf(d1) - 1
  const gamma = pdfD1 / (spot * sigma * sqrtT)
  const vega = spot * pdfD1 * sqrtT
  const thetaAnnual =
    optionType === "CE"
      ? -(spot * pdfD1 * sigma) / (2 * sqrtT) - rate * disc * normCdf(d2)
      : -(spot * pdfD1 * sigma) / (2 * sqrtT) + rate * disc * normCdf(-d2)
  const rho = optionType === "CE" ? disc * t * normCdf(d2) : -disc * t * normCdf(-d2)

  return {
    delta,
    gamma,
    theta: thetaAnnual / 365,
    vega: vega / 100,
    rho: rho / 100,
    iv: sigma,
    ivPct: sigma * 100,
  }
}

// ── Implied volatility solver ─────────────────────────────────

export interface IVResult {
  sigma: number
  converged: boolean
  iterations: number
  theoreticalPrice: number
}

export interface IVSolverOptions {
  initialGuess?: number
  maxIterations?: number
  tolerance?: number
  maxStep?: number
}

// Damped Newton-Raphson on vega, sigma clamped to [0.001, 5.0].
// `converged` is false whenever the price residual never fell inside
// `tolerance` — including vega collapse and iteration exhaustion.
export function impliedVolatility(
  input: Omit<BSInput, "sigma">,
  marketPrice: number,
  options: IVSolverOptions = {}
): IVResult {
  const {
    initialGuess = 0.3,
    maxIterations = 100,
    tolerance = 0.01,
    maxStep = 0.05,
  } = options

  let sigma = Math.min(MAX_SIGMA, Math.max(MIN_SIGMA, initialGuess))
  let theo = Number.NaN
  let iterations = 0

  const invalid =
    !(input.spot > 0) ||
    !(input.strike > 0) ||
    !(input.timeToExpiry > 0) ||
    !(marketPrice > 0) ||
    !Number.isFinite(marketPrice)

  if (invalid) {
    return { sigma, converged: false, iterations: 0, theoreticalPrice: Number.NaN }
  }

  for (let i = 0; i < maxIterations; i++) {
    iterations = i + 1
    const bs: BSInput = { ...input, sigma }
    theo = blackScholesPrice(bs)
    if (!Number.isFinite(theo)) {
      return { sigma, converged: false, iterations, theoreticalPrice: theo }
    }

    const diff = theo - marketPrice
    if (Math.abs(diff) < tolerance) {
      return { sigma, converged: true, iterations, theoreticalPrice: theo }
    }

    const { d1 } = d1d2(bs)
    const vega = input.spot * normPdf(d1) * Math.sqrt(input.timeToExpiry)
    if (!Number.isFinite(vega) || Math.abs(vega) < 1e-10) {
      return { sigma, converged: false, iterations, theoreticalPrice: theo }
    }

    const step = Math.max(-maxStep, Math.min(maxStep, diff / vega))
    const next = Math.min(MAX_SIGMA, Math.max(MIN_SIGMA, sigma - step))
    if (next === sigma) {
      // Pinned at a bound — no further progress is possible.
      return { sigma, converged: false, iterations, theoreticalPrice: theo }
    }
    sigma = next
  }

  return { sigma, converged: false, iterations, theoreticalPrice: theo }
}

// ── Combined greeks ───────────────────────────────────────────

export interface ComputeGreeksInput {
  spot: number
  strike: number
  dteDays: number
  optionType: OptionType
  // Supply `iv` (decimal) to skip the solver, or `marketPrice` to solve for it.
  iv?: number
  marketPrice?: number
  rate?: number
}

export function computeGreeks(input: ComputeGreeksInput): GreeksResult {
  const rate = input.rate ?? RISK_FREE_RATE
  const timeToExpiry = daysToYears(input.dteDays)
  const base = {
    spot: input.spot,
    strike: input.strike,
    timeToExpiry,
    rate,
    optionType: input.optionType,
  }

  if (typeof input.iv === "number" && Number.isFinite(input.iv) && input.iv > 0) {
    const sigma = Math.min(MAX_SIGMA, Math.max(MIN_SIGMA, input.iv))
    const bs: BSInput = { ...base, sigma }
    return {
      ...blackScholesGreeks(bs),
      converged: true,
      theoreticalPrice: blackScholesPrice(bs),
      iterations: 0,
    }
  }

  const solved = impliedVolatility(base, input.marketPrice ?? 0)
  const bs: BSInput = { ...base, sigma: solved.sigma }
  const greeks = solved.converged
    ? blackScholesGreeks(bs)
    : { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0, iv: solved.sigma, ivPct: solved.sigma * 100 }

  return {
    ...greeks,
    converged: solved.converged,
    theoreticalPrice: solved.theoreticalPrice,
    iterations: solved.iterations,
  }
}

// ── Moneyness / IV rank ───────────────────────────────────────

export type Moneyness = "ITM" | "ATM" | "OTM"

export function classifyMoneyness(
  spot: number,
  strike: number,
  optionType: OptionType,
  atmTolerancePct = 0.25
): Moneyness {
  const diffPct = ((spot - strike) / strike) * 100
  if (Math.abs(diffPct) <= atmTolerancePct) return "ATM"
  if (optionType === "CE") return diffPct > 0 ? "ITM" : "OTM"
  return diffPct < 0 ? "ITM" : "OTM"
}

// IV Rank = (current - low) / (high - low) x 100. Returns 50 for a
// degenerate or empty history, matching the Python behaviour.
export function ivRank(currentIV: number, historicalIVs: number[]): number {
  if (historicalIVs.length === 0) return 50
  const low = Math.min(...historicalIVs)
  const high = Math.max(...historicalIVs)
  if (high === low) return 50
  return ((currentIV - low) / (high - low)) * 100
}
