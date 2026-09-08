import { notFound } from "next/navigation";

import WatchlistButton from "@/components/WatchlistButton";
import { WidgetPanel } from "@/components/dashboard/WidgetPanel";
import { StockKeyStats } from "@/components/stocks/StockKeyStats";
import { exchangeForSymbol } from "@/components/market/symbol";
import { Badge, PageShell } from "@/components/system";
import { WatchlistItem } from "@/database/models/watchlist.model";
import { getStocksDetails } from "@/lib/actions/finnhub.actions";
import { getUserWatchlist } from "@/lib/actions/watchlist.actions";
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";

const SCRIPT_BASE =
  "https://s3.tradingview.com/external-embedding/embed-widget-";

export default async function StockDetails({ params }: StockDetailsPageProps) {
  const { symbol } = await params;

  const stockData = await getStocksDetails(symbol.toUpperCase());
  const watchlist = await getUserWatchlist();

  const isInWatchlist = watchlist.some(
    (item: WatchlistItem) => item.symbol === symbol.toUpperCase()
  );

  // Unknown / uncovered ticker — render the 404, never a half-empty page.
  if (!stockData) notFound();

  const exchange = exchangeForSymbol(stockData.symbol);

  return (
    <PageShell
      width="wide"
      eyebrow={
        <span className="flex items-center gap-2">
          <span className="tnum">{stockData.symbol}</span>
          {exchange && (
            <Badge tone="neutral" size="sm" uppercase pill>
              {exchange}
            </Badge>
          )}
        </span>
      }
      title={stockData.company}
      actions={
        <WatchlistButton
          symbol={symbol}
          company={stockData.company}
          isInWatchlist={isInWatchlist}
          type="button"
        />
      }
    >
      <StockKeyStats
        symbol={stockData.symbol}
        currentPrice={stockData.currentPrice}
        changePercent={stockData.changePercent}
        priceFormatted={stockData.priceFormatted}
        changeFormatted={stockData.changeFormatted}
        marketCapFormatted={stockData.marketCapFormatted}
        peRatio={stockData.peRatio}
      />

      <WidgetPanel
        index={0}
        title="Symbol Snapshot"
        scriptUrl={`${SCRIPT_BASE}symbol-info.js`}
        config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
        height={170}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <WidgetPanel
            index={1}
            title="Price Chart"
            description="Candles with volume"
            scriptUrl={`${SCRIPT_BASE}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
            widgetClassName="custom-chart"
            height={600}
          />

          <WidgetPanel
            index={2}
            title="Baseline"
            description="Performance against the opening level"
            scriptUrl={`${SCRIPT_BASE}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(symbol)}
            widgetClassName="custom-chart"
            height={600}
          />
        </div>

        <div className="flex flex-col gap-4 xl:col-span-1">
          <WidgetPanel
            index={3}
            title="Technicals"
            description="Oscillator and moving-average consensus"
            scriptUrl={`${SCRIPT_BASE}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
            height={400}
          />

          <WidgetPanel
            index={4}
            title="Company Profile"
            scriptUrl={`${SCRIPT_BASE}company-profile.js`}
            config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
            height={440}
          />

          <WidgetPanel
            index={5}
            title="Financials"
            description="Reported statements"
            scriptUrl={`${SCRIPT_BASE}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
            height={464}
          />
        </div>
      </section>
    </PageShell>
  );
}
