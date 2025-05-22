import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { COMPANY_DATA } from '../../data/companyData';
import '../../styles/Analysis/NewsSentiment.css';

const NewsSentiment = ({ symbol }) => {
  if (!symbol || !COMPANY_DATA[symbol]) {
    return <div>No data available</div>;
  }

  const sentimentData = COMPANY_DATA[symbol].news_sentiment;

  return (
    <div className="news-sentiment-container">
      <div className="news-sentiment-header">
        <h2 className="news-sentiment-title">News Sentiment Analysis - {COMPANY_DATA[symbol].name}</h2>
        <p className="news-sentiment-subtitle">Real-time news sentiment distribution</p>
      </div>
      <div className="news-sentiment-content">
        <div className="sentiment-container">
          <h3 className="sentiment-title">News Sentiment Distribution</h3>
          <div className="chart-container">
            <PieChart width={500} height={500}>
              <Pie
                data={sentimentData.distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} (${value}%)`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentData.distribution.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="legend-label">{value}</span>}
              />
            </PieChart>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsSentiment;