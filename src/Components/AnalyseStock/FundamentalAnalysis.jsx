import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { COMPANY_DATA } from '../../data/companyData';
import '../../styles/Analysis/FundamentalAnalysis.css';

const MetricCard = ({ label, value }) => (
  <div className="metric-card">
    <div className="metric-label">{label}</div>
    <div className="metric-value">{value}</div>
  </div>
);

const FundamentalAnalysis = ({ symbol }) => {
  const { theme } = useTheme();

  if (!symbol || !COMPANY_DATA[symbol]) {
    return <div>No data available</div>;
  }

  const fundamentalData = COMPANY_DATA[symbol].fundamental;
  const metrics = [
    { label: "Market Cap", value: fundamentalData.metrics.market_cap },
    { label: "52 Week High", value: fundamentalData.metrics.week_52_high },
    { label: "Dividend Yield", value: fundamentalData.metrics.dividend_yield },
    { label: "P/E Ratio", value: fundamentalData.metrics.pe_ratio },
    { label: "52 Week Low", value: fundamentalData.metrics.week_52_low },
    { label: "Beta", value: fundamentalData.metrics.beta }
  ];

  return (
    <div className={`stock-analysis-container ${theme}`}>
      <div className="analysis-container">
        <div className="analysis-header">
          <h2>Fundamental Analysis - {COMPANY_DATA[symbol].name}</h2>
        </div>
        
        {/* JSON Data Display */}
        <div className="json-display">
          <div className="json-bracket">{'{'}</div>
          <div className="ml-4">
            <span className="json-key">"valuation"</span>: 
            <span className="json-string ml-1">"{fundamentalData.valuation}"</span>
          </div>
          <div className="ml-4 json-bracket">"key_metrics": {'{'}</div>
          <div className="ml-8">
            <span className="json-key">"pe_ratio_analysis"</span>: 
            <span className="json-string ml-1">"{fundamentalData.key_metrics.pe_ratio_analysis}"</span>
          </div>
          <div className="ml-8">
            <span className="json-key">"market_cap_assessment"</span>: 
            <span className="json-string ml-1">"{fundamentalData.key_metrics.market_cap_assessment}"</span>
          </div>
          <div className="ml-4 json-bracket">{'}'}</div>
          <div className="json-bracket">{'}'}</div>
        </div>

        {/* Metrics Grid */}
        <div className="metrics-grid">
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FundamentalAnalysis;
