"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ChevronDown,
  Download,
  Loader2,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import PositionSizeCalculator from "@/components/tools/PositionSizeCalculator";

// ── Types mirroring the API responses ────────────────────────────

interface GrowthRate {
  metricName: string;
  latestPeriod: string;
  latestValue: number;
  previousPeriod: string;
  previousValue: number;
  qoqGrowthPct: number | null;
  yoyPeriod: string | null;
  yoyValue: number | null;
  yoyGrowthPct: number | null;
}

interface FundamentalsResponse {
  symbol: string;
  statements: unknown;
  growth: {
    quarterly: Record<string, GrowthRate>;
    annual: Record<string, GrowthRate>;
  };
  dcfInputs: {
    currentFCF: number | null;
    netDebt: number | null;
    sharesOutstanding: number | null;
    missing: string[];
  };
}

interface DCFYearProjection {
  year: number;
  fcf: number;
  discountFactor: number;
  presentValue: number;
}

interface DCFResponse {
  wacc: {
    costOfEquity: number;
    costOfDebtAfterTax: number;
    wacc: number;
    usedDebtCost: boolean;
  };
  dcf: {
    projections: DCFYearProjection[];
    sumPVExplicit: number;
    terminalValue: number;
    pvTerminalValue: number;
    enterpriseValue: number;
    equityValue: number;
    fairValuePerShare: number;
  };
  sensitivity: {
    growthRate: number;
    wacc: number;
    fairValuePerShare: number | null;
  }[];
}

// ── Formatting helpers ───────────────────────────────────────────

const METRIC_LABELS: Record<string, string> = {
  revenue: "Revenue",
  netIncome: "Net Profit",
  ebitda: "EBITDA",
  operatingIncome: "Operating Income",
};

function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e7) return `${sign}${(abs / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `${sign}${(abs / 1e5).toFixed(2)}L`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)}K`;
  return `${sign}${abs.toFixed(2)}`;
}

