/**
 * Charts remain hand-rolled inline SVG in components/tools/charts.tsx — no
 * chart library is in the dependency tree and none should be added. This
 * module only re-points the import path at the design system so pages have a
 * single place to import from.
 */
export {
  CHART_COLORS,
  DonutChart,
  LineChart,
  type ChartSeries,
} from "@/components/tools/charts";
