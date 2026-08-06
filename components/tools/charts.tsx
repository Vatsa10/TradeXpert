"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export const CHART_COLORS = [
  "#eab308",
  "#38bdf8",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#fb923c",
  "#22d3ee",
  "#f87171",
  "#a3e635",
  "#c084fc",
];

export interface ChartSeries {
  name: string;
  values: number[];
  color: string;
  /** Thin, low-opacity lines for context series (e.g. individual assets). */
  muted?: boolean;
}

const PAD_L = 56;
const PAD_R = 14;
const PAD_T = 14;
const PAD_B = 26;

function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [min];
  const raw = (max - min) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(v);
  return out.length ? out : [min, max];
}

/**
 * Tracks the rendered width of an element so the SVG viewBox can match its CSS
 * pixel size 1:1. Drawing in real pixels (rather than stretching a fixed
 * viewBox with preserveAspectRatio="none") keeps text and point markers
 * undistorted at every breakpoint.
 */
function useElementWidth<T extends Element>(fallback = 800) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? 0;
      if (next > 0) setWidth(next);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

/**
 * Multi-series line chart, rendered as inline SVG (no chart library in the
 * dependency tree).
 */
export function LineChart({
  series,
  labels,
  height = 280,
  yFormat = (v: number) => v.toFixed(2),
  xFormat = (v: string) => v,
  showLegend = true,
  className,
}: {
  series: ChartSeries[];
  labels?: string[];
  height?: number;
  yFormat?: (value: number) => string;
  xFormat?: (label: string) => string;
  showLegend?: boolean;
  className?: string;
}) {
  const { ref: wrapRef, width } = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const drawable = series.filter((s) => s.values.length > 0);
  const length = drawable.reduce((max, s) => Math.max(max, s.values.length), 0);

  const { min, max } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (const s of drawable) {
      for (const v of s.values) {
        if (!Number.isFinite(v)) continue;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return { min: 0, max: 1 };
    if (lo === hi) return { min: lo - 1, max: hi + 1 };
    const pad = (hi - lo) * 0.08;
    return { min: lo - pad, max: hi + pad };
  }, [drawable]);

  if (length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-zinc-800 text-sm text-gray-500"
        style={{ height }}
      >
        No data to plot
      </div>
    );
  }

  const plotW = Math.max(1, width - PAD_L - PAD_R);
  const plotH = Math.max(1, height - PAD_T - PAD_B);
  const xAt = (i: number) => (length === 1 ? PAD_L + plotW / 2 : PAD_L + (i * plotW) / (length - 1));
  const yAt = (v: number) => PAD_T + plotH - ((v - min) / (max - min)) * plotH;

  const ticks = niceTicks(min, max);

  // Fewer x labels on narrow screens so they never collide.
  const xTickCount = Math.max(2, Math.min(5, Math.floor(width / 130)));
  const xTickIndexes =
    length === 1
      ? [0]
      : Array.from({ length: xTickCount }, (_, i) =>
          Math.round((i * (length - 1)) / (xTickCount - 1))
        );

  const pathFor = (values: number[]) =>
    values
      .map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(2)} ${yAt(v).toFixed(2)}`)
      .join(" ");

  const handleMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = (event.clientX - rect.left - PAD_L) / plotW;
    const index = Math.round(ratio * (length - 1));
    setHover(Math.min(length - 1, Math.max(0, index)));
  };

  const hoverX = hover === null ? 0 : xAt(hover);
  const flip = hoverX > width * 0.6;

  return (
    <div className={cn("w-full", className)}>
      <div ref={wrapRef} className="relative w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="max-w-full touch-none"
          role="img"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD_L}
                x2={width - PAD_R}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke="#27272A"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={PAD_L - 8}
                y={yAt(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#71717a"
                style={{ fontSize: 11 }}
              >
                {yFormat(tick)}
              </text>
            </g>
          ))}

          {labels &&
            xTickIndexes.map((i) => (
              <text
                key={i}
                x={xAt(i)}
                y={height - 8}
                textAnchor={i === 0 ? "start" : i === length - 1 ? "end" : "middle"}
                fill="#71717a"
                style={{ fontSize: 11 }}
              >
                {xFormat(labels[i] ?? "")}
              </text>
            ))}

          {drawable.map((s) => (
            <path
              key={s.name}
              d={pathFor(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.muted ? 1 : 2}
              strokeOpacity={s.muted ? 0.45 : 1}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {hover !== null && (
            <>
              <line
                x1={hoverX}
                x2={hoverX}
                y1={PAD_T}
                y2={PAD_T + plotH}
                stroke="#52525b"
                strokeWidth={1}
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
              />
              {drawable
                .filter((s) => !s.muted && Number.isFinite(s.values[hover]))
                .map((s) => (
                  <circle
                    key={s.name}
                    cx={hoverX}
                    cy={yAt(s.values[hover])}
                    r={3.5}
                    fill={s.color}
                    stroke="#0A0A0A"
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
            </>
          )}
        </svg>

        {hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[130px] rounded-md border border-zinc-700 bg-[#18181B] px-3 py-2 text-xs shadow-xl"
            style={{
              left: hoverX,
              transform: flip ? "translateX(calc(-100% - 10px))" : "translateX(10px)",
            }}
          >
            {labels?.[hover] && (
              <p className="mb-1 font-medium text-gray-300">{xFormat(labels[hover])}</p>
            )}
            {drawable
              .filter((s) => !s.muted)
              .map((s) => (
                <div key={s.name} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </span>
                  <span className="font-medium text-gray-100">
                    {Number.isFinite(s.values[hover]) ? yFormat(s.values[hover]) : "—"}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {showLegend && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {drawable.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color, opacity: s.muted ? 0.5 : 1 }}
              />
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Donut chart for portfolio weights. */
export function DonutChart({
  slices,
  size = 200,
  className,
}: {
  slices: { label: string; value: number; color: string }[];
  size?: number;
  className?: string;
}) {
  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  if (total <= 0) return null;

  const radius = 50;
  const inner = 30;
  let angle = -Math.PI / 2;

  const arcs = slices.map((slice) => {
    const sweep = (Math.max(0, slice.value) / total) * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    angle = end;

    // A full-circle arc degenerates (start point === end point), so draw it as
    // two half-circles instead.
    const large = sweep > Math.PI ? 1 : 0;
    const p = (a: number, r: number) => `${(60 + r * Math.cos(a)).toFixed(3)} ${(60 + r * Math.sin(a)).toFixed(3)}`;

    const d =
      sweep >= Math.PI * 2 - 1e-6
        ? `M ${p(start, radius)} A ${radius} ${radius} 0 1 1 ${p(start + Math.PI, radius)} A ${radius} ${radius} 0 1 1 ${p(start, radius)} M ${p(start, inner)} A ${inner} ${inner} 0 1 0 ${p(start + Math.PI, inner)} A ${inner} ${inner} 0 1 0 ${p(start, inner)} Z`
        : `M ${p(start, inner)} L ${p(start, radius)} A ${radius} ${radius} 0 ${large} 1 ${p(end, radius)} L ${p(end, inner)} A ${inner} ${inner} 0 ${large} 0 ${p(start, inner)} Z`;

    return { d, color: slice.color, label: slice.label };
  });

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Portfolio weight allocation"
    >
      {arcs.map((arc) => (
        <path key={arc.label} d={arc.d} fill={arc.color} stroke="#0A0A0A" strokeWidth={0.75}>
          <title>{arc.label}</title>
        </path>
      ))}
    </svg>
  );
}
