// Hierarchical Risk Parity (HRP) portfolio optimizer.
// Ported from cfa-agent-langgraph/backend/app/agent/tools.py:365-416
// (correlation-distance matrix -> single-linkage clustering -> recursive
// bisection weighting), reimplemented in pure TS to avoid a scipy dependency.

export interface HRPResult {
  weights: Record<string, number>;
  correlationMatrix: number[][];
  symbols: string[];
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[], m: number): number {
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// symbols x prices (aligned by index, same length). Returns log/simple returns.
export function toReturns(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    // A zero or non-finite previous close would produce Infinity/NaN and
    // silently poison the whole correlation + covariance matrix.
    if (!Number.isFinite(prev) || prev === 0 || !Number.isFinite(prices[i])) continue;
    out.push((prices[i] - prev) / prev);
  }
  return out;
}

function correlationMatrix(returnSeries: number[][]): number[][] {
  const n = returnSeries.length;
  const means = returnSeries.map(mean);
  const stds = returnSeries.map((r, i) => stdDev(r, means[i]));
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
        continue;
      }
      let cov = 0;
      const len = Math.min(returnSeries[i].length, returnSeries[j].length);
      for (let k = 0; k < len; k++) {
        cov += (returnSeries[i][k] - means[i]) * (returnSeries[j][k] - means[j]);
      }
      cov /= len - 1;
      const denom = stds[i] * stds[j];
      matrix[i][j] = denom === 0 ? 0 : cov / denom;
    }
  }
  return matrix;
}

function covarianceMatrix(returnSeries: number[][]): number[][] {
  const n = returnSeries.length;
  const means = returnSeries.map(mean);
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let cov = 0;
      const len = Math.min(returnSeries[i].length, returnSeries[j].length);
      for (let k = 0; k < len; k++) {
        cov += (returnSeries[i][k] - means[i]) * (returnSeries[j][k] - means[j]);
      }
      matrix[i][j] = cov / (len - 1);
    }
  }
  return matrix;
}

// distance = sqrt(0.5 * (1 - corr)), per cfa-agent-langgraph tools.py:378-380
function distanceMatrix(corr: number[][]): number[][] {
  return corr.map((row) => row.map((c) => Math.sqrt(Math.max(0, 0.5 * (1 - c)))));
}

interface ClusterNode {
  id: number;
  left?: ClusterNode;
  right?: ClusterNode;
  members: number[];
}

// Single-linkage agglomerative clustering over a distance matrix.
function singleLinkageClustering(dist: number[][]): ClusterNode {
  const n = dist.length;
  let clusters: ClusterNode[] = Array.from({ length: n }, (_, i) => ({ id: i, members: [i] }));
  let distances = dist.map((row) => [...row]);
  let nextId = n;

  while (clusters.length > 1) {
    let minDist = Infinity;
    let a = 0;
    let b = 1;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        if (distances[i][j] < minDist) {
          minDist = distances[i][j];
          a = i;
          b = j;
        }
      }
    }

    const merged: ClusterNode = {
      id: nextId++,
      left: clusters[a],
      right: clusters[b],
      members: [...clusters[a].members, ...clusters[b].members],
    };

    // Single linkage: new distance to remaining clusters = min of the two merged.
    const remaining = clusters.filter((_, idx) => idx !== a && idx !== b);
    const remainingIdx = clusters.map((_, idx) => idx).filter((idx) => idx !== a && idx !== b);
    const rows: number[] = [];
    for (const idx of remainingIdx) {
      rows.push(Math.min(distances[a][idx], distances[b][idx]));
    }

    const newSize = remaining.length + 1;
    const newDist: number[][] = Array.from({ length: newSize }, () => new Array(newSize).fill(0));
    for (let i = 0; i < remaining.length; i++) {
      for (let j = 0; j < remaining.length; j++) {
        newDist[i][j] = distances[remainingIdx[i]][remainingIdx[j]];
      }
    }
    for (let i = 0; i < remaining.length; i++) {
      newDist[i][remaining.length] = rows[i];
      newDist[remaining.length][i] = rows[i];
    }

    clusters = [...remaining, merged];
    distances = newDist;
  }

  return clusters[0];
}

