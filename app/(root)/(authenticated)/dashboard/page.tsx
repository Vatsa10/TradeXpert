import KiteConnectButton from "@/components/KiteConnectButton";
import { WidgetPanel } from "@/components/dashboard/WidgetPanel";
import { PageShell } from "@/components/system";
import {
  HEATMAP_WIDGET_CONFIG,
  MARKET_DATA_WIDGET_CONFIG,
  MARKET_OVERVIEW_WIDGET_CONFIG,
  TOP_STORIES_WIDGET_CONFIG,
} from "@/lib/constants";

const SCRIPT_BASE =
  "https://s3.tradingview.com/external-embedding/embed-widget-";

export default async function DashboardPage() {
  return (
    <PageShell
      width="wide"
      eyebrow="Markets"
      title="Market workspace"
      description="Indices, sector breadth, headlines and live quotes — one screen, refreshed by the exchange feed."
      actions={<KiteConnectButton />}
    >
      {/* Row 1 — where the market stands: indices beside sector breadth. */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <WidgetPanel
          index={0}
          title="Market Overview"
          description="Indices, futures and rates"
          scriptUrl={`${SCRIPT_BASE}market-overview.js`}
          config={MARKET_OVERVIEW_WIDGET_CONFIG}
          widgetClassName="custom-chart"
          height={600}
          className="xl:col-span-1"
        />

        <WidgetPanel
          index={1}
          title="Stock Heatmap"
          description="Breadth by sector and market cap"
          scriptUrl={`${SCRIPT_BASE}stock-heatmap.js`}
          config={HEATMAP_WIDGET_CONFIG}
          height={600}
          className="xl:col-span-2"
        />
      </section>

      {/* Row 2 — why it moved: the tape beside the wire. */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <WidgetPanel
          index={2}
          title="Top Stories"
          description="Latest market headlines"
          scriptUrl={`${SCRIPT_BASE}timeline.js`}
          config={TOP_STORIES_WIDGET_CONFIG}
          height={600}
          className="xl:col-span-1"
        />

        <WidgetPanel
          index={3}
          title="Live Quotes"
          description="Actives across the major boards"
          scriptUrl={`${SCRIPT_BASE}market-quotes.js`}
          config={MARKET_DATA_WIDGET_CONFIG}
          height={600}
          className="xl:col-span-2"
        />
      </section>
    </PageShell>
  );
}
