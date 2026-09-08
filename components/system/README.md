# TradeXpert Design System

The single source of truth for the **signed-in dark app surface**. Tokens live in
`app/globals.css`; components live here. The `.lp` cream landing tokens are a
separate, deliberately light surface — do not import app components into it.

```tsx
import { PageShell, Panel, StatCard, StatGrid, Money, Delta, DataTable } from "@/components/system";
```

Everything is exported from the barrel `@/components/system`. Do not deep-import
`@/components/system/Value` etc. — the barrel is the contract.

**Direction:** institutional. Bloomberg-terminal legibility with modern restraint.
Data is the hero, chrome recedes. Every figure is tabular (`tnum`). Generous
vertical rhythm (`space-y-6` between blocks), tight horizontal density
(`gap-3` inside grids, `px-3/px-4` in table cells).

---

## 1. Tokens (`app/globals.css`)

Available both as CSS variables (`var(--app-…)`) and as Tailwind utilities.
**Prefer the Tailwind utilities.** Opacity modifiers work (`bg-up/10`, `border-brand/30`).

### Surfaces — elevation ladder

| Utility | Var | Hex | Use |
|---|---|---|---|
| `bg-surface` | `--app-bg` | `#08090A` | page ground (body) |
| `bg-surface-sunken` | `--app-sunken` | `#0B0C0E` | wells, table headers, inputs |
| `bg-surface-raised` | `--app-raised` | `#101214` | panels / cards |
| `bg-surface-raised-2` | `--app-raised-2` | `#16181B` | tiles nested inside a panel |
| `bg-surface-overlay` | `--app-overlay` | `#1B1E22` | dialogs, popovers, tooltips |
| `border-hairline` | `--app-hairline` | `#202429` | default 1px separation |
| `border-hairline-strong` | `--app-hairline-strong` | `#2B3037` | emphasised rules, input borders |

### Text hierarchy

| Utility | Var | Use |
|---|---|---|
| `text-ink` | `--app-text` `#E9EBEE` | figures, headings, primary body |
| `text-ink-secondary` | `--app-text-secondary` `#99A0A8` | labels, descriptions |
| `text-ink-faint` | `--app-text-faint` `#6B727A` | meta, units, missing values, disabled |

### Semantic + market direction

| Utility | Var | Hex |
|---|---|---|
| `text-positive` / `bg-positive` | `--app-positive` | `#34C77B` |
| `text-negative` | `--app-negative` | `#F0485F` |
| `text-warning` | `--app-warning` | `#E8A33D` |
| `text-info` | `--app-info` | `#5B8DEF` |
| **`text-up`** | `--app-up` | `#34C77B` |
| **`text-down`** | `--app-down` | `#F0485F` |

> **Market data rule.** Anything that is a price move, return, P&L or delta uses
> **`up` / `down`**, never `positive` / `negative` and never a raw
> `text-emerald-400` / `text-red-400`. In practice you almost never write these
> classes by hand — use `<Delta>` / `<Money colored>` / `<Percent colored>`,
> which own the mapping. `directionClass()` is the escape hatch.

### Accent & focus

`text-brand` / `bg-brand` / `bg-brand-hover` / `text-brand-ink` —
amber `#E8BA40`, the same hue as the landing's `--lp-amber`. **The old
blue accent is retired**; there is one accent in the product.

Focus: add the `app-focus` class to any interactive element. It applies
`--app-focus-ring` on `:focus-visible` only.

### Spacing / radius / type / shadow

- Spacing: `--space-1..8` = `4 8 12 16 24 32 48 64px`. Maps 1:1 to Tailwind
  `1 2 3 4 6 8 12 16`. Block rhythm is `space-y-6`; in-card rhythm `space-y-3`.
- Radius: `--radius-control` `rounded-md` (inputs, buttons) · `--radius-tile`
  `rounded-lg` (stat tiles, tables) · `--radius-panel` `rounded-xl` (panels) ·
  `--radius-chip` `rounded-full`.
- Type: `--text-micro` 11 · `--text-label` 12 · `--text-body-sm` 13 (table body) ·
  `--text-body` 14 · `--text-lead` 16 (panel title) · `--text-figure` 22 (stat) ·
  `--text-figure-lg` 28 · `--text-title` 24 (page title).