// Quasi-diagonalization: flatten the dendrogram leaves left-to-right so
// correlated assets sit adjacent, per HRP (matches scipy leaves_list order).
function quasiDiagOrder(node: ClusterNode): number[] {
  if (!node.left || !node.right) return node.members;
  return [...quasiDiagOrder(node.left), ...quasiDiagOrder(node.right)];
}

function clusterVariance(cov: number[][], members: number[]): number {
  const sub = members.map((i) => members.map((j) => cov[i][j]));
  const diag = members.map((i) => cov[i][i]);
  const invDiag = diag.map((v) => (v === 0 ? 0 : 1 / v));
  const invSum = invDiag.reduce((a, b) => a + b, 0);
  const ivp = invSum === 0 ? invDiag.map(() => 1 / invDiag.length) : invDiag.map((v) => v / invSum);

  let variance = 0;
  for (let i = 0; i < members.length; i++) {
    for (let j = 0; j < members.length; j++) {
      variance += ivp[i] * ivp[j] * sub[i][j];
    }
  }
  return variance;
}

// Recursive bisection: at each split, allocate more weight to the lower-variance side.
function recursiveBisection(cov: number[][], sortedIndices: number[]): number[] {
  const weights = new Array(cov.length).fill(1);
  let clusters: number[][] = [sortedIndices];

  while (clusters.some((c) => c.length > 1)) {
    const next: number[][] = [];
    for (const cluster of clusters) {
      if (cluster.length <= 1) {
        next.push(cluster);
        continue;
      }
      const mid = Math.floor(cluster.length / 2);
      const left = cluster.slice(0, mid);
      const right = cluster.slice(mid);

      const varLeft = clusterVariance(cov, left);
      const varRight = clusterVariance(cov, right);
      const totalVar = varLeft + varRight;
      // Clamp: floating-point error on a near-singular covariance can push a
      // quadratic form slightly negative, which would otherwise yield an
      // alpha outside [0,1] and hence negative (short) portfolio weights.
      const alpha =
        !Number.isFinite(totalVar) || totalVar <= 0
          ? 0.5
          : Math.min(1, Math.max(0, 1 - varLeft / totalVar));

      for (const i of left) weights[i] *= alpha;
      for (const i of right) weights[i] *= 1 - alpha;

      next.push(left, right);
    }
    clusters = next;
  }

  return weights;
}

// symbolPrices: symbol -> chronological array of close prices (equal length, aligned dates).
export function computeHRPWeights(symbolPrices: Record<string, number[]>): HRPResult | null {
  const symbols = Object.keys(symbolPrices);
  if (symbols.length < 2) return null;

  const returnSeries = symbols.map((s) => toReturns(symbolPrices[s]));
  const minLen = Math.min(...returnSeries.map((r) => r.length));
  if (minLen < 5) return null;

  const trimmed = returnSeries.map((r) => r.slice(r.length - minLen));
  const corr = correlationMatrix(trimmed);
  const cov = covarianceMatrix(trimmed);
  const dist = distanceMatrix(corr);

  const tree = singleLinkageClustering(dist);
  const order = quasiDiagOrder(tree);
  const rawWeights = recursiveBisection(cov, order);

  const total = rawWeights.reduce((a, b) => a + b, 0);
  const normalized = total === 0 ? rawWeights.map(() => 1 / rawWeights.length) : rawWeights.map((w) => w / total);

  const weights: Record<string, number> = {};
  symbols.forEach((s, i) => {
    weights[s] = normalized[i];
  });

  return { weights, correlationMatrix: corr, symbols };
}

// --------------------------------------------------------------------------
// Alternative optimizers, ported from
// intraday-stock-targets/trading_engine.py:299-382 (optimize_portfolio).
//
// Note on naming: the source labels its inverse-volatility branch "HRP"/
// "Risk_Parity". Inverse volatility is *not* HRP (no clustering, no recursive
// bisection), so it is exposed here under its real name; genuine HRP lives in
// computeHRPWeights above.
// --------------------------------------------------------------------------

export const TRADING_DAYS_PER_YEAR = 252;

export interface AlignedReturns {
  symbols: string[];
  // returns[i] is the return series for symbols[i]; all arrays share a length.
  returns: number[][];
}

