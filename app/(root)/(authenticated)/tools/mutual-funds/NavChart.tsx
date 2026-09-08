"use client";

import { useMemo, useState } from "react";

import { formatMoney } from "@/components/system";

export interface NavPoint {
  date: string; // DD-MM-YYYY
  nav: number;
}

const WIDTH = 900;
const HEIGHT = 260;
const PAD_X = 48;
const PAD_Y = 20;

function formatNav(nav: number) {
  return formatMoney(nav, "INR", 2);
}

/**
 * Lightweight inline-SVG line chart. The repo has no charting library, so this
 * draws the series directly rather than pulling one in for a single view.
 * The viewBox does the responsive work — the SVG scales to its container.
 */
export default function NavChart({ points }: { points: NavPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { path, areaPath, min, max, xFor, yFor } = useMemo(() => {
    const navs = points.map((p) => p.nav);
    const rawMin = Math.min(...navs);
    const rawMax = Math.max(...navs);

    // A flat series would make the range zero and every point land on one row;
    // pad it so the line still renders mid-chart.
    const span = rawMax - rawMin || Math.max(rawMax * 0.01, 0.01);
    const min = rawMin - span * 0.08;
    const max = rawMax + span * 0.08;

    const xFor = (i: number) =>
      points.length === 1
        ? PAD_X + (WIDTH - PAD_X * 2) / 2
        : PAD_X + (i / (points.length - 1)) * (WIDTH - PAD_X * 2);

    const yFor = (nav: number) =>
      HEIGHT - PAD_Y - ((nav - min) / (max - min)) * (HEIGHT - PAD_Y * 2);

    const path = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i).toFixed(2)},${yFor(p.nav).toFixed(2)}`)
      .join(" ");

    const areaPath = `${path} L${xFor(points.length - 1).toFixed(2)},${HEIGHT - PAD_Y} L${xFor(0).toFixed(2)},${HEIGHT - PAD_Y} Z`;

    return { path, areaPath, min: rawMin, max: rawMax, xFor, yFor };
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="px-6 py-16 text-center text-sm text-ink-secondary">
        No NAV history available for this scheme.
      </div>
    );
  }

  const hovered = hoverIndex === null ? null : points[hoverIndex];

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;

    const svgX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = (svgX - PAD_X) / (WIDTH - PAD_X * 2);
    const index = Math.round(ratio * (points.length - 1));

    setHoverIndex(Math.min(points.length - 1, Math.max(0, index)));
  };

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-[220px] w-full sm:h-[260px]"
        preserveAspectRatio="none"
        role="img"
        aria-label="NAV history chart"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--app-brand)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--app-brand)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((t) => {
          const y = PAD_Y + t * (HEIGHT - PAD_Y * 2);
          return (
            <line
              key={t}
              x1={PAD_X}
              x2={WIDTH - PAD_X}
              y1={y}
              y2={y}
              stroke="var(--app-hairline)"
              strokeWidth={1}
            />
          );
        })}

        <path d={areaPath} fill="url(#navFill)" />
        <path
          d={path}
          fill="none"
          stroke="var(--app-brand)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {hovered && hoverIndex !== null && (
          <>
            <line
              x1={xFor(hoverIndex)}
              x2={xFor(hoverIndex)}
              y1={PAD_Y}
              y2={HEIGHT - PAD_Y}
              stroke="var(--app-hairline-strong)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
            <circle cx={xFor(hoverIndex)} cy={yFor(hovered.nav)} r={4} fill="var(--app-brand)" />
          </>
        )}
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-3 text-xs text-ink-faint">
        <span>{points[0].date}</span>

        <span className="text-ink">
          {hovered ? (
            <>
              {hovered.date} · <span className="text-brand">{formatNav(hovered.nav)}</span>
            </>
          ) : (
            <>
              Low {formatNav(min)} · High {formatNav(max)}
            </>
          )}
        </span>

        <span>{points[points.length - 1].date}</span>
      </div>
    </div>
  );
}