- Shadow: `app-shadow-1` / `app-shadow-2` / `app-shadow-3`.

### Utility classes

| Class | What it does |
|---|---|
| `tnum` | tabular numerals — on every figure |
| `app-label` | 12px uppercase, tracked, `text-ink-faint` micro-label |
| `app-focus` | keyboard-only focus ring |
| `app-press` | transitions + `scale(0.97)` on `:active` (skills.md) |
| `app-enter` | `@starting-style` fade/rise, 300ms, delay `calc(var(--i) * 45ms)` |
| `app-row-hover` | subtle hover tint, gated on `@media (hover:hover)` |
| `app-shadow-1..3` | shadow ladder |
| `app-skeleton` | opacity pulse, disabled under reduced motion |

### Motion

`--ease-out-strong: cubic-bezier(0.23,1,0.32,1)` (Tailwind: `ease-out-strong`),
`--ease-in-out-strong`, durations `--dur-instant|fast|base|slow` =
`100 / 160 / 200 / 300ms`, `--stagger-step: 45ms`.
Transform + opacity only. Never `scale(0)`. Never `ease-in`.
`prefers-reduced-motion` is handled globally for all `app-*` classes.

**Stagger:** pass `index` to `StatCard`, or set
`style={{ "--i": i } as React.CSSProperties}` on any `.app-enter` element.

---

## 2. Components

### Surface / Panel / Card

```tsx
Surface(props: {
  level?: "sunken" | "raised" | "raised-2" | "overlay";   // default "raised"
  padding?: "none" | "sm" | "md" | "lg";                  // default "md"
  bordered?: boolean;                                     // default true
  radius?: "tile" | "panel" | "none";                     // default "panel"
  interactive?: boolean;                                  // press + hover border
  as?: "div" | "section" | "article" | "aside" | "li";    // default "div"
  className?: string;
  ...React.ComponentPropsWithoutRef<"div">
})
```

```tsx
<Surface level="raised-2" radius="tile" padding="sm">…</Surface>
```

`Card` is an alias of `Surface` (identical props) for grid call sites.

```tsx
Panel(props: SurfaceProps & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;   // right side of the panel header
  flush?: boolean;            // tighter header gap, for tables
  children?: React.ReactNode;
})   // `as` defaults to "section"
```

```tsx
<Panel title="Positions" description="Marked to last traded price" action={<RefreshButton />}>…</Panel>
```

### StatCard / StatGrid

```tsx
StatCard(props: {
  label: React.ReactNode;
  value: React.ReactNode;                 // string, number, or <Money/> etc.
  hint?: React.ReactNode;
  tone?: "neutral" | "positive" | "negative" | "warning" | "info" | "accent";  // default "neutral"
  size?: "sm" | "md" | "lg";              // default "md"
  icon?: React.ReactNode;
  index?: number;                         // stagger index
  className?: string;
})

StatGrid(props: { columns?: 2|3|4|5|6; className?: string; children }) // default 4
```

```tsx
<StatGrid columns={4}>
  <StatCard index={0} label="Equity" value={<Money value={equity} currency="INR" />} hint="incl. cash" />
</StatGrid>
```

> For a P&L figure, put the colouring on the value (`<Money colored signed />`)
> rather than on `tone` — `tone` is for judgements, not market direction.

### Money / Percent / Delta / NumberValue

All are null-safe: a `null`, `undefined` or non-finite input renders `—`
(`EM_DASH`) in `text-ink-faint`. Never `NaN`, never a silent `0`.

```tsx
Money(props: {
  value: number | null | undefined;
  currency?: string;      // default "INR" → ₹ + en-IN grouping; "USD" → $ + en-US
  digits?: number;        // default: 0 when |value| >= 1000, else 2
  compact?: boolean;      // INR → K / L / Cr ; others → K / M / B
  colored?: boolean;      // sign colouring via up/down tokens
  signed?: boolean;       // force leading "+"
  fallback?: string; className?: string; title?: string;
})
```

```tsx
<Money value={ltp} currency="INR" />               // ₹1,42,530
<Money value={pnl} currency="INR" colored signed /> // +₹1,240  (green)
```

