/**
 * TradeXpert design system — the single source of truth for the signed-in app.
 *
 * Import everything from "@/components/system". Tokens live in
 * app/globals.css; the API contract is components/system/README.md.
 */

export {
  EM_DASH,
  currencySymbol,
  directionOf,
  formatCompactMoney,
  formatCompactNum,
  formatMoney,
  formatNum,
  formatPct,
  formatPercentPoints,
  isNum,
  signPrefix,
  type CurrencyCode,
  type Direction,
} from "./format";

export {
  Card,
  Panel,
  Surface,
  type PanelProps,
  type SurfaceLevel,
  type SurfacePadding,
  type SurfaceProps,
} from "./Surface";

export {
  StatCard,
  StatGrid,
  type StatCardProps,
  type StatGridProps,
  type StatTone,
} from "./Stat";

export {
  Delta,
  DIRECTION_CLASS,
  Money,
  NumberValue,
  Percent,
  directionClass,
  type DeltaProps,
  type MoneyProps,
  type NumberValueProps,
  type PercentProps,
} from "./Value";

export {
  Badge,
  Pill,
  StatusChip,
  type BadgeProps,
  type SemanticTone,
  type StatusChipProps,
  type StatusKind,
} from "./Badge";

export {
  EmptyState,
  ErrorState,
  InlineNotice,
  Skeleton,
  type EmptyStateProps,
  type ErrorStateProps,
  type InlineNoticeProps,
  type NoticeTone,
} from "./States";

export {
  DataTable,
  type Column,
  type DataTableProps,
  type SortDirection,
} from "./DataTable";

export {
  FormField,
  TextInput,
  type FormFieldControlProps,
  type FormFieldProps,
} from "./FormField";

export {
  PageShell,
  SectionHeader,
  type PageShellProps,
  type SectionHeaderProps,
} from "./Layout";

/**
 * Charts stay hand-rolled inline SVG (no chart library in the dependency
 * tree). Re-exported here so pages import from one place.
 */
export { CHART_COLORS, DonutChart, LineChart, type ChartSeries } from "./charts";
