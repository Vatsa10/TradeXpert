
import "dotenv/config";

/**
 * Fetch the latest stock price for a given symbol using Alpha Vantage.
 */
export async function getStockPrice(symbol: string): Promise<string> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) throw new Error("ALPHA_VANTAGE_API_KEY is not set");

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return JSON.stringify(data["Global Quote"] || data);
  } catch (e) {
    return `Error fetching stock price for ${symbol}: ${e}`;
  }
}

/**
 * Fetch recent news articles for a given company name using NewsAPI.
 */
export async function getRecentNews(companyName: string): Promise<string> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) throw new Error("NEWS_API_KEY is not set");

  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(companyName)}&language=en&sortBy=relevancy&pageSize=5&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return JSON.stringify(data.articles || data);
  } catch (e) {
    return `Error fetching news for ${companyName}: ${e}`;
  }
}