function formatMoney(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatPct(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function parseNum(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

// ── Small presentational pieces ──────────────────────────────────

function GrowthBadge({ label, value }: { label: string; value: number | null }) {
  const positive = value !== null && value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        value === null
          ? "border-gray-600 bg-gray-700/40 text-gray-400"
          : positive
            ? "border-green-500/30 bg-green-500/10 text-green-400"
            : "border-red-500/30 bg-red-500/10 text-red-400"
      )}
    >
      {value !== null &&
        (positive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        ))}
      <span className="text-gray-400">{label}</span>
      {formatPct(value)}
    </span>
  );
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
  placeholder,
  type = "number",
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="form-label">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        className="form-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-gray-600 bg-gray-800 p-4 md:p-6",
        className
      )}
    >
      {title ? (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-gray-400">{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

// ── Main ─────────────────────────────────────────────────────────

export default function ValuationClient() {
  const [symbol, setSymbol] = useState("");
  const [loadingFundamentals, setLoadingFundamentals] = useState(false);
  const [fundamentals, setFundamentals] = useState<FundamentalsResponse | null>(null);
  const [fundamentalsError, setFundamentalsError] = useState<string | null>(null);

  // DCF form (strings so the inputs stay controlled and clearable)
  const [currentFCF, setCurrentFCF] = useState("");
  const [sharesOutstanding, setSharesOutstanding] = useState("");
  const [netDebt, setNetDebt] = useState("");
  const [beta, setBeta] = useState("1.0");
  const [debtToEquity, setDebtToEquity] = useState("0");
  const [growth1, setGrowth1] = useState("12");
  const [growth2, setGrowth2] = useState("6");
  const [currentPrice, setCurrentPrice] = useState("");

  const [runningDCF, setRunningDCF] = useState(false);
  const [dcf, setDCF] = useState<DCFResponse | null>(null);
  const [showProjections, setShowProjections] = useState(false);

  const price = parseNum(currentPrice);

  const upside = useMemo(() => {
    if (!dcf || price === null || price <= 0) return null;
    return ((dcf.dcf.fairValuePerShare - price) / price) * 100;
  }, [dcf, price]);

  async function loadFundamentals() {
    const sym = symbol.trim().toUpperCase();
    if (!sym) {
      toast.error("Enter a symbol first");
      return;
    }

    setLoadingFundamentals(true);
    setFundamentalsError(null);

    try {
      const res = await fetch(`/api/analysis/fundamentals?symbol=${encodeURIComponent(sym)}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Alpha Vantage free tier throttles hard; make that recoverable rather
        // than terminal — manual entry below is always available.
        const message =
          res.status === 429
            ? "Rate limit reached on the fundamentals provider. Enter the DCF inputs manually below."
            : (data?.error as string) || `Failed to load fundamentals for ${sym}`;
        setFundamentalsError(message);
        toast.error(message);
        return;
      }

      const payload = data as FundamentalsResponse;
      setFundamentals(payload);

      const inputs = payload.dcfInputs ?? { currentFCF: null, netDebt: null, sharesOutstanding: null, missing: [] };
      if (inputs.currentFCF !== null) setCurrentFCF(String(inputs.currentFCF));
      if (inputs.netDebt !== null) setNetDebt(String(inputs.netDebt));
      if (inputs.sharesOutstanding !== null) setSharesOutstanding(String(inputs.sharesOutstanding));

      const missing = inputs.missing ?? [];
      if (missing.length) {
        setFundamentalsError(
          `Partial data for ${sym}: ${missing.join(", ")} not reported. Fill those in manually.`
        );
        toast.warning(`Loaded ${sym} with gaps — ${missing.join(", ")} needs manual entry`);
      } else {
        toast.success(`Fundamentals loaded for ${sym}`);
      }
    } catch (error) {
      console.error("Fundamentals load error:", error);
      const message = "Could not reach the fundamentals service. Enter inputs manually below.";
      setFundamentalsError(message);
      toast.error(message);
    } finally {
      setLoadingFundamentals(false);
    }
  }

  async function runDCF() {
    const fcf = parseNum(currentFCF);
    const shares = parseNum(sharesOutstanding);

    if (fcf === null) {
      toast.error("Current free cash flow is required");
      return;
    }
    if (shares === null || shares <= 0) {
      toast.error("Shares outstanding must be greater than zero");
      return;
    }

    setRunningDCF(true);
    try {
      const res = await fetch("/api/analysis/dcf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentFCF: fcf,
          sharesOutstanding: shares,
          netDebt: parseNum(netDebt) ?? 0,
          beta: parseNum(beta) ?? 1,
          debtToEquity: parseNum(debtToEquity) ?? 0,
          growthRateStage1: parseNum(growth1) ?? 12,
          growthRateStage2: parseNum(growth2) ?? 6,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data?.error as string) || "DCF failed");
        return;
      }

      setDCF(data as DCFResponse);
      toast.success("Fair value computed");
    } catch (error) {
      console.error("DCF error:", error);
      toast.error("Failed to compute DCF");
    } finally {
      setRunningDCF(false);
    }
  }

  // Sensitivity grid axes, derived from the flat cell list the API returns.
  const sensitivity = useMemo(() => {
    if (!dcf?.sensitivity?.length) return null;
    const growthRates = Array.from(new Set(dcf.sensitivity.map((c) => c.growthRate))).sort((a, b) => a - b);
    const waccs = Array.from(new Set(dcf.sensitivity.map((c) => c.wacc))).sort((a, b) => a - b);
    const lookup = new Map(dcf.sensitivity.map((c) => [`${c.growthRate}|${c.wacc}`, c.fairValuePerShare]));
    return { growthRates, waccs, lookup };
  }, [dcf]);

  const growthRows = useMemo(() => {
    if (!fundamentals?.growth) return [];
    const keys = Array.from(
      new Set([
        ...Object.keys(fundamentals.growth.quarterly ?? {}),
        ...Object.keys(fundamentals.growth.annual ?? {}),
      ])
    );
    return keys.map((key) => ({
      key,
      label: METRIC_LABELS[key] ?? key,
      quarterly: fundamentals.growth.quarterly?.[key] ?? null,
      annual: fundamentals.growth.annual?.[key] ?? null,
    }));
  }, [fundamentals]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-100 md:text-3xl">Valuation</h1>
        <p className="max-w-3xl text-sm text-gray-400">
          Pull reported fundamentals, run a two-stage discounted cash flow, and stress the
          result across growth and discount-rate assumptions. Research output only — not
          investment advice.
        </p>
      </header>

      {/* Symbol loader */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="valuation-symbol" className="form-label">
              Symbol
            </Label>
            <Input
              id="valuation-symbol"
              className="form-input"
              placeholder="e.g. INFY, RELIANCE.BSE, AAPL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadFundamentals();
              }}
            />
          </div>

          <Button
            onClick={loadFundamentals}
            disabled={loadingFundamentals}
            className="yellow-btn w-full sm:w-auto sm:px-6"
          >
            {loadingFundamentals ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Load fundamentals
              </>
            )}
          </Button>
        </div>

        {fundamentalsError ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-yellow-600/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{fundamentalsError}</p>
          </div>
        ) : null}
      </Card>

      {/* Growth summary */}
      {growthRows.length > 0 ? (
        <Card
          title={`Growth summary${fundamentals?.symbol ? ` — ${fundamentals.symbol}` : ""}`}
          subtitle="Quarterly figures compare the latest quarter (QoQ vs prior quarter, YoY vs same quarter last year). Annual compares full years."
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {growthRows.map((row) => (
              <div key={row.key} className="rounded-lg border border-gray-600 bg-gray-700/30 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium text-gray-100">{row.label}</p>
                  <p className="text-sm text-gray-400">
                    {formatCompact(row.quarterly?.latestValue ?? row.annual?.latestValue ?? null)}
                  </p>
                </div>

                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-16 text-xs uppercase tracking-wide text-gray-500">Quarter</span>
                    <GrowthBadge label="QoQ" value={row.quarterly?.qoqGrowthPct ?? null} />
                    <GrowthBadge label="YoY" value={row.quarterly?.yoyGrowthPct ?? null} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-16 text-xs uppercase tracking-wide text-gray-500">Annual</span>
                    <GrowthBadge label="YoY" value={row.annual?.qoqGrowthPct ?? null} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* DCF inputs */}
      <Card
        title="DCF assumptions"
        subtitle="Auto-filled from reported statements where available. Every field is editable — India defaults are used for the macro constants (risk-free 7.0%, ERP 6.5%, terminal growth 4.0%, tax 25.17%)."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            id="dcf-fcf"
            label="Current free cash flow"
            hint="Latest annual FCF, absolute currency units"
            value={currentFCF}
            onChange={setCurrentFCF}
            placeholder="e.g. 25000000000"
          />
          <Field
            id="dcf-shares"
            label="Shares outstanding"
            hint="Must be greater than zero"
            value={sharesOutstanding}
            onChange={setSharesOutstanding}
            placeholder="e.g. 4150000000"
          />
          <Field
            id="dcf-netdebt"
            label="Net debt"
            hint="Total debt minus cash. Negative means net cash."
            value={netDebt}
            onChange={setNetDebt}
            placeholder="e.g. -120000000"
          />
          <Field
            id="dcf-beta"
            label="Beta"
            hint="Clamped to 0.2–3.0 server-side. 1.0 is market-neutral."
            value={beta}
            onChange={setBeta}
            placeholder="1.0"
          />
          <Field
            id="dcf-de"
            label="Debt / equity"
            hint="0 uses cost of equity only as the discount rate"
            value={debtToEquity}
            onChange={setDebtToEquity}
            placeholder="0"
          />
          <Field
            id="dcf-price"
            label="Current price (optional)"
            hint="Enables upside/downside and colours the sensitivity grid"
            value={currentPrice}
            onChange={setCurrentPrice}
            placeholder="e.g. 1520"
          />
          <Field
            id="dcf-g1"
            label="Growth years 1–5 (%)"
            hint="India large-cap default ~12%"
            value={growth1}
            onChange={setGrowth1}
            placeholder="12"
          />
          <Field
            id="dcf-g2"
            label="Growth years 6–10 (%)"
            hint="India default ~6%, fading toward terminal"
            value={growth2}
            onChange={setGrowth2}
            placeholder="6"
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button onClick={runDCF} disabled={runningDCF} className="yellow-btn w-full sm:w-auto sm:px-6">
            {runningDCF ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Run DCF
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500">
            Terminal growth must stay below the computed WACC or the model is undefined.
          </p>
        </div>
      </Card>

      {/* Results */}
      {dcf ? (
        <>
          <Card>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500">Fair value per share</p>
                <p className="mt-1 text-4xl font-bold text-yellow-500 md:text-5xl">
                  {formatMoney(dcf.dcf.fairValuePerShare)}
                </p>

                {price !== null && price > 0 && upside !== null ? (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="text-sm text-gray-400">
                      vs market {formatMoney(price)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold",
                        upside >= 0
                          ? "border-green-500/30 bg-green-500/10 text-green-400"
                          : "border-red-500/30 bg-red-500/10 text-red-400"
                      )}
                    >
                      {upside >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {formatPct(upside, 1)} {upside >= 0 ? "upside" : "downside"}
                    </span>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">
                    Add a current price above to see upside/downside.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
                {[
                  { label: "PV explicit (10y)", value: formatCompact(dcf.dcf.sumPVExplicit) },
                  { label: "PV terminal", value: formatCompact(dcf.dcf.pvTerminalValue) },
                  { label: "Enterprise value", value: formatCompact(dcf.dcf.enterpriseValue) },
                  { label: "Equity value", value: formatCompact(dcf.dcf.equityValue) },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</p>
                    <p className="mt-1 text-lg font-semibold text-gray-100">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* WACC breakdown */}
            <Card title="WACC breakdown" subtitle="Discount rate applied to every projected cash flow.">
              <dl className="divide-y divide-gray-600">
                {[
                  { label: "Cost of equity (CAPM)", value: `${dcf.wacc.costOfEquity.toFixed(2)}%` },
                  {
                    label: "After-tax cost of debt",
                    value: dcf.wacc.usedDebtCost ? `${dcf.wacc.costOfDebtAfterTax.toFixed(2)}%` : "n/a",
                  },
                  {
                    label: "Capital structure",
                    value: dcf.wacc.usedDebtCost
                      ? `D/E ${parseNum(debtToEquity)?.toFixed(2) ?? "0.00"}`
                      : "Equity only (no debt)",
                  },
                  { label: "WACC", value: `${dcf.wacc.wacc.toFixed(2)}%` },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-3">
                    <dt className="text-sm text-gray-400">{row.label}</dt>
                    <dd className="text-sm font-semibold text-gray-100">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            {/* Sensitivity */}
            <Card
              title="Sensitivity"
              subtitle={
                price !== null && price > 0
                  ? "Fair value per share across growth (rows) and WACC (columns). Green = above the current price."
                  : "Fair value per share across growth (rows) and WACC (columns). Add a current price to colour the grid."
              }
            >
              {sensitivity ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[380px] border-collapse text-sm">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="p-2 text-left font-medium">Growth \ WACC</th>
                        {sensitivity.waccs.map((w) => (
                          <th key={w} className="p-2 text-right font-medium">
                            {w.toFixed(1)}%
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sensitivity.growthRates.map((g) => (
                        <tr key={g} className="border-t border-gray-600">
                          <td className="p-2 font-medium text-gray-300">{g.toFixed(1)}%</td>
                          {sensitivity.waccs.map((w) => {
                            const fv = sensitivity.lookup.get(`${g}|${w}`) ?? null;
                            const colored = price !== null && price > 0 && fv !== null;
                            return (
                              <td
                                key={w}
                                className={cn(
                                  "p-2 text-right font-medium tabular-nums",
                                  !colored && "text-gray-100",
                                  colored && fv >= price
                                    ? "bg-green-500/10 text-green-400"
                                    : colored
                                      ? "bg-red-500/10 text-red-400"
                                      : ""
                                )}
                              >
                                {fv === null ? "n/a" : formatMoney(fv, 0)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No sensitivity grid returned.</p>
              )}
            </Card>
          </div>

          {/* Projections */}
          <Card>
            <button
              type="button"
              onClick={() => setShowProjections((v) => !v)}
              className="flex w-full cursor-pointer items-center justify-between text-left"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-100">10-year projection</h3>
                <p className="mt-1 text-sm text-gray-400">
                  Projected free cash flow, discount factor and present value per year.
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-gray-400 transition-transform",
                  showProjections && "rotate-180"
                )}
              />
            </button>

            {showProjections ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-700 text-gray-400">
                      <th className="p-2 text-left font-medium">Year</th>
                      <th className="p-2 text-right font-medium">Projected FCF</th>
                      <th className="p-2 text-right font-medium">Discount factor</th>
                      <th className="p-2 text-right font-medium">Present value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dcf.dcf.projections.map((p) => (
                      <tr key={p.year} className="border-b border-gray-600 text-gray-100">
                        <td className="p-2">{p.year}</td>
                        <td className="p-2 text-right tabular-nums">{formatCompact(p.fcf)}</td>
                        <td className="p-2 text-right tabular-nums">{p.discountFactor.toFixed(4)}</td>
                        <td className="p-2 text-right tabular-nums">{formatCompact(p.presentValue)}</td>
                      </tr>
                    ))}
                    <tr className="text-gray-300">
                      <td className="p-2 font-semibold">Terminal</td>
                      <td className="p-2 text-right tabular-nums">{formatCompact(dcf.dcf.terminalValue)}</td>
                      <td className="p-2 text-right text-gray-500">—</td>
                      <td className="p-2 text-right tabular-nums">{formatCompact(dcf.dcf.pvTerminalValue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}
          </Card>
        </>
      ) : null}

      <PositionSizeCalculator
        symbol={symbol.trim().toUpperCase()}
        currentPrice={currentPrice}
      />
    </div>
  );
}
