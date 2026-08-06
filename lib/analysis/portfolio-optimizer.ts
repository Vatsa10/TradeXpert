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
function toReturns(prices: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    out.push((prices[i] - prices[i - 1]) / prices[i - 1]);
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
    const newDistances: number[][] = [];
    const remaining = clusters.filter((_, idx) => idx !== a && idx !== b);
    for (let i = 0; i < remaining.length; i++) {
      newDistances.push(new Array(remaining.length + 1).fill(0));
    }

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
      const alpha = varLeft + varRight === 0 ? 0.5 : 1 - varLeft / (varLeft + varRight);

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
