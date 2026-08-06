import { getIndianStockQuote, getIndianHistorical, getIndianIndexQuotes, searchIndianStocks } from "@/lib/data/providers/nse-india";

async function main() {
  console.log("--- quote RELIANCE.NS ---");
  const q = await getIndianStockQuote("RELIANCE.NS");
  console.log(JSON.stringify(q, null, 2));

  console.log("--- historical TCS.NS 30 ---");
  const h = await getIndianHistorical("TCS.NS", 30);
  console.log("rows:", h.length, JSON.stringify(h.slice(-3), null, 2));

  console.log("--- indices ---");
  const i = await getIndianIndexQuotes();
  console.log("count:", i.length, JSON.stringify(i.slice(0, 2)));

  console.log("--- search RELI ---");
  console.log(JSON.stringify(await searchIndianStocks("RELI")));
}
main();
