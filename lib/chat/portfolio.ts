import { WatchlistItem } from "./types";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getFinnhubQuote } from "./aggregator";

const TIMEOUT_MS = 500;

export interface PortfolioPosition {
  symbol: string;
  name?: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), ms)
      ),
    ]);
  } catch {
    return null;
  }
}

export async function getPortfolioContext(userEmail: string): Promise<PortfolioPosition[]> {
  try {
    const symbols = await getWatchlistSymbolsByEmail(userEmail);
    
    if (!symbols || symbols.length === 0) {
      return [];
    }

    const priceTasks = symbols.slice(0, 10).map(async (symbol) => {
      const priceData = await withTimeout(getFinnhubQuote(symbol), TIMEOUT_MS);
      
      return {
        symbol,
        currentPrice: priceData?.current,
        change: priceData?.change,
        changePercent: priceData?.changePercent,
      } as PortfolioPosition;
    });

    const positions = await Promise.allSettled(priceTasks);

    return positions
      .filter((p) => p.status === "fulfilled")
      .map((p: any) => p.value)
      .filter((p) => p.symbol);
  } catch (error) {
    console.error("Portfolio context error:", error);
    return [];
  }
}

export function formatPortfolioForContext(portfolio: PortfolioPosition[]): string {
  if (!portfolio || portfolio.length === 0) {
    return "";
  }

  let context = "\n### USER PORTFOLIO (Watchlist):\n";

  portfolio.forEach((p) => {
    const price = p.currentPrice ? `$${p.currentPrice.toFixed(2)}` : "N/A";
    const change = p.changePercent
      ? `${p.changePercent > 0 ? "+" : ""}${p.changePercent.toFixed(2)}%`
      : "";
    
    context += `- ${p.symbol}: ${price} ${change}\n`;
  });

  return context;
}

export function isStockInPortfolio(symbol: string, portfolio: PortfolioPosition[]): boolean {
  return portfolio.some((p) => p.symbol.toUpperCase() === symbol.toUpperCase());
}