```tsx
Percent(props: {
  value: number | null | undefined;
  as?: "points" | "ratio";   // default "points": 4.21 → "4.21%"; "ratio": 0.0421 → "4.21%"
  digits?: number;           // default 2
  colored?: boolean; signed?: boolean; fallback?: string; className?: string; title?: string;
})
```

```tsx
<Percent value={sharpe ? null : cagr} as="ratio" colored signed />
```

```tsx
Delta(props: {
  value?: number | null;     // absolute change
  percent?: number | null;   // percentage POINTS, e.g. -1.24
  currency?: string;         // default "INR" (only used when money)
  digits?: number;           // default 2
  money?: boolean;           // render `value` as currency
  arrow?: boolean;           // ▲ / ▼ glyph
  size?: "sm" | "md" | "lg"; // default "md"
  fallback?: string; className?: string; title?: string;
})
```

```tsx
<Delta value={change} percent={changePercent} arrow />   // ▲ +12.40 (+1.24%)
```

```tsx
NumberValue(props: { value: number|null|undefined; digits?: number; unit?: string; fallback?: string; className?: string; title?: string })
<NumberValue value={pe} digits={1} unit="x" />
```

Helpers, same module: `directionOf(value): "up"|"down"|"flat"|null`,
`directionClass(direction): string`, `DIRECTION_CLASS`.

### Formatters (strings, for non-JSX contexts)

```ts
EM_DASH                                        // "—"
isNum(value): value is number
formatNum(value, digits = 2): string
formatPct(value, digits = 2): string           // RATIO in: 0.0421 → "4.21%"
formatPercentPoints(value, digits = 2)         // POINTS in: 4.21 → "4.21%"
formatMoney(value, currency = "USD", digits?)  // default USD keeps legacy call sites working
formatCompactMoney(value, currency = "USD")    // INR → "₹1.24 Cr"
formatCompactNum(value, digits = 1)
currencySymbol(currency): string
signPrefix(value): "" | "+"
```

### DataTable

```tsx
Column<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  align?: "left" | "right" | "center";
  numeric?: boolean;                    // right-align + tnum
  sortable?: boolean;                   // requires sortValue
  sortValue?: (row: T) => number | string | null | undefined;
  width?: string;                       // "9rem"
  hideBelow?: "sm" | "md" | "lg";
  headerClassName?: string;
  cellClassName?: string;
}

DataTable<T>(props: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  stickyFirstColumn?: boolean;
  stickyHeader?: boolean;
  maxHeight?: string;                   // "28rem"; enables vertical scroll
  empty?: React.ReactNode;              // rendered INSTEAD of the table when rows is empty
  initialSort?: { key: string; direction: "asc" | "desc" };
  dense?: boolean;
  caption?: string;                     // sr-only
  className?: string;
})
```

```tsx
<DataTable
  rows={positions}
  getRowKey={(p) => p.symbol!}
  stickyFirstColumn
  empty={<EmptyState title="No positions" description="Place a trade to get started." />}
  columns={[
    { key: "symbol", header: "Symbol", cell: (p) => p.symbol ?? "—", sortable: true, sortValue: (p) => p.symbol },
    { key: "pnl", header: "Unrealised", numeric: true, sortable: true, sortValue: (p) => p.unrealizedPnL,
      cell: (p) => <Money value={p.unrealizedPnL} currency="INR" colored signed /> },
  ]}
/>
```

Sorting cycles asc → desc → unsorted. Nulls always sink to the bottom.
Overflow is contained inside the component (`overflow-x-auto`), so the page
body never scrolls sideways.

### Badge / Pill / StatusChip

```tsx
SemanticTone = "neutral" | "positive" | "negative" | "warning" | "info" | "accent" | "up" | "down";

Badge(props: { tone?: SemanticTone; size?: "sm"|"md"; pill?: boolean; uppercase?: boolean; className?; ...span props })
Pill(props: BadgeProps)                        // Badge with pill forced on
StatusChip(props: { status: "idle"|"pending"|"done"|"error"; label: React.ReactNode; className?: string })
```

```tsx
<Badge tone="up" uppercase pill>BULL</Badge>
<StatusChip status="pending" label="Valuation" />   // spinner · tick · cross
```

