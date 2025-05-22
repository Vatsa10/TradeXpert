// Express backend route for Yahoo Finance stock data
const express = require('express');
const router = express.Router();
const yahooFinance = require('yahoo-finance2').default;

// GET /api/stock?symbol=XXX&range=1M
router.get('/stock', async (req, res) => {
  const symbol = req.query.symbol;
  let range = req.query.range || '1mo';
  if (!symbol) return res.status(400).json({ error: 'Missing symbol' });
  try {
    // Get quote summary
    const quote = await yahooFinance.quoteSummary(symbol, { modules: ['price', 'summaryDetail'] });
    // Map range to valid chart() range values
    const validRanges = ['1d','5d','1mo','3mo','6mo','1y','2y','5y','10y','ytd','max'];
    if (!validRanges.includes(range)) range = '1mo';
    // Use chart() with only valid range
    const chart = await yahooFinance.chart(symbol, { range });
    let historicalData = [];
    if (chart && chart.result && chart.result[0]) {
      const timestamps = chart.result[0].timestamp || [];
      const closes = (chart.result[0].indicators.quote[0].close) || [];
      historicalData = timestamps.map((ts, idx) => ({
        date: new Date(ts * 1000).toISOString().split('T')[0],
        close: closes[idx]
      })).filter(item => item.close !== null && item.close !== undefined);
    } else if (chart && chart.quotes) {
      // fallback for alternate structure
      historicalData = (chart.quotes || []).map(item => ({
        date: new Date(item.date * 1000).toISOString().split('T')[0],
        close: item.close
      })).filter(item => item.close !== null && item.close !== undefined);
    }
    if (!historicalData.length) {
      throw new Error('No historical data found for this symbol and range.');
    }
    res.json({
      symbol: quote.price.symbol,
      shortName: quote.price.shortName,
      price: quote.price.regularMarketPrice,
      change: quote.price.regularMarketChange,
      changePercent: quote.price.regularMarketChangePercent,
      marketCap: quote.price.marketCap,
      volume: quote.price.regularMarketVolume,
      pe: quote.summaryDetail.trailingPE,
      eps: quote.summaryDetail.trailingEps,
      historicalData
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch stock data' });
  }
});

module.exports = router;
