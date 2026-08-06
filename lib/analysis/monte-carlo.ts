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
  ruinProbability: number; // fraction of simulations that hit <= 0 capital
  sampleEquityCurves: number[][]; // a handful of paths for charting
}

const MAX_SIMULATIONS = 5000;

function runSinglePath(params: MonteCarloParams): { finalCapital: number; maxDrawdown: number; curve: number[] } {
  let capital = params.startingCapital;
  let peak = capital;
  let maxDrawdown = 0;
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

    if (capital <= 0) break;
  }

  return { finalCapital: capital, maxDrawdown, curve };
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

export function runMonteCarlo(params: MonteCarloParams): MonteCarloResult {
  const numSimulations = Math.min(params.numSimulations, MAX_SIMULATIONS);

  const finals: number[] = [];
  const drawdowns: number[] = [];
  const sampleEquityCurves: number[][] = [];

  for (let i = 0; i < numSimulations; i++) {
    const { finalCapital, maxDrawdown, curve } = runSinglePath(params);
    finals.push(finalCapital);
    drawdowns.push(maxDrawdown);
    if (sampleEquityCurves.length < 10) sampleEquityCurves.push(curve);
  }

  const sortedFinals = [...finals].sort((a, b) => a - b);
  const mean = finals.reduce((a, b) => a + b, 0) / finals.length;
  const median = percentile(sortedFinals, 50);

  const winCount = finals.filter((f) => f > params.startingCapital).length;
  const ruinCount = finals.filter((f) => f <= 0).length;

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
    sampleEquityCurves,
  };
}
