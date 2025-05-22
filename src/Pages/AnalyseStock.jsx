import React, { useState, useEffect } from 'react';
import { Info, Loader2 } from 'lucide-react';
import TechnicalAnalysis from '../Components/AnalyseStock/TechnicalAnalysis';
import FundamentalAnalysis from '../Components/AnalyseStock/FundamentalAnalysis';
import AIInsights from '../Components/AnalyseStock/AIInsights';
import Performance from '../Components/AnalyseStock/Performance';
import NewsSentiment from '../Components/AnalyseStock/NewsSentiment';
import PredictiveAnalytics from '../Components/AnalyseStock/PredictiveAnalytics';
import { useTheme } from '../context/ThemeContext';
import '../styles/AnalyseStock.css';
import { COMPANY_DATA } from '../data/companyData';

const TOP_COMPANIES = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corporation",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.",
  META: "Meta Platforms Inc.",
  TSLA: "Tesla Inc.",
  NVDA: "NVIDIA Corporation",
  JPM: "JPMorgan Chase & Co.",
  WMT: "Walmart Inc.",
  HD: "Home Depot Inc",
  RELIANCE: "Reliance Industries Limited",
  HDFCBANK: "HDFC Bank Limited",
  TCS: "Tata Consultancy Services Limited",
  INFY: "Infosys Limited",
  ICICIBANK:"ICICI Bank Limited",   
  SBIN:"State Bank of India",
  BHARTIARTL:"Bharti Airtel Limited",
  HINDUNILVR:"Hindustan Unilever Limited",
  KOTAKBANK:"Kotak Mahindra Bank Limited",
  ITC:"ITC Ltd.",
  MRF:"Madras Rubber Factory",
  ADANIENT:"Adani Enterprises Limited",
  TATASTEEL:"Tata Steel Limited",
};

const AnalyseStock = () => {
  const [symbol, setSymbol] = useState('');
  const [period, setPeriod] = useState('1 Year');
  const [activeTab, setActiveTab] = useState('technical');
  const [isValidCompany, setIsValidCompany] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const { theme } = useTheme();
  const [confidenceScore, setConfidenceScore] = useState(0);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (symbol) {
      const upperSymbol = symbol.toUpperCase();
      const filteredCompanies = Object.entries(TOP_COMPANIES)
        .filter(([key, value]) => 
          key.toLowerCase().includes(symbol.toLowerCase()) ||
          value.toLowerCase().includes(symbol.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filteredCompanies);
      
      const isValid = TOP_COMPANIES.hasOwnProperty(upperSymbol);
      setIsValidCompany(isValid);
      setShowNotFound(false); // Reset not found message when typing

      if (isValid && COMPANY_DATA[upperSymbol] && COMPANY_DATA[upperSymbol].predictive) {
        setConfidenceScore(COMPANY_DATA[upperSymbol].predictive.confidence_score);
      } else {
        setConfidenceScore(0);
      }
    } else {
      setSuggestions([]);
      setIsValidCompany(false);
      setConfidenceScore(0);
      setShowNotFound(false);
    }
  }, [symbol]);

  const handleAnalyze = () => {
    setIsLoading(true);
    if (isValidCompany) {
      setTimeout(() => {
        setIsAnalyzed(true);
        setShowNotFound(false);
        if (COMPANY_DATA[symbol.toUpperCase()] && COMPANY_DATA[symbol.toUpperCase()].predictive) {
          setConfidenceScore(COMPANY_DATA[symbol.toUpperCase()].predictive.confidence_score);
        }
        setIsLoading(false);
      }, 4000);
    } else {
      setTimeout(() => {
        setShowNotFound(true);
        setIsAnalyzed(false);
        setIsLoading(false);
      }, 4000); 
    }
  };

  const handleSymbolSelect = (selectedSymbol) => {
    setSymbol(selectedSymbol);
    setSuggestions([]);
    setIsAnalyzed(false);
    setShowNotFound(false);
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'technical':
        return <TechnicalAnalysis symbol={symbol.toUpperCase()} />;
      case 'fundamental':
        return <FundamentalAnalysis symbol={symbol.toUpperCase()} />;
      case 'ai':
        return <AIInsights symbol={symbol.toUpperCase()} />;
      case 'performance':
        return <Performance symbol={symbol.toUpperCase()} />;
      case 'news':
        return <NewsSentiment symbol={symbol.toUpperCase()} />;
      case 'predictive':
        return <PredictiveAnalytics symbol={symbol.toUpperCase()} />;
      default:
        return null;
    }
  };

  return (
    <div className={`analyse-stock ${theme}`}>
      <div className="header-section">
        <div className="input-container">
          <div className="search-wrapper">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Enter Stock Symbol (e.g., AAPL)"
              className="search-input"
            />
            {suggestions.length > 0 && symbol && (
              <div className="suggestions-dropdown">
                {suggestions.map(([key, value]) => (
                  <div
                    key={key}
                    className="suggestion-item"
                    onClick={() => handleSymbolSelect(key)}
                  >
                    <span className="symbol">{key}</span>
                    <span className="company-name">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Info className="info-icon" />
          <div className="period-selector">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option>1 Year</option>
              <option>6 Months</option>
            </select>
          </div>
          <button 
            className="analyze-button"
            onClick={handleAnalyze}
          >
            Analyze
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="loading-container">
          <Loader2 className="loading-spinner" />
          <p>Analyzing stock data...</p>
        </div>
      )}

      {!isLoading && showNotFound && (
        <div className="not-found-message">
          <p>Symbol not found. Please enter a valid stock symbol from the suggested list.</p>
          <p>Available companies include: AAPL, MSFT, GOOGL, etc.</p>
        </div>
      )}

      {!isLoading && isValidCompany && isAnalyzed && (
        <>
          <div className="confidence-score-section">
            <div className="score-label">AI Analysis Confidence Score</div>
            <div className="score-bar-container">
              <div 
                className="score-bar"
                style={{ width: `${confidenceScore}%` }}
              />
            </div>
            <div className="score-value">{confidenceScore}%</div>
          </div>

          <div className="tabs-container">
            <button
              className={`tab ${activeTab === 'technical' ? 'active' : ''}`}
              onClick={() => setActiveTab('technical')}
            >
              📊 Technical Analysis
            </button>
            <button
              className={`tab ${activeTab === 'fundamental' ? 'active' : ''}`}
              onClick={() => setActiveTab('fundamental')}
            >
              📈 Fundamental Analysis
            </button>
            <button
              className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              🤖 AI Insights
            </button>
            <button
              className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
              onClick={() => setActiveTab('performance')}
            >
              📉 Performance
            </button>
            <button
              className={`tab ${activeTab === 'news' ? 'active' : ''}`}
              onClick={() => setActiveTab('news')}
            >
              📰 News Sentiment
            </button>
            <button
              className={`tab ${activeTab === 'predictive' ? 'active' : ''}`}
              onClick={() => setActiveTab('predictive')}
            >
              🔮 Predictive Analytics
            </button>
          </div>

          <div className="analysis-content">
            {renderActiveComponent()}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyseStock;
