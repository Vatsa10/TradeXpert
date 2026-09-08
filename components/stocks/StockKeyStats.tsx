import { currencyForSymbol, toNum } from "@/components/market/symbol";
import {
  Delta,
  Money,
  NumberValue,
  StatCard,
  StatGrid,
} from "@/components/system";

export interface StockKeyStatsProps {
  symbol: string;
  currentPrice?: number;
  changePercent?: number;
  priceFormatted?: string;
  changeFormatted?: string;
  marketCapFormatted?: string;
  peRatio?: string;
}

/**
 * The four figures a researcher checks before anything else. Values come
 * straight from `getStocksDetails` — numbers where the action provides them,
 * its pre-formatted string as the fallback.
 */
export function StockKeyStats({
  symbol,
  currentPrice,
  changePercent,
  priceFormatted,
  changeFormatted,
  marketCapFormatted,
  peRatio,
}: StockKeyStatsProps) {
  const currency = currencyForSymbol(symbol);

  return (
    <StatGrid columns={4}>
      <StatCard
        index={0}
        label="Last Price"
        value={
          typeof currentPrice === "number" ? (
            <Money value={currentPrice} currency={currency} digits={2} />
          ) : (
            <span className="text-ink-faint">{priceFormatted || "—"}</span>
          )
        }
        hint="Last traded"
      />
      <StatCard
        index={1}
        label="Day Change"
        value={
          typeof changePercent === "number" ? (
            <Delta percent={changePercent} arrow size="lg" />
          ) : (
            <span className="text-ink-faint">{changeFormatted || "—"}</span>
          )
        }
        hint="Versus previous close"
      />
      <StatCard
        index={2}
        label="Market Cap"
        value={
          <span className="tnum">{marketCapFormatted || "—"}</span>
        }
        hint="Reported by the exchange feed"
      />
      <StatCard
        index={3}
        label="P/E Ratio"
        value={<NumberValue value={toNum(peRatio)} digits={1} unit="x" />}
        hint="Normalised annual"
      />
    </StatGrid>
  );
}

export default StockKeyStats;
