import React, { useState, useRef, useEffect } from 'react';
import { Card, TextInput, Button } from '@tremor/react';
import { createChart } from 'lightweight-charts';

function StockPrediction() {
  const [symbolInput, setSymbolInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [hasChart, setHasChart] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    window.location.replace('http://localhost:5000/');
  }, []);

  // Autocomplete symbol search
  const handleSymbolInput = async (e) => {
    const value = e.target.value.toUpperCase();
    setSymbolInput(value);
    setShowSuggestions(true);
    setError('');
    setQuote(null);
    setPrediction(null);
    setHasChart(false);
    if (value.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/stock/search?q=${value}`);
      const data = await res.json();
      setSuggestions(data.quotes ? data.quotes.slice(0, 8) : []);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (symbol) => {
    setSymbolInput(symbol);
    setShowSuggestions(false);
    setSuggestions([]);
    setError('');
    fetchStockData(symbol);
  };

  // Fetch quote and prediction data
  const fetchStockData = async (inputSymbol) => {
    const symbol = inputSymbol || symbolInput;
    if (!symbol) return;
    setIsLoading(true);
    setError('');
    setQuote(null);
    setPrediction(null);
    setHasChart(false);
    try {
      // Quote
      const quoteRes = await fetch(`http://localhost:5000/api/stock/${symbol}/quote`);
      if (!quoteRes.ok) throw new Error('Symbol not found');
      const quoteData = await quoteRes.json();
      setQuote(quoteData);
      // Prediction (analyst target price, recommendation trend)
      const predRes = await fetch(`http://localhost:5000/api/stock/${symbol}/quoteSummary?modules=recommendationTrend,financialData`);
      const predData = await predRes.json();
      setPrediction(predData);
      // Chart (1Y, 1d interval)
      const now = new Date();
      const start = new Date(now);
      start.setDate(now.getDate() - 365);
      const period1 = start.toISOString().split('T')[0];
      const histRes = await fetch(`http://localhost:5000/api/stock/${symbol}/historical?period1=${period1}&interval=1d`);
      const histData = await histRes.json();
      const chartData = (Array.isArray(histData) ? histData : []).map((item) => ({
        time: item.date.toISOString().split('T')[0],
        value: item.close,
      }));
      if (!chartInstance.current) {
        chartInstance.current = createChart(chartRef.current, {
          height: 320,
          layout: {
            background: { type: 'solid', color: '#181e2a' },
            textColor: '#cbd5e1',
          },
          grid: {
            vertLines: { color: '#232b3b' },
            horzLines: { color: '#232b3b' },
          },
        });
        seriesRef.current = chartInstance.current.addLineSeries({
          color: '#3b82f6',
          lineWidth: 2,
        });
      }
      seriesRef.current.setData(chartData);
      chartInstance.current.timeScale().fitContent();
      setHasChart(chartData.length > 0);
    } catch (err) {
      setError('Could not fetch data. Please check the symbol and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    fetchStockData();
    setShowSuggestions(false);
  };

  // Extract prediction info
  const getTargetPrice = () => {
    if (!prediction || !prediction.financialData) return null;
    return prediction.financialData.targetMeanPrice || null;
  };
  const getRecommendation = () => {
    if (!prediction || !prediction.recommendationTrend) return null;
    const trends = prediction.recommendationTrend.trend;
    if (Array.isArray(trends) && trends.length > 0) {
      const latest = trends[0];
      return `Strong Buy: ${latest.strongBuy}, Buy: ${latest.buy}, Hold: ${latest.hold}, Sell: ${latest.sell}, Strong Sell: ${latest.strongSell}`;
    }
    return null;
  };

  // Format helpers
  const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    if (Math.abs(num) >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#131a26]">
      <div className="w-full flex flex-col items-center pt-16 pb-8">
        <h1 className="text-5xl font-extrabold text-white mb-2 text-center drop-shadow">Stock Market Explorer</h1>
        <p className="text-lg text-gray-400 mb-8 text-center">Track real-time stock prices and analyze market trends</p>
        <form onSubmit={handleSearch} className="w-full max-w-2xl">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"/></svg>
            </span>
            <input
              type="text"
              value={symbolInput}
              onChange={handleSymbolInput}
              placeholder="Search by company name or symbol (e.g., Apple or AAPL)"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow"
              autoComplete="off"
              onFocus={() => setShowSuggestions(true)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 bg-gray-800 border border-gray-700 rounded shadow w-full mt-1 max-h-48 overflow-y-auto">
                {suggestions.map((s) => (
                  <div
                    key={s.symbol}
                    className="px-4 py-2 cursor-pointer hover:bg-blue-900"
                    onClick={() => handleSuggestionClick(s.symbol)}
                  >
                    <span className="font-semibold text-white">{s.symbol}</span> <span className="text-gray-400">{s.shortname || s.longname}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>
      <div className="w-full max-w-5xl flex flex-col items-center gap-8">
        {error && <div className="mb-4 text-red-400 text-center text-base font-medium">{error}</div>}
        {quote && (
          <>
            {/* Top Stat Card */}
            <Card className="w-full mb-2 bg-[#181e2a] border border-[#232b3b] rounded-2xl shadow p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Stock Price</div>
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-bold text-white">${quote.regularMarketPrice}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${quote.regularMarketChange > 0 ? 'bg-green-900 text-green-400' : quote.regularMarketChange < 0 ? 'bg-red-900 text-red-400' : 'bg-gray-700 text-gray-300'}`}>{quote.regularMarketChange > 0 ? '▲' : quote.regularMarketChange < 0 ? '▼' : ''} {quote.regularMarketChange} ({quote.regularMarketChangePercent}%)</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-8 md:gap-12 mt-4 md:mt-0">
                  <div>
                    <div className="text-xs text-gray-400">Market Cap</div>
                    <div className="text-lg text-white">{formatNumber(quote.marketCap)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Volume</div>
                    <div className="text-lg text-white">{formatNumber(quote.regularMarketVolume)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">P/E Ratio</div>
                    <div className="text-lg text-white">{quote.trailingPE ?? 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">EPS</div>
                    <div className="text-lg text-white">{quote.epsTrailingTwelveMonths ?? 'N/A'}</div>
                  </div>
                </div>
              </div>
            </Card>
            {/* Chart Card */}
            <Card className="w-full bg-[#181e2a] border border-[#232b3b] rounded-2xl shadow p-8">
              <div className="text-xl font-bold text-white mb-4">{quote.shortName || quote.longName || symbolInput} Stock Price History</div>
              <div className="w-full flex items-center justify-center">
                <div ref={chartRef} className="w-full min-h-[350px] h-[320px] bg-[#181e2a] rounded-lg border border-[#232b3b] flex items-center justify-center">
                  {!hasChart && (
                    <span className="text-gray-600 text-base">No chart data. Search for a stock to view its chart.</span>
                  )}
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default StockPrediction;