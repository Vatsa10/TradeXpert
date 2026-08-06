import { cn } from "@/lib/utils";

export const formatPct = (value: number, digits = 2) =>
  Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : "—";

export const formatNum = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : "—";

export const formatMoney = (value: number) =>
  Number.isFinite(value)
    ? value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: value >= 1000 ? 0 : 2,
      })
    : "—";

export const formatCompactMoney = (value: number) =>
  Number.isFinite(value)
    ? `$${value.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}`
    : "—";

/** Section wrapper matching the app's dark card conventions. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-zinc-800 bg-[#111111] p-4 sm:p-6",
        className
      )}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Single metric tile. `tone` colours the value for good/bad readings. */
export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-[#1A1A1A] p-3 sm:p-4">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-xl font-semibold tabular-nums sm:text-2xl",
          tone === "positive" && "text-emerald-400",
          tone === "negative" && "text-red-400",
          tone === "neutral" && "text-gray-100"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-3 text-sm text-red-300">
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="ml-3 cursor-pointer font-medium text-red-200 underline underline-offset-2 hover:text-red-100"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-gray-500">
      {children}
    </div>
  );
}

/** Skeleton block used while a request is in flight. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-zinc-800/70", className)} />;
}
