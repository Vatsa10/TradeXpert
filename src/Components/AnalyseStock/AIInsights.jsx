import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { COMPANY_DATA } from '../../data/companyData';
import '../../styles/Analysis/AIInsights.css';

const AIInsights = ({ symbol }) => {
  const { theme } = useTheme();

  if (!symbol || !COMPANY_DATA[symbol]) {
    return <div>No data available</div>;
  }

  const featureData = COMPANY_DATA[symbol].ai_insights.feature_importance;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="text-sm">{`${payload[0].payload.factor}: ${payload[0].payload.percentage}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`stock-analysis-container ${theme}`}>
      <h2 className="chart-title">AI Model Feature Importance Analysis - {COMPANY_DATA[symbol].name}</h2>
      <div className="chart-container">
        <BarChart
          width={1200}
          height={600}
          data={featureData}
          margin={{ top: 20, right: 30, left: 30, bottom: 60 }}
          barSize={50}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="factor"
            angle={-45}
            textAnchor="end"
            interval={0}
            tick={{ fontSize: 12 }}
            height={100}  // Increased height further
            dy={40}      // Move labels down
          />
          <YAxis
            tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
            domain={[0, 0.3]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="weight" 
            fill="#86efac"
            radius={[4, 4, 0, 0]}
          >
            {featureData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </div>
    </div>
  );
};

export default AIInsights;