import React, { useState } from "react";
import { motion } from "framer-motion";
import { FiBell, FiTrendingUp, FiAlertTriangle, FiInfo, FiBarChart2 } from 'react-icons/fi';
import "../styles/Notifications.css";

function Notifications() {
  const [notifications] = useState([
    {
      id: 1,
      title: "Stock Alert: AAPL",
      message: "Apple Inc. stock has increased by 5% in the last hour",
      time: "2 hours ago",
      type: "success",
      icon: <FiTrendingUp />,
      category: "stock"
    },
    {
      id: 2,
      title: "Portfolio Performance",
      message: "Your portfolio has grown by 2.3% this week. Top performer: Tesla Inc.",
      time: "5 hours ago",
      type: "info",
      icon: <FiBarChart2 />,
      category: "portfolio"
    },
    {
      id: 3,
      title: "Market Volatility Alert",
      message: "High market volatility detected in tech sector. Consider reviewing your positions.",
      time: "1 day ago",
      type: "warning",
      icon: <FiAlertTriangle />,
      category: "market"
    },
    {
      id: 4,
      title: "New Feature Available",
      message: "Try our new AI-powered stock analysis tool for better insights!",
      time: "2 days ago",
      type: "info",
      icon: <FiInfo />,
      category: "system"
    },
    {
      id: 5,
      title: "Watchlist Alert: MSFT",
      message: "Microsoft Corp. has reached your target price of $300",
      time: "2 days ago",
      type: "success",
      icon: <FiBell />,
      category: "watchlist"
    },
    {
      id: 6,
      title: "Risk Assessment",
      message: "Your portfolio risk level has increased. Consider diversification.",
      time: "3 days ago",
      type: "warning",
      icon: <FiAlertTriangle />,
      category: "risk"
    },
    {
      id: 7,
      title: "Dividend Payment",
      message: "Received dividend payment of $150 from Johnson & Johnson",
      time: "4 days ago",
      type: "success",
      icon: <FiTrendingUp />,
      category: "dividend"
    },
    {
      id: 8,
      title: "Market News",
      message: "Federal Reserve announces new interest rate policy",
      time: "5 days ago",
      type: "info",
      icon: <FiInfo />,
      category: "news"
    }
  ]);

  const categories = [
    { name: 'all', label: 'All' },
    { name: 'stock', label: 'Stocks' },
    { name: 'portfolio', label: 'Portfolio' },
    { name: 'market', label: 'Market' },
    { name: 'watchlist', label: 'Watchlist' }
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredNotifications = notifications.filter(notification => 
    selectedCategory === 'all' || notification.category === selectedCategory
  );

  return (
    <div className="notifications-container">
      <h1>Notifications</h1>
      
      <div className="notification-filters">
        {categories.map(category => (
          <button
            key={category.name}
            className={`filter-button ${selectedCategory === category.name ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.name)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="notifications-list">
        {filteredNotifications.map((notification, index) => (
          <motion.div 
            key={notification.id}
            className={`notification-card ${notification.type}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="notification-icon">
              {notification.icon}
            </div>
            <div className="notification-content">
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
              <span className="notification-time">{notification.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Notifications;