### EmptyState / ErrorState / InlineNotice / Skeleton

```tsx
EmptyState(props: { children?: React.ReactNode; title?: React.ReactNode; description?: React.ReactNode; icon?: React.ReactNode; action?: React.ReactNode; className?: string })
ErrorState(props: { message: string; onRetry?: () => void; title?: React.ReactNode; className?: string })
InlineNotice(props: { tone?: "info" | "warn" | "error"; title?: React.ReactNode; children?: React.ReactNode; action?: React.ReactNode; className?: string })
Skeleton(props: { className?: string })
```

```tsx
<EmptyState icon={<Star />} title="Watchlist is empty" description="Search a symbol to add one." action={<Button/>} />
<ErrorState message="Quote feed unavailable." onRetry={load} />
<InlineNotice tone="warn" title="Degraded pricing">Last traded prices are delayed.</InlineNotice>
<Skeleton className="h-8 w-32" />
```

`ErrorState` is for a recoverable failure inside a block. `InlineNotice` is for
context that is not a failure (degraded feed, paper mode, stale data).

### FormField / TextInput

```tsx
FormField(props: {
  label: React.ReactNode;
  children: (p: { id: string; "aria-describedby": string|undefined; "aria-invalid": true|undefined }) => React.ReactNode;
  id?: string; hint?: React.ReactNode; error?: React.ReactNode;
  required?: boolean; labelAction?: React.ReactNode; className?: string;
})

TextInput  // React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>
```

```tsx
<FormField label="Quantity" hint="Whole shares only" error={qtyError}>
  {(p) => <TextInput {...p} type="number" value={qty} onChange={(e) => setQty(e.target.value)} />}
</FormField>
```

The render prop wires `htmlFor`/`id`/`aria-describedby`/`aria-invalid`.
`error` replaces `hint` when present. Any control works — shadcn `Select`,
a combobox, anything that accepts an `id`.

### SectionHeader / PageShell

```tsx
SectionHeader(props: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; as?: "h2" | "h3"; className?: string })

PageShell(props: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;      // header-right controls
  eyebrow?: React.ReactNode;      // micro-label above the title
  notice?: React.ReactNode;       // full-bleed row under the header
  width?: "narrow" | "default" | "wide";   // max-w-3xl / max-w-6xl / max-w-screen-2xl, default "default"
  className?: string;
  children?: React.ReactNode;     // wrapped in space-y-6
})
```

```tsx
<PageShell title="Paper Trading" description="Simulated NSE/BSE delivery equity." actions={<ResetButton />}>
  <StatGrid>…</StatGrid>
  <Panel title="Positions">…</Panel>
</PageShell>
```

Every authenticated page starts with `PageShell`. Do not hand-roll a page title.

### Charts (re-exported, unchanged)

```tsx
import { LineChart, DonutChart, CHART_COLORS, type ChartSeries } from "@/components/system";

ChartSeries = { name: string; values: number[]; color: string; muted?: boolean }

LineChart(props: { series: ChartSeries[]; labels?: string[]; height?: number;
  yFormat?: (v: number) => string; xFormat?: (l: string) => string;
  showLegend?: boolean; className?: string })

DonutChart(props: { slices: { label: string; value: number; color: string }[]; size?: number; className?: string })
```

Implementation stays in `components/tools/charts.tsx` — hand-rolled inline SVG.
**Do not add a charting dependency.**

---

## 3. Rules for page agents

1. Import from `@/components/system` only. `components/tools/shared.tsx` is a
   deprecated re-export shim; do not add to it.
2. Never write a raw hex or a raw `text-emerald-*` / `text-red-*` /
   `text-yellow-*` / `bg-[#111111]` in a page. Use tokens.
3. Every figure goes through `Money` / `Percent` / `Delta` / `NumberValue` —
   that is how `—` (not `NaN`, not `0`) and tabular alignment are guaranteed.
4. One accent: amber. Do not reintroduce blue as a highlight.
5. Motion: `app-press` on pressables, `app-enter` (+ `--i`) for entrances,
   nothing over 300ms, transform/opacity only.
6. Preserve every fetch URL, request/response shape, polling interval and auth
   guard exactly. This is a presentation rebuild.
