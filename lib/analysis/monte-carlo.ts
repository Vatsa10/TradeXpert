// Monte Carlo trade simulator, ported from
// intraday-stock-targets/trading_engine.py:506-552 (run_monte_carlo).
// Simulates a sequence of binary win/loss trades under a fixed win rate,
// reward:risk ratio, and per-trade risk % of capital, tracking equity curve
// and max drawdown per simulated path.

export interface MonteCarloParams {
  startingCapital: number;
  winRate: number; // 0-1
  rewardRiskRatio: number; // e.g. 2 means avg win = 2x avg loss
  riskPct: number; // fraction of capital risked per trade, e.g. 0.01
  tradeCount: number;
  numSimulations: number;
  // Fraction of starting capital which, if breached at any point, counts the
  // path as "ruined". Defaults to 0.5 (a 50% drawdown of starting equity).
  ruinThreshold?: number;
}

export interface MonteCarloResult {
  finalCapitalStats: {
    mean: number;
    median: number;
    min: number;
    max: number;
    p5: number;
    p95: number;
  };
  maxDrawdownStats: {
    mean: number;
    worst: number;
  };
  winProbability: number; // fraction of simulations ending above starting capital
  // Fraction of simulations whose equity fell to or below
  // startingCapital * ruinThreshold at any point during the path.
  ruinProbability: number;
  ruinThreshold: number; // echoed back so callers can label the number
  sampleEquityCurves: number[][]; // a handful of paths for charting
}

const MAX_SIMULATIONS = 5000;
const DEFAULT_RUIN_THRESHOLD = 0.5;

function runSinglePath(
  params: MonteCarloParams,
  ruinLevel: number
): { finalCapital: number; maxDrawdown: number; curve: number[]; ruined: boolean } {
  let capital = params.startingCapital;
  let peak = capital;
  let maxDrawdown = 0;
  let ruined = false;
  const curve: number[] = [capital];

  for (let i = 0; i < params.tradeCount; i++) {
    const isWin = Math.random() < params.winRate;
    const riskAmount = capital * params.riskPct;
    capital += isWin ? riskAmount * params.rewardRiskRatio : -riskAmount;
    capital = Math.max(0, capital);

    peak = Math.max(peak, capital);
    const drawdown = peak > 0 ? (peak - capital) / peak : 0;
    maxDrawdown = Math.max(maxDrawdown, drawdown);

    curve.push(capital);

    // Ruin must be checked against a threshold, not against exactly 0:
    // risking a fixed FRACTION of remaining capital can never reach 0, so a
    // `capital <= 0` test made ruinProbability identically zero for every
    // possible input.
    if (capital <= ruinLevel) {
      ruined = true;
      break;
    }
  }

  return { finalCapital: capital, maxDrawdown, curve, ruined };
}

// Nearest-rank percentile on an ascending-sorted array.
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length);
  const idx = Math.min(sorted.length - 1, Math.max(0, rank - 1));
  return sorted[idx];
}

export function runMonteCarlo(params: MonteCarloParams): MonteCarloResult {
  // Guard the loop bound: a 0/NaN/negative numSimulations previously produced
  // an empty result set and NaN everywhere (0/0) plus Math.max() = -Infinity.
  const requested = Number.isFinite(params.numSimulations) ? Math.floor(params.numSimulations) : 0;
  const numSimulations = Math.min(MAX_SIMULATIONS, Math.max(1, requested));

  const ruinThreshold =
    Number.isFinite(params.ruinThreshold as number) &&
    (params.ruinThreshold as number) >= 0 &&
    (params.ruinThreshold as number) < 1
      ? (params.ruinThreshold as number)
      : DEFAULT_RUIN_THRESHOLD;
  const ruinLevel = params.startingCapital * ruinThreshold;

  const finals: number[] = [];
  const drawdowns: number[] = [];
  const sampleEquityCurves: number[][] = [];
  let ruinCount = 0;

  for (let i = 0; i < numSimulations; i++) {
    const { finalCapital, maxDrawdown, curve, ruined } = runSinglePath(params, ruinLevel);
    finals.push(finalCapital);
    drawdowns.push(maxDrawdown);
    if (ruined) ruinCount++;
    if (sampleEquityCurves.length < 10) sampleEquityCurves.push(curve);
  }

  const sortedFinals = [...finals].sort((a, b) => a - b);
  const mean = finals.reduce((a, b) => a + b, 0) / finals.length;
  const median = percentile(sortedFinals, 50);

  const winCount = finals.filter((f) => f > params.startingCapital).length;

  return {
    finalCapitalStats: {
      mean,
      median,
      min: sortedFinals[0],
      max: sortedFinals[sortedFinals.length - 1],
      p5: percentile(sortedFinals, 5),
      p95: percentile(sortedFinals, 95),
    },
    maxDrawdownStats: {
      mean: drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length,
      worst: Math.max(...drawdowns),
    },
    winProbability: winCount / finals.length,
    ruinProbability: ruinCount / finals.length,
    ruinThreshold,
    sampleEquityCurves,
  };
}