// Converts aligned close prices into equal-length return series.
export function alignReturns(symbolPrices: Record<string, number[]>): AlignedReturns | null {
  const symbols = Object.keys(symbolPrices);
  if (symbols.length < 2) return null;

  const series = symbols.map((s) => toReturns(symbolPrices[s]));
  const minLen = Math.min(...series.map((r) => r.length));
  if (minLen < 5) return null;

  return { symbols, returns: series.map((r) => r.slice(r.length - minLen)) };
}

function toWeightMap(symbols: string[], raw: number[]): Record<string, number> {
  const total = raw.reduce((a, b) => a + b, 0);
  const normalized =
    !Number.isFinite(total) || total <= 0 ? raw.map(() => 1 / raw.length) : raw.map((w) => w / total);
  const weights: Record<string, number> = {};
  symbols.forEach((s, i) => {
    weights[s] = normalized[i];
  });
  return weights;
}

// Inverse-volatility weighting: w_i proportional to 1 / stdev_i.
export function computeInverseVolWeights(symbolPrices: Record<string, number[]>): HRPResult | null {
  const aligned = alignReturns(symbolPrices);
  if (!aligned) return null;

  const { symbols, returns } = aligned;
  // 1e-8 floor mirrors the source and keeps a zero-variance asset finite.
  const invVols = returns.map((r) => 1 / (stdDev(r, mean(r)) + 1e-8));

  return {
    weights: toWeightMap(symbols, invVols),
    correlationMatrix: correlationMatrix(returns),
    symbols,
  };
}

// Gauss-Jordan inversion with partial pivoting. Returns null when the matrix is
// numerically singular; sized for the <=10 asset case this API caps at.
export function invertMatrix(matrix: number[][]): number[][] | null {
  const n = matrix.length;
  const a = matrix.map((row) => [...row]);
  const inv: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivotRow][col])) pivotRow = r;
    }
    const pivot = a[pivotRow][col];
    if (!Number.isFinite(pivot) || Math.abs(pivot) < 1e-12) return null;

    if (pivotRow !== col) {
      [a[col], a[pivotRow]] = [a[pivotRow], a[col]];
      [inv[col], inv[pivotRow]] = [inv[pivotRow], inv[col]];
    }

    for (let j = 0; j < n; j++) {
      a[col][j] /= pivot;
      inv[col][j] /= pivot;
    }

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = a[r][col];
      if (factor === 0) continue;
      for (let j = 0; j < n; j++) {
        a[r][j] -= factor * a[col][j];
        inv[r][j] -= factor * inv[col][j];
      }
    }
  }

  return inv;
}

// Closed-form mean-variance: w proportional to inv(cov) @ mean, clipped
// long-only and renormalised. Stands in for numpy's pinv by falling back to a
// ridge-regularised inverse when the covariance matrix is singular.
export function computeMeanVarianceWeights(
  symbolPrices: Record<string, number[]>
): HRPResult | null {
  const aligned = alignReturns(symbolPrices);
  if (!aligned) return null;

  const { symbols, returns } = aligned;
  const n = symbols.length;
  const annMeans = returns.map((r) => mean(r) * TRADING_DAYS_PER_YEAR);
  const cov = covarianceMatrix(returns).map((row) => row.map((v) => v * TRADING_DAYS_PER_YEAR));

  let inv = invertMatrix(cov);
  if (!inv) {
    // Ridge fallback: nudging the diagonal makes a singular covariance
    // invertible while leaving a well-conditioned one essentially unchanged.
    const scale = cov.reduce((s, row, i) => s + Math.abs(row[i]), 0) / n || 1;
    const ridge = cov.map((row, i) => row.map((v, j) => (i === j ? v + 1e-6 * scale : v)));
    inv = invertMatrix(ridge);
  }
  if (!inv) return null;

  const raw = inv.map((row) => row.reduce((sum, v, j) => sum + v * annMeans[j], 0));
  // Long-only: clip shorts to zero, then renormalise (equal weight if all <= 0).
  const clipped = raw.map((w) => (Number.isFinite(w) ? Math.max(0, w) : 0));

  return {
    weights: toWeightMap(symbols, clipped),
    correlationMatrix: correlationMatrix(returns),
    symbols,
  };
}
