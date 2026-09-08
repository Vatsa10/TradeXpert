"use client";

import TradingViewWidget from "@/components/TradingViewWidget";
import { Surface } from "@/components/system";
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
} from "@/lib/constants";

/**
 * TradingView embeds for the finished report. Widget configs and the
 * `NASDAQ:` prefixing rule are preserved exactly as they were.
 */
export function ReportCharts({ symbol }: { symbol: string }) {
  return (
    <div className="space-y-6">
      <Surface padding="none" className="h-[450px] overflow-hidden">
        <TradingViewWidget
          scriptUrl="https://www.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
          config={{
            width: "100%",
            height: 450,
            symbol: symbol.includes(":") ? symbol : `NASDAQ:${symbol}`,
            interval: "D",
            timezone: "Etc/UTC",
            theme: "dark",
            style: "1",
            locale: "en",
            enable_publishing: false,
            allow_symbol_change: true,
            calendar: false,
            support_host: "https://www.tradingview.com",
          }}
          height={450}
        />
      </Surface>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="space-y-3 md:col-span-1">
          <p className="app-label px-1">Market Pulse</p>
          <Surface padding="none" className="h-[200px] overflow-hidden">
            <TradingViewWidget
              scriptUrl="https://www.tradingview.com/external-embedding/embed-widget-symbol-info.js"
              config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
              height={200}
            />
          </Surface>
        </div>

        <div className="space-y-3 md:col-span-3">
          <p className="app-label px-1 md:text-right">Technical Indicators</p>
          <Surface padding="none" className="h-[200px] overflow-hidden">
            <TradingViewWidget
              scriptUrl="https://www.tradingview.com/external-embedding/embed-widget-technical-analysis.js"
              config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
              height={200}
            />
          </Surface>
        </div>
      </div>
    </div>
  );
}
