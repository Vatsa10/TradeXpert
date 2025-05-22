import React from 'react';
import { FaChartLine, FaChartBar, FaExchangeAlt } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '../../Pages/Home';

const MarketOverview = ({ marketOverview }) => {
  return (
    <section className="market-overview">
      <Card>
        <CardHeader>
          <CardTitle className="overview-header">
            <h1>Market Overview</h1>
            <span className="last-updated">Last updated: {new Date().toLocaleTimeString()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="stats-cards">
            <div className="stat-card">
              <FaChartLine className="stat-icon" />
              <div className="stat-content">
                <h3>Dow Jones</h3>
                <p>{marketOverview.dowJones.value}</p>
                <span className="change positive">{marketOverview.dowJones.change}</span>
              </div>
            </div>
            <div className="stat-card">
              <FaChartBar className="stat-icon" />
              <div className="stat-content">
                <h3>Market Sentiment</h3>
                <p className="sentiment bullish">{marketOverview.marketSentiment}</p>
              </div>
            </div>
            <div className="stat-card">
              <FaExchangeAlt className="stat-icon" />
              <div className="stat-content">
                <h3>Trading Volume</h3>
                <p>2.1B</p>
                <span className="change">+15% avg</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default MarketOverview;
