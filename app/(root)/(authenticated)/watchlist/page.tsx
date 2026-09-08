import { searchStocks } from "@/lib/actions/finnhub.actions";
import SearchCommand from "@/components/SearchCommand";
import { WatchlistTable } from "@/components/WatchlistTable";
import { getWatchlistWithData } from "@/lib/actions/getWatchlistWithData.actions";
import { PageShell } from "@/components/system";

// Session-scoped page (reads auth headers) — never statically renderable.
export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const watchlist = await getWatchlistWithData();
  const initialStocks = await searchStocks();

  const count = watchlist.length;

  return (
    <PageShell
      width="wide"
      eyebrow="Tracking"
      title="Watchlist"
      description={
        count > 0
          ? `${count} ${count === 1 ? "stock" : "stocks"} — last price, day change and valuation at a glance.`
          : "Stocks you follow, with last price, day change and valuation at a glance."
      }
      actions={<SearchCommand initialStocks={initialStocks} />}
    >
      <div className="app-enter">
        <WatchlistTable watchlist={watchlist} />
      </div>
    </PageShell>
  );
}
