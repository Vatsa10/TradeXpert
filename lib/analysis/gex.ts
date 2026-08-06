// Gamma Exposure (GEX) analysis, ported from india-trade-cli/analysis/gex.py.
// Pure math, no I/O — the broker options-chain fetch in `get_gex_analysis` is
// intentionally NOT ported; callers pass a strike table in.
//
// Convention (unchanged from the source): dealers are assumed net short
// options, so calls contribute positive GEX and puts negative GEX.
//   GEX = OI x gamma x spot x lotSize x 100
//
// Positive net GEX -> dealers sell rallies and buy dips -> PINNING.
// Negative net GEX -> dealers amplify moves -> BREAKOUT.
//
// Divergence from the Python original: there, per-strike greeks that failed
// to compute were swallowed by a bare `except: continue`, silently zeroing
// that strike's contribution. Here a strike whose IV solve did not converge
// is reported in `skippedStrikes` so the caller can judge coverage.

import { computeGreeks, type OptionType } from "@/lib/analysis/options"

export const DEFAULT_LOT_SIZE = 25

export type GEXRegime = "POSITIVE" | "NEGATIVE" | "NEUTRAL"

export interface StrikeInput {
  strike: number
  callOI: number
  putOI: number
  iv?: number // decimal, e.g. 0.18
  callPrice?: number
  putPrice?: number
  dte: number // days to expiry
}

export interface StrikeGEX {
  strike: number
  callGamma: number
  putGamma: number
  callGEX: number
  putGEX: number
  netGEX: number
}

export interface GEXAnalysis {
  spot: number
  lotSize: number
  strikes: StrikeGEX[]
  totalNetGEX: number
  flipPoint: number | null
  regime: GEXRegime
  maxGEXStrike: number | null
  skippedStrikes: number[]
  interpretation: string
}

export function computeGEXAtStrike(
  oi: number,
  gamma: number,
  spot: number,
  lotSize: number,
  isCall: boolean
): number {
  const gex = oi * gamma * spot * lotSize * 100
  return isCall ? gex : -gex
}

// Locate the strike where net GEX crosses from positive to negative,
// linearly interpolated between the bracketing strikes.
export function findGEXFlip(gexByStrike: Array<[number, number]>): number | null {
  for (let i = 1; i < gexByStrike.length; i++) {
    const [prevStrike, prevGEX] = gexByStrike[i - 1]
    const [currStrike, currGEX] = gexByStrike[i]
    if (prevGEX > 0 && currGEX <= 0) {
      if (prevGEX === currGEX) return currStrike
      const ratio = prevGEX / (prevGEX - currGEX)
      return prevStrike + ratio * (currStrike - prevStrike)
    }
  }
  return null
}

export function classifyGEXRegime(totalGEX: number, threshold = 50): GEXRegime {
  if (totalGEX > threshold) return "POSITIVE"
  if (totalGEX < -threshold) return "NEGATIVE"
  return "NEUTRAL"
}

export function interpretGEX(regime: GEXRegime, flip: number | null): string {
  if (regime === "POSITIVE") {
    return flip
      ? `Dealers sell rallies and buy dips — expect RANGE-BOUND / PINNING. Breakout risk above ${Math.round(flip)}.`
      : "Dealers sell rallies and buy dips — expect RANGE-BOUND / PINNING."
  }
  if (regime === "NEGATIVE") {
    return flip
      ? `Dealers amplify moves — expect TRENDING / BREAKOUT. Stabilizes below ${Math.round(flip)}.`
      : "Dealers amplify moves — expect TRENDING / BREAKOUT."
  }
  return "Gamma exposure is balanced — no strong directional bias from dealers."
}

function gammaFor(
  spot: number,
  row: StrikeInput,
  optionType: OptionType
): { gamma: number; ok: boolean } {
  const marketPrice = optionType === "CE" ? row.callPrice : row.putPrice
  const result = computeGreeks({
    spot,
    strike: row.strike,
    dteDays: row.dte,
    optionType,
    iv: row.iv,
    marketPrice,
  })
  return { gamma: result.converged ? result.gamma : 0, ok: result.converged }
}

export interface GEXOptions {
  lotSize?: number
  regimeThreshold?: number
}

export function analyzeGEX(
  spot: number,
  rows: StrikeInput[],
  options: GEXOptions = {}
): GEXAnalysis {
  const lotSize = options.lotSize ?? DEFAULT_LOT_SIZE
  const skippedStrikes: number[] = []

  const strikes: StrikeGEX[] = rows
    .slice()
    .sort((a, b) => a.strike - b.strike)
    .map((row) => {
      const call = gammaFor(spot, row, "CE")
      const put = gammaFor(spot, row, "PE")
      if (!call.ok || !put.ok) skippedStrikes.push(row.strike)

      const callGEX = computeGEXAtStrike(row.callOI, call.gamma, spot, lotSize, true)
      const putGEX = computeGEXAtStrike(row.putOI, put.gamma, spot, lotSize, false)

      return {
        strike: row.strike,
        callGamma: call.gamma,
        putGamma: put.gamma,
        callGEX,
        putGEX,
        netGEX: callGEX + putGEX,
      }
    })

  const totalNetGEX = strikes.reduce((sum, s) => sum + s.netGEX, 0)
  const flipPoint = findGEXFlip(strikes.map((s) => [s.strike, s.netGEX] as [number, number]))
  const regime = classifyGEXRegime(totalNetGEX, options.regimeThreshold)

  let maxGEXStrike: number | null = null
  let maxAbs = -1
  for (const s of strikes) {
    if (Math.abs(s.netGEX) > maxAbs) {
      maxAbs = Math.abs(s.netGEX)
      maxGEXStrike = s.strike
    }
  }

  return {
    spot,
    lotSize,
    strikes,
    totalNetGEX,
    flipPoint,
    regime,
    maxGEXStrike,
    skippedStrikes,
    interpretation: interpretGEX(regime, flipPoint),
  }
}
