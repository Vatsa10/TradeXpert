import React from 'react';
import { ChartBar, TrendingUp, AlertTriangle } from 'lucide-react';
import { COMPANY_DATA } from '../../data/companyData';
import '../../styles/Analysis/Performance.css';

const Performance = ({ symbol }) => {
  if (!symbol || !COMPANY_DATA[symbol]) {
    return <div>No data available</div>;
  }

  const performanceData = COMPANY_DATA[symbol].performance;

  return (
    <div className="stock-analysis-container">
      <div className="performance-wrapper">
        <div className="performance-header">
          <ChartBar className="w-6 h-6" />
          <h2>Model Performance Metrics - {COMPANY_DATA[symbol].name}</h2>
        </div>
        
        <div className="metrics-grid">
          {performanceData.metrics.map((metric, index) => (
            <div key={index} className="metric-card">
              <div className="metric-title">
                <div className="flex items-center gap-2">
                  {metric.type === 'risk' ? <AlertTriangle className="w-5 h-5" /> : 
                   metric.title.includes('Accuracy') ? <ChartBar className="w-5 h-5" /> :
                   <TrendingUp className="w-5 h-5" />}
                  {metric.title}
                </div>
              </div>
              <div className="metric-value">
                {metric.value}
                {metric.change && (
                  <span className="metric-change positive">
                    {metric.change}
                  </span>
                )}
                {metric.type === 'risk' && (
                  <span className={`metric-risk ${metric.value.toLowerCase()}`}>
                    {metric.value}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Performance;