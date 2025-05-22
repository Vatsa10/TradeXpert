import React from 'react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, Bar, ResponsiveContainer } from 'recharts';
import { Link2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/Analysis/TechnicalAnalysis.css';
import { COMPANY_DATA } from '../../data/companyData';

const TechnicalAnalysis = ({ symbol }) => {
  const { theme } = useTheme();

  if (!symbol || !COMPANY_DATA[symbol]) {
    return <div>No data available</div>;
  }

  const technicalData = COMPANY_DATA[symbol].technical;
  const companyData = COMPANY_DATA[symbol].predictive;
  
  // Create default chart data if no predictive data exists
  const chartData = companyData?.historical_data ? 
    companyData.historical_data.map(item => ({
      date: new Date(item.Date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      close: item.Close,
      volume: Math.floor(Math.random() * 50000000) + 20000000
    })) :
    [
      { date: 'Jan 2024', close: 100, volume: 30000000 },
      { date: 'Feb 2024', close: 105, volume: 35000000 },
      { date: 'Mar 2024', close: 110, volume: 40000000 },
      { date: 'Apr 2024', close: 108, volume: 38000000 },
      { date: 'May 2024', close: 115, volume: 42000000 }
    ];

  return (
    <div className="stock-analysis-container">
      <div className="technical-analysis-container">
        <div className="technical-header">
          <h2>Technical Analysis - {COMPANY_DATA[symbol].name}</h2>
          <Link2 className="icon" />
        </div>

        <div className="technical-json">
          <div className="bracket">{'{'}</div>
          <div className="ml-4">
            <span className="key">"price_trend"</span>: 
            <span className="string ml-1">"{technicalData.price_trend}"</span>
          </div>
          <div className="ml-4 bracket">"key_levels": {'{'}</div>
          <div className="ml-8">
            <span className="key">"support"</span>: 
            <span className="number ml-1">{technicalData.key_levels.support}</span>
          </div>
          <div className="ml-8">
            <span className="key">"resistance"</span>: 
            <span className="number ml-1">{technicalData.key_levels.resistance}</span>
          </div>
          <div className="ml-4 bracket">{'}'}</div>
          <div className="ml-4 bracket">"moving_averages": {'{'}</div>
          <div className="ml-8">
            <span className="key">"50_day"</span>: 
            <span className="string ml-1">"{technicalData.moving_averages["50_day"]}"</span>
          </div>
          <div className="ml-8">
            <span className="key">"200_day"</span>: 
            <span className="string ml-1">"{technicalData.moving_averages["200_day"]}"</span>
          </div>
          <div className="ml-4 bracket">{'}'}</div>
          <div className="bracket">{'}'}</div>
        </div>

        <div className="chart-container">
          <ComposedChart
            width={1200}
            height={600}
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis 
              dataKey="date"
              height={70}
              tick={{ angle: -45, textAnchor: 'end', dy: 20 }}
            />
            <YAxis 
              yAxisId="left" 
              domain={['auto', 'auto']}
              label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              label={{ value: 'Volume', angle: 90, position: 'insideRight' }}
            />
            <Tooltip />
            <Bar 
              dataKey="volume" 
              fill={theme === 'dark' ? '#374151' : '#e5e7eb'} 
              yAxisId="right"
              opacity={0.5}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke={technicalData.price_trend === "BULLISH" ? "#22c55e" : "#ef4444"}
              yAxisId="left"
              dot={false}
              strokeWidth={2}
            />
          </ComposedChart>
        </div>
      </div>
    </div>
  );
};

export default TechnicalAnalysis;