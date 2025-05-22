import React from 'react';
import { FaNewspaper, FaChartLine } from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardContent } from '../../Pages/Home';

const NewsSection = ({ latestNews }) => {
  return (
    <section className="news-section">
      <Card>
        <CardHeader>
          <CardTitle className="news-header">
            <div className="news-title-row">
              <div className="news-title">
                <FaNewspaper className="news-icon" />
                <h2>Curated News</h2>
              </div>
              <div className="news-filters">
                <span className="active">All</span>
                <span>Market</span>
                <span>Economy</span>
                <span>Corporate</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="news-grid">
            {latestNews.map((news, index) => (
              <div 
                key={news.id} 
                className="news-item animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="news-item-header">
                  <span className="news-category">{news.category}</span>
                  {news.tag && <span className="news-tag">{news.tag}</span>}
                </div>
                <h4>{news.title}</h4>
                <div className="news-footer">
                  <span className="news-time">
                    <FaChartLine className="news-indicator" />
                    {news.time}
                  </span>
                  <button className="news-read-more">Read More</button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default NewsSection;
