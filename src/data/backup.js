export const COMPANY_DATA = {
  MSFT: {
    name: "Microsoft Corporation",
    technical: {
      price_trend: "BULLISH",
      key_levels: {
        support: 312.45,
        resistance: 378.92
      },
      moving_averages: {
        "50_day": "ABOVE",
        "200_day": "ABOVE"
      }
    },
    fundamental: {
      valuation: "PREMIUM",
      key_metrics: {
        pe_ratio_analysis: "32.54",
        market_cap_assessment: "$2,890,450,000,000"
      },
      metrics: {
        market_cap: "$2,890,450,000,000",
        week_52_high: "$384.30",
        dividend_yield: "0.82%",
        pe_ratio: "32.54",
        week_52_low: "$275.37",
        beta: "0.92"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.28, percentage: '28.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.04, percentage: '4.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        {
          title: 'Prediction Accuracy',
          value: '89.2%',
          change: '+3.1%'
        },
        {
          title: 'Average Return',
          value: '15.3%',
          change: '+2.1%'
        },
        {
          title: 'Risk Score',
          value: 'Low',
          type: 'risk'
        }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 65, color: '#4ade80' },
        { name: 'Neutral', value: 25, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 88,
      predicted_change: '+7.2%',
      risk_level: 'Low',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 280 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 285 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 290 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 295 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 300 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 305 }
      ],
      predicted_data: [
        { Date: new Date(2023, 0, 6).getTime(), Close: 305 },
        { Date: new Date(2023, 0, 7).getTime(), Close: 308 },
        { Date: new Date(2023, 0, 8).getTime(), Close: 312 },
        { Date: new Date(2023, 0, 9).getTime(), Close: 315 },
        { Date: new Date(2023, 0, 10).getTime(), Close: 318 }
      ]
    }
  },
  AAPL: {
    name: "Apple Inc.",
    technical: {
      price_trend: "BEARISH",
      key_levels: {
        support: 217.97,
        resistance: 225.42
      },
      moving_averages: {
        "50_day": "BELOW",
        "200_day": "ABOVE"
      }
    },
    fundamental: {
      valuation: "PREMIUM",
      key_metrics: {
        pe_ratio_analysis: "36.077652",
        market_cap_assessment: "$3,419,781,201,920"
      },
      metrics: {
        market_cap: "$3,419,781,201,920",
        week_52_high: "$260.10",
        dividend_yield: "0.42%",
        pe_ratio: "36.08",
        week_52_low: "$164.08",
        beta: "1.24"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.25, percentage: '25.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.20, percentage: '20.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.19, percentage: '19.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.13, percentage: '13.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        {
          title: 'Prediction Accuracy',
          value: '87.5%',
          change: '+2.3%'
        },
        {
          title: 'Average Return',
          value: '12.8%',
          change: '+1.5%'
        },
        {
          title: 'Risk Score',
          value: 'Medium',
          type: 'risk'
        }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 60, color: '#4ade80' },
        { name: 'Neutral', value: 30, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 85,
      predicted_change: '+6.5%',
      risk_level: 'Medium',
      historical_data: [
        { Date: new Date(2024, 10, 1).getTime(), Close: 225.91 },
        { Date: new Date(2024, 11, 2).getTime(), Close: 237.33 },
        { Date: new Date(2024, 12, 3).getTime(), Close: 250.42 },
        { Date: new Date(2025, 1, 4).getTime(), Close: 236.00 },
        { Date: new Date(2025, 2, 5).getTime(), Close: 241.84 },
        { Date: new Date(2025, 3, 6).getTime(), Close: 223.85 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 6).getTime(), Close: 230.25 },
        { Date: new Date(2025, 4, 21).getTime(), Close: 235.80 },
        { Date: new Date(2025, 5, 6).getTime(), Close: 240.45 },
        { Date: new Date(2025, 5, 21).getTime(), Close: 245.10 },
        { Date: new Date(2025, 6, 6).getTime(), Close: 250.75 },
        { Date: new Date(2025, 6, 21).getTime(), Close: 255.40 },
        { Date: new Date(2025, 7, 6).getTime(), Close: 260.05 },
        { Date: new Date(2025, 7, 21).getTime(), Close: 265.70 },
        { Date: new Date(2025, 8, 6).getTime(), Close: 270.35 },
        { Date: new Date(2025, 8, 21).getTime(), Close: 275.00 }
      ]
    }
  },
  AMZN: {
    name: "Amazon.com, Inc.",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 125.65, resistance: 145.78 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "FAIR",
      key_metrics: { pe_ratio_analysis: "38.20", market_cap_assessment: "$1,620,000,000,000" },
      metrics: {
        market_cap: "$1,620,000,000,000",
        week_52_high: "$147.25",
        dividend_yield: "-",
        pe_ratio: "38.20",
        week_52_low: "$95.25",
        beta: "1.35"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.24, percentage: '24.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.21, percentage: '21.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.20, percentage: '20.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '88.4%', change: '+2.7%' },
        { title: 'Average Return', value: '13.5%', change: '+1.9%' },
        { title: 'Risk Score', value: 'Medium', type: 'risk' }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 65, color: '#4ade80' },
        { name: 'Neutral', value: 25, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 78,
      predicted_change: '+9.2%',
      risk_level: 'Medium',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 142.65 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 145.80 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 148.25 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 146.90 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 150.35 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 152.80 }
      ],
      predicted_data: [
        { Date: new Date(2023, 0, 6).getTime(), Close: 152.80 },
        { Date: new Date(2023, 0, 7).getTime(), Close: 155.90 },
        { Date: new Date(2023, 0, 8).getTime(), Close: 159.25 },
        { Date: new Date(2023, 0, 9).getTime(), Close: 162.75 },
        { Date: new Date(2023, 0, 10).getTime(), Close: 166.85 }
      ]
    }
  },
  TSLA: {
    name: "Tesla, Inc.",
    technical: {
      price_trend: "BEARISH",
      key_levels: { support: 198.45, resistance: 254.32 },
      moving_averages: { "50_day": "BELOW", "200_day": "BELOW" }
    },
    fundamental: {
      valuation: "OVERVALUED",
      key_metrics: { pe_ratio_analysis: "75.10", market_cap_assessment: "$780,000,000,000" },
      metrics: {
        market_cap: "$780,000,000,000",
        week_52_high: "$299.29",
        dividend_yield: "-",
        pe_ratio: "75.10",
        week_52_low: "$176.99",
        beta: "2.05"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.30, percentage: '30.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.15, percentage: '15.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.10, percentage: '10.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.11, percentage: '11.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.07, percentage: '7.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '85.6%', change: '+1.9%' },
        { title: 'Average Return', value: '9.7%', change: '+1.2%' },
        { title: 'Risk Score', value: 'High', type: 'risk' }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 55, color: '#4ade80' },
        { name: 'Neutral', value: 30, color: '#60a5fa' },
        { name: 'Negative', value: 15, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 72,
      predicted_change: '-4.5%',
      risk_level: 'High',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 235.45 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 230.80 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 225.35 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 228.90 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 220.45 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 215.75 }
      ],
      predicted_data: [
        { Date: new Date(2023, 0, 6).getTime(), Close: 215.75 },
        { Date: new Date(2023, 0, 7).getTime(), Close: 212.25 },
        { Date: new Date(2023, 0, 8).getTime(), Close: 209.50 },
        { Date: new Date(2023, 0, 9).getTime(), Close: 207.85 },
        { Date: new Date(2023, 0, 10).getTime(), Close: 205.95 }
      ]
    }
  },
  GOOGL: {
    name: "Alphabet Inc.",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 130.25, resistance: 155.80 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "FAIR",
      key_metrics: { pe_ratio_analysis: "28.35", market_cap_assessment: "$1,800,000,000,000" },
      metrics: {
        market_cap: "$1,800,000,000,000",
        week_52_high: "$157.45",
        dividend_yield: "-",
        pe_ratio: "28.35",
        week_52_low: "$103.25",
        beta: "1.05"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.26, percentage: '26.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.17, percentage: '17.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.23, percentage: '23.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.11, percentage: '11.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.10, percentage: '10.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.04, percentage: '4.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '89.0%', change: '+2.5%' },
        { title: 'Average Return', value: '14.2%', change: '+1.7%' },
        { title: 'Risk Score', value: 'Medium', type: 'risk' }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 64, color: '#4ade80' },
        { name: 'Neutral', value: 26, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 82,
      predicted_change: '+6.7%',
      risk_level: 'Low',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 125.89 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 128.45 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 130.12 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 127.90 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 132.50 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 135.75 }
      ],
      predicted_data: [
        { Date: new Date(2023, 0, 6).getTime(), Close: 135.75 },
        { Date: new Date(2023, 0, 7).getTime(), Close: 137.25 },
        { Date: new Date(2023, 0, 8).getTime(), Close: 139.50 },
        { Date: new Date(2023, 0, 9).getTime(), Close: 141.75 },
        { Date: new Date(2023, 0, 10).getTime(), Close: 144.85 }
      ]
    }
  },
  META: {
    name: "Meta Platforms Inc.",
    technical: {
      price_trend: "BULLISH",
      key_levels: {
        support: 315.45,
        resistance: 395.85
      },
      moving_averages: {
        "50_day": "ABOVE",
        "200_day": "ABOVE"
      }
    },
    fundamental: {
      valuation: "FAIR",
      key_metrics: {
        pe_ratio_analysis: "28.15",
        market_cap_assessment: "$890,450,000,000"
      },
      metrics: {
        market_cap: "$890,450,000,000",
        week_52_high: "$396.85",
        dividend_yield: "-",
        pe_ratio: "28.15",
        week_52_low: "$245.75",
        beta: "1.15"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.27, percentage: '27.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.19, percentage: '19.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.13, percentage: '13.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        {
          title: 'Prediction Accuracy',
          value: '86.8%',
          change: '+2.8%'
        },
        {
          title: 'Average Return',
          value: '14.2%',
          change: '+1.8%'
        },
        {
          title: 'Risk Score',
          value: 'Medium',
          type: 'risk'
        }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 62, color: '#4ade80' },
        { name: 'Neutral', value: 28, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 86,
      predicted_change: '+7.8%',
      risk_level: 'Medium',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 315.45 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 320.80 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 325.35 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 328.90 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 332.45 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 335.75 }
      ],
      predicted_data: [
        { Date: new Date(2023, 0, 6).getTime(), Close: 335.75 },
        { Date: new Date(2023, 0, 7).getTime(), Close: 342.25 },
        { Date: new Date(2023, 0, 8).getTime(), Close: 349.50 },
        { Date: new Date(2023, 0, 9).getTime(), Close: 355.85 },
        { Date: new Date(2023, 0, 10).getTime(), Close: 361.95 }
      ]
    }
  },
  NVDA: {
    name: "NVIDIA Corporation",
    technical: {
      price_trend: "BULLISH",
      key_levels: {
        support: 425.75,
        resistance: 505.85
      },
      moving_averages: {
        "50_day": "ABOVE",
        "200_day": "ABOVE"
      }
    },
    fundamental: {
      valuation: "PREMIUM",
      key_metrics: {
        pe_ratio_analysis: "42.85",
        market_cap_assessment: "$1,150,250,000,000"
      },
      metrics: {
        market_cap: "$1,150,250,000,000",
        week_52_high: "$505.48",
        dividend_yield: "0.03%",
        pe_ratio: "42.85",
        week_52_low: "$285.75",
        beta: "1.75"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.30, percentage: '30.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.16, percentage: '16.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.04, percentage: '4.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '88.5%', change: '+3.2%' },
        { title: 'Average Return', value: '18.7%', change: '+2.4%' },
        { title: 'Risk Score', value: 'High', type: 'risk' }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 70, color: '#4ade80' },
        { name: 'Neutral', value: 20, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 89,
      predicted_change: '+9.2%',
      risk_level: 'High',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 425.75 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 435.80 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 445.35 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 452.90 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 462.45 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 475.75 }
      ],
      predicted_data: [
        { Date: new Date(2023, 0, 6).getTime(), Close: 475.75 },
        { Date: new Date(2023, 0, 7).getTime(), Close: 482.25 },
        { Date: new Date(2023, 0, 8).getTime(), Close: 489.50 },
        { Date: new Date(2023, 0, 9).getTime(), Close: 495.85 },
        { Date: new Date(2023, 0, 10).getTime(), Close: 501.95 }
      ]
    }
  },

  JPM: {
    name: "JPMorgan Chase & Co.",
    technical: {
      price_trend: "BULLISH",
      key_levels: {
        support: 142.85,
        resistance: 172.95
      },
      moving_averages: {
        "50_day": "ABOVE",
        "200_day": "ABOVE"
      }
    },
    fundamental: {
      valuation: "FAIR",
      key_metrics: {
        pe_ratio_analysis: "10.85",
        market_cap_assessment: "$475,250,000,000"
      },
      metrics: {
        market_cap: "$475,250,000,000",
        week_52_high: "$172.96",
        dividend_yield: "2.45%",
        pe_ratio: "10.85",
        week_52_low: "$123.11",
        beta: "1.15"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.25, percentage: '25.0%', color: '#86efac' },
        { factor: 'Fundamental', weight: 0.23, percentage: '23.0%', color: '#818cf8' },
        { factor: 'Sentiment', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.04, percentage: '4.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '87.2%', change: '+2.5%' },
        { title: 'Average Return', value: '12.8%', change: '+1.6%' },
        { title: 'Risk Score', value: 'Medium', type: 'risk' }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 58, color: '#4ade80' },
        { name: 'Neutral', value: 32, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 84,
      predicted_change: '+6.5%',
      risk_level: 'Medium',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 142.85 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 145.90 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 148.35 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 151.90 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 154.45 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 157.75 }
      ],
      predicted_data: [
        { Date: new Date(2023, 0, 6).getTime(), Close: 157.75 },
        { Date: new Date(2023, 0, 7).getTime(), Close: 160.25 },
        { Date: new Date(2023, 0, 8).getTime(), Close: 163.50 },
        { Date: new Date(2023, 0, 9).getTime(), Close: 166.85 },
        { Date: new Date(2023, 0, 10).getTime(), Close: 169.95 }
      ]
    }
  },

  JNJ: {
    name: "Johnson & Johnson",
    technical: {
      price_trend: "NEUTRAL",
      key_levels: {
        support: 152.65,
        resistance: 175.95
      },
      moving_averages: {
        "50_day": "ABOVE",
        "200_day": "BELOW"
      }
    },
    fundamental: {
      valuation: "FAIR",
      key_metrics: {
        pe_ratio_analysis: "15.25",
        market_cap_assessment: "$385,750,000,000"
      },
      metrics: {
        market_cap: "$385,750,000,000",
        week_52_high: "$175.97",
        dividend_yield: "2.95%",
        pe_ratio: "15.25",
        week_52_low: "$144.95",
        beta: "0.65"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Fundamental', weight: 0.28, percentage: '28.0%', color: '#86efac' },
        { factor: 'Technical', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
        { factor: 'Sentiment', weight: 0.17, percentage: '17.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.04, percentage: '4.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '85.5%', change: '+1.8%' },
        { title: 'Average Return', value: '8.7%', change: '+1.2%' },
        { title: 'Risk Score', value: 'Low', type: 'risk' }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 55, color: '#4ade80' },
        { name: 'Neutral', value: 35, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 82,
      predicted_change: '+4.8%',
      risk_level: 'Low',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 152.65 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 154.90 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 156.35 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 158.90 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 160.45 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 162.75 }
      ],
      predicted_data: [
        { Date: new Date(2023, 0, 6).getTime(), Close: 162.75 },
        { Date: new Date(2023, 0, 7).getTime(), Close: 164.25 },
        { Date: new Date(2023, 0, 8).getTime(), Close: 166.50 },
        { Date: new Date(2023, 0, 9).getTime(), Close: 168.85 },
        { Date: new Date(2023, 0, 10).getTime(), Close: 170.95 }
      ]
    }
  },

  BRK: {
    name: "Berkshire Hathaway Inc.",
    technical: {
      price_trend: "BULLISH",
      key_levels: {
        support: 345.65,
        resistance: 395.95
      },
      moving_averages: {
        "50_day": "ABOVE",
        "200_day": "ABOVE"
      }
    },
    fundamental: {
      valuation: "FAIR",
      key_metrics: {
        pe_ratio_analysis: "8.95",
        market_cap_assessment: "$785,250,000,000"
      },
      metrics: {
        market_cap: "$785,250,000,000",
        week_52_high: "$395.98",
        dividend_yield: "-",
        pe_ratio: "8.95",
        week_52_low: "$305.75",
        beta: "0.85"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Fundamental', weight: 0.30, percentage: '30.0%', color: '#86efac' },
        { factor: 'Technical', weight: 0.20, percentage: '20.0%', color: '#818cf8' },
        { factor: 'Sentiment', weight: 0.16, percentage: '16.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.04, percentage: '4.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '89.5%', change: '+2.8%' },
        { title: 'Average Return', value: '11.2%', change: '+1.5%' },
        { title: 'Risk Score', value: 'Low', type: 'risk' }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 65, color: '#4ade80' },
        { name: 'Neutral', value: 28, color: '#60a5fa' },
        { name: 'Negative', value: 7, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 88,
      predicted_change: '+5.8%',
      risk_level: 'Low',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 345.65 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 350.90 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 355.35 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 360.90 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 365.45 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 370.75 }
      ],
      predicted_data: [
        { Date: new Date(2023, 0, 6).getTime(), Close: 370.75 },
        { Date: new Date(2023, 0, 7).getTime(), Close: 375.25 },
        { Date: new Date(2023, 0, 8).getTime(), Close: 380.50 },
        { Date: new Date(2023, 0, 9).getTime(), Close: 385.85 },
        { Date: new Date(2023, 0, 10).getTime(), Close: 390.95 }
      ]
    }
  },

  V: {
    name: "Visa Inc.",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 242.85, resistance: 275.95 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "PREMIUM",
      key_metrics: { pe_ratio_analysis: "32.15", market_cap_assessment: "$495,250,000,000" },
      metrics: {
        market_cap: "$495,250,000,000",
        week_52_high: "$275.98",
        dividend_yield: "0.75%",
        pe_ratio: "32.15",
        week_52_low: "$205.75",
        beta: "0.95"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.28, percentage: '28.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.04, percentage: '4.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        {
          title: 'Prediction Accuracy',
          value: '89.2%',
          change: '+3.1%'
        },
        {
          title: 'Average Return',
          value: '15.3%',
          change: '+2.1%'
        },
        {
          title: 'Risk Score',
          value: 'Low',
          type: 'risk'
        }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 65, color: '#4ade80' },
        { name: 'Neutral', value: 25, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 88,
      predicted_change: '+7.2%',
      risk_level: 'Low',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 280 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 285 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 290 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 295 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 300 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 305 }
      ],
      predicted_data: [
        { Date: new Date(2023, 0, 6).getTime(), Close: 305 },
        { Date: new Date(2023, 0, 7).getTime(), Close: 308 },
        { Date: new Date(2023, 0, 8).getTime(), Close: 312 },
        { Date: new Date(2023, 0, 9).getTime(), Close: 315 },
        { Date: new Date(2023, 0, 10).getTime(), Close: 318 }
      ]
    }
  },

  WMT: {
    name: "Walmart Inc.",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 152.85, resistance: 175.95 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "FAIR",
      key_metrics: { pe_ratio_analysis: "25.85", market_cap_assessment: "$425,750,000,000" },
      metrics: {
        market_cap: "$425,750,000,000",
        week_52_high: "$175.98",
        dividend_yield: "1.45%",
        pe_ratio: "25.85",
        week_52_low: "$142.75",
        beta: "0.55"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.28, percentage: '28.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.04, percentage: '4.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        {
          title: 'Prediction Accuracy',
          value: '89.2%',
          change: '+3.1%'
        },
        {
          title: 'Average Return',
          value: '15.3%',
          change: '+2.1%'
        },
        {
          title: 'Risk Score',
          value: 'Low',
          type: 'risk'
        }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 65, color: '#4ade80' },
        { name: 'Neutral', value: 25, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 88,
      predicted_change: '+7.2%',
      risk_level: 'Low',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 280 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 285 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 290 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 295 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 300 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 305 }
      ],
      predicted_data: [
        { Date: new Date(2023, 0, 6).getTime(), Close: 305 },
        { Date: new Date(2023, 0, 7).getTime(), Close: 308 },
        { Date: new Date(2023, 0, 8).getTime(), Close: 312 },
        { Date: new Date(2023, 0, 9).getTime(), Close: 315 },
        { Date: new Date(2023, 0, 10).getTime(), Close: 318 }
      ]
    }
  },

  HD: {
    name: "Home Depot Inc.",
    technical: {
      price_trend: "NEUTRAL",
      key_levels: { support: 295.85, resistance: 345.95 },
      moving_averages: { "50_day": "ABOVE", "200_day": "BELOW" }
    },
    fundamental: {
      valuation: "FAIR",
      key_metrics: { pe_ratio_analysis: "22.45", market_cap_assessment: "$315,750,000,000" },
      metrics: {
        market_cap: "$315,750,000,000",
        week_52_high: "$345.98",
        dividend_yield: "2.55%",
        pe_ratio: "22.45",
        week_52_low: "$275.75",
        beta: "1.05"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.28, percentage: '28.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.04, percentage: '4.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        {
          title: 'Prediction Accuracy',
          value: '89.2%',
          change: '+3.1%'
        },
        {
          title: 'Average Return',
          value: '15.3%',
          change: '+2.1%'
        },
        {
          title: 'Risk Score',
          value: 'Low',
          type: 'risk'
        }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 65, color: '#4ade80' },
        { name: 'Neutral', value: 25, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 88,
      predicted_change: '+7.2%',
      risk_level: 'Low',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 280 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 285 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 290 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 295 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 300 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 305 }
      ],
      predicted_data: [
        { Date: new Date(2023, 0, 6).getTime(), Close: 305 },
        { Date: new Date(2023, 0, 7).getTime(), Close: 308 },
        { Date: new Date(2023, 0, 8).getTime(), Close: 312 },
        { Date: new Date(2023, 0, 9).getTime(), Close: 315 },
        { Date: new Date(2023, 0, 10).getTime(), Close: 318 }
      ]
    }
  },

  RELIANCE: {
    name: "Reliance Industries Limited",
    technical: {
      price_trend: "BULLISH",
      key_levels: {
        support: 2400.50,
        resistance: 2700.75
      },
      moving_averages: {
        "50_day": "ABOVE",
        "200_day": "ABOVE"
      }
    },
    fundamental: {
      valuation: "FAIR",
      key_metrics: {
        pe_ratio_analysis: "25.30",
        market_cap_assessment: "$200,000,000,000"
      },
      metrics: {
        market_cap: "$200,000,000,000",
        week_52_high: "$2750.00",
        dividend_yield: "1.20%",
        pe_ratio: "25.30",
        week_52_low: "$2200.00",
        beta: "1.10"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.30, percentage: '30.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.20, percentage: '20.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.25, percentage: '25.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.10, percentage: '10.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.04, percentage: '4.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.01, percentage: '1.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        {
          title: 'Prediction Accuracy',
          value: '85.0%',
          change: '+2.5%'
        },
        {
          title: 'Average Return',
          value: '12.5%',
          change: '+1.8%'
        },
        {
          title: 'Risk Score',
          value: 'Moderate',
          type: 'risk'
        }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 60, color: '#4ade80' },
        { name: 'Neutral', value: 30, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 85,
      predicted_change: '+6.5%',
      risk_level: 'Moderate',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 2300 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 2350 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 2400 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 2450 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 2500 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 2550 }
      ],
      predicted_data: [
        { Date: new Date(2023, 0, 6).getTime(), Close: 2550 },
        { Date: new Date(2023, 0, 7).getTime(), Close: 2580 },
        { Date: new Date(2023, 0, 8).getTime(), Close: 2620 },
        { Date: new Date(2023, 0, 9).getTime(), Close: 2650 },
        { Date: new Date(2023, 0, 10).getTime(), Close: 2680 }
      ]
    }
  },
  HDFCBANK: {
    name: "HDFC Bank Ltd.",
    technical: {
        price_trend: "BULLISH",
        key_levels: { support: 1450.25, resistance: 1620.50 },
        moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "FAIR",
        key_metrics: { pe_ratio_analysis: "19.8", market_cap_assessment: "₹12,50,000 Cr" },
        metrics: {
            market_cap: "₹12,50,000 Cr",
            week_52_high: "₹1650.00",
            dividend_yield: "1.10%",
            pe_ratio: "19.8",
            week_52_low: "₹1350.00",
            beta: "0.95"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.27, percentage: '27.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.19, percentage: '19.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.23, percentage: '23.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.13, percentage: '13.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '87.5%', change: '+2.8%' },
            { title: 'Average Return', value: '13.2%', change: '+1.9%' },
            { title: 'Risk Score', value: 'Low', type: 'risk' }
        ]
    },
    news_sentiment: {
        distribution: [
            { name: 'Positive', value: 60, color: '#4ade80' },
            { name: 'Neutral', value: 30, color: '#60a5fa' },
            { name: 'Negative', value: 10, color: '#f87171' }
        ]
    },
    predictive: {
        confidence_score: 85,
        predicted_change: '+6.1%',
        risk_level: 'Low',
        historical_data: [
            { Date: new Date(2023, 0, 1).getTime(), Close: 1400 },
            { Date: new Date(2023, 0, 2).getTime(), Close: 1420 },
            { Date: new Date(2023, 0, 3).getTime(), Close: 1440 },
            { Date: new Date(2023, 0, 4).getTime(), Close: 1460 },
            { Date: new Date(2023, 0, 5).getTime(), Close: 1480 },
            { Date: new Date(2023, 0, 6).getTime(), Close: 1500 }
        ],
        predicted_data: [
            { Date: new Date(2023, 0, 6).getTime(), Close: 1500 },
            { Date: new Date(2023, 0, 7).getTime(), Close: 1512 },
            { Date: new Date(2023, 0, 8).getTime(), Close: 1525 },
            { Date: new Date(2023, 0, 9).getTime(), Close: 1538 },
            { Date: new Date(2023, 0, 10).getTime(), Close: 1550 }
        ]
    }
},
TCS: {
    name: "Tata Consultancy Services Ltd.",
    technical: {
        price_trend: "BULLISH",
        key_levels: { support: 3400.00, resistance: 3900.00 },
        moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "PREMIUM",
        key_metrics: { pe_ratio_analysis: "30.1", market_cap_assessment: "₹13,00,000 Cr" },
        metrics: {
            market_cap: "₹13,00,000 Cr",
            week_52_high: "₹3950.00",
            dividend_yield: "1.25%",
            pe_ratio: "30.1",
            week_52_low: "₹3200.00",
            beta: "0.88"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.26, percentage: '26.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.20, percentage: '20.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.14, percentage: '14.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.01, percentage: '1.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '89.0%', change: '+3.0%' },
            { title: 'Average Return', value: '16.1%', change: '+2.3%' },
            { title: 'Risk Score', value: 'Low', type: 'risk' }
        ]
    },
    news_sentiment: {
        distribution: [
            { name: 'Positive', value: 68, color: '#4ade80' },
            { name: 'Neutral', value: 22, color: '#60a5fa' },
            { name: 'Negative', value: 10, color: '#f87171' }
        ]
    },
    predictive: {
        confidence_score: 90,
        predicted_change: '+7.5%',
        risk_level: 'Low',
        historical_data: [
            { Date: new Date(2023, 0, 1).getTime(), Close: 3300 },
            { Date: new Date(2023, 0, 2).getTime(), Close: 3350 },
            { Date: new Date(2023, 0, 3).getTime(), Close: 3400 },
            { Date: new Date(2023, 0, 4).getTime(), Close: 3450 },
            { Date: new Date(2023, 0, 5).getTime(), Close: 3500 },
            { Date: new Date(2023, 0, 6).getTime(), Close: 3550 }
        ],
        predicted_data: [
            { Date: new Date(2023, 0, 6).getTime(), Close: 3550 },
            { Date: new Date(2023, 0, 7).getTime(), Close: 3600 },
            { Date: new Date(2023, 0, 8).getTime(), Close: 3650 },
            { Date: new Date(2023, 0, 9).getTime(), Close: 3700 },
            { Date: new Date(2023, 0, 10).getTime(), Close: 3750 }
        ]
    }
},
INFY: {
    name: "Infosys Ltd.",
    technical: {
        price_trend: "NEUTRAL",
        key_levels: { support: 1450.00, resistance: 1750.00 },
        moving_averages: { "50_day": "BELOW", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "FAIR",
        key_metrics: { pe_ratio_analysis: "27.5", market_cap_assessment: "₹6,00,000 Cr" },
        metrics: {
            market_cap: "₹6,00,000 Cr",
            week_52_high: "₹2000.00",
            dividend_yield: "2.70%",
            pe_ratio: "27.5",
            week_52_low: "₹1300.00",
            beta: "0.90"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.25, percentage: '25.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.24, percentage: '24.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.13, percentage: '13.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '85.7%', change: '+2.5%' },
            { title: 'Average Return', value: '12.8%', change: '+1.7%' },
            { title: 'Risk Score', value: 'Medium', type: 'risk' }
        ]
    },
    news_sentiment: {
        distribution: [
            { name: 'Positive', value: 58, color: '#4ade80' },
            { name: 'Neutral', value: 32, color: '#60a5fa' },
            { name: 'Negative', value: 10, color: '#f87171' }
        ]
    },
    predictive: {
        confidence_score: 82,
        predicted_change: '+4.9%',
        risk_level: 'Medium',
        historical_data: [
    { Date: new Date(2024, 10, 1).getTime(), Close: 1669.10 },
    { Date: new Date(2024, 11, 2).getTime(), Close: 1764.50 },
    { Date: new Date(2024, 12, 3).getTime(), Close: 1682.00 },
    { Date: new Date(2025, 1, 4).getTime(), Close: 1760.80 },
    { Date: new Date(2025, 2, 5).getTime(), Close: 1797.78 },
    { Date: new Date(2025, 3, 6).getTime(), Close: 1442.00 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 1564.00 }
        ],
        predicted_data: [
    { Date: new Date(2025, 4, 15).getTime(), Close: 1564.00 },
    { Date: new Date(2025, 4, 30).getTime(), Close: 1573.72 },
    { Date: new Date(2025, 5, 14).getTime(), Close: 1583.44 },
    { Date: new Date(2025, 5, 29).getTime(), Close: 1593.16 },
    { Date: new Date(2025, 6, 14).getTime(), Close: 1602.88 },
    { Date: new Date(2025, 6, 29).getTime(), Close: 1612.60 },
    { Date: new Date(2025, 7, 14).getTime(), Close: 1622.32 },
    { Date: new Date(2025, 7, 29).getTime(), Close: 1632.04 },
    { Date: new Date(2025, 8, 13).getTime(), Close: 1641.76 },
    { Date: new Date(2025, 8, 28).getTime(), Close: 1651.48 },
    { Date: new Date(2025, 9, 13).getTime(), Close: 1661.20 },
    { Date: new Date(2025, 9, 28).getTime(), Close: 1670.92 },
    { Date: new Date(2025, 10, 12).getTime(), Close: 1680.64 },
    { Date: new Date(2025, 10, 27).getTime(), Close: 1690.36 },
    { Date: new Date(2025, 11, 12).getTime(), Close: 1700.08 },
    { Date: new Date(2025, 11, 27).getTime(), Close: 1709.80 },
    { Date: new Date(2026, 0, 11).getTime(), Close: 1719.52 },
    { Date: new Date(2026, 0, 26).getTime(), Close: 1729.24 },
    { Date: new Date(2026, 1, 10).getTime(), Close: 1738.96 },
    { Date: new Date(2026, 1, 25).getTime(), Close: 1748.68 },
    { Date: new Date(2026, 2, 12).getTime(), Close: 1758.40 },
    { Date: new Date(2026, 2, 27).getTime(), Close: 1768.12 },
    { Date: new Date(2026, 3, 11).getTime(), Close: 1777.84 },
    { Date: new Date(2026, 3, 26).getTime(), Close: 1787.56 },
    { Date: new Date(2026, 4, 11).getTime(), Close: 1797.28 }
        ]
    }
},
ICICIBANK: {
    name: "ICICI Bank Ltd.",
    technical: {
        price_trend: "BULLISH",
        key_levels: { support: 900.00, resistance: 1050.00 },
        moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "FAIR",
        key_metrics: { pe_ratio_analysis: "21.3", market_cap_assessment: "₹7,00,000 Cr" },
        metrics: {
            market_cap: "₹7,00,000 Cr",
            week_52_high: "₹1080.00",
            dividend_yield: "0.85%",
            pe_ratio: "21.3",
            week_52_low: "₹850.00",
            beta: "1.00"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.28, percentage: '28.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.13, percentage: '13.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '86.9%', change: '+2.7%' },
            { title: 'Average Return', value: '13.8%', change: '+2.0%' },
            { title: 'Risk Score', value: 'Low', type: 'risk' }
        ]
    },
    news_sentiment: {
        distribution: [
            { name: 'Positive', value: 63, color: '#4ade80' },
            { name: 'Neutral', value: 27, color: '#60a5fa' },
            { name: 'Negative', value: 10, color: '#f87171' }
        ]
    },
    predictive: {
        confidence_score: 84,
        predicted_change: '+5.5%',
        risk_level: 'Low',
        historical_data: [
            { Date: new Date(2023, 0, 1).getTime(), Close: 870 },
            { Date: new Date(2023, 0, 2).getTime(), Close: 890 },
            { Date: new Date(2023, 0, 3).getTime(), Close: 910 },
            { Date: new Date(2023, 0, 4).getTime(), Close: 930 },
            { Date: new Date(2023, 0, 5).getTime(), Close: 950 },
            { Date: new Date(2023, 0, 6).getTime(), Close: 970 }
        ],
        predicted_data: [
            { Date: new Date(2023, 0, 6).getTime(), Close: 970 },
            { Date: new Date(2023, 0, 7).getTime(), Close: 980 },
            { Date: new Date(2023, 0, 8).getTime(), Close: 990 },
            { Date: new Date(2023, 0, 9).getTime(), Close: 1000 },
            { Date: new Date(2023, 0, 10).getTime(), Close: 1010 }
        ]
    }
},
SBIN: {
    name: "State Bank of India",
    technical: {
        price_trend: "BULLISH",
        key_levels: { support: 520.00, resistance: 650.00 },
        moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "FAIR",
        key_metrics: { pe_ratio_analysis: "13.7", market_cap_assessment: "₹5,00,000 Cr" },
        metrics: {
            market_cap: "₹5,00,000 Cr",
            week_52_high: "₹670.00",
            dividend_yield: "1.80%",
            pe_ratio: "13.7",
            week_52_low: "₹480.00",
            beta: "1.10"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.30, percentage: '30.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.16, percentage: '16.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.21, percentage: '21.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.13, percentage: '13.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '84.8%', change: '+2.2%' },
            { title: 'Average Return', value: '11.9%', change: '+1.5%' },
            { title: 'Risk Score', value: 'Medium', type: 'risk' }
        ]
    },
    news_sentiment: {
        distribution: [
            { name: 'Positive', value: 55, color: '#4ade80' },
            { name: 'Neutral', value: 35, color: '#60a5fa' },
            { name: 'Negative', value: 10, color: '#f87171' }
        ]
    },
    predictive: {
        confidence_score: 80,
        predicted_change: '+4.2%',
        risk_level: 'Medium',
        historical_data: [
            { Date: new Date(2023, 0, 1).getTime(), Close: 500 },
            { Date: new Date(2023, 0, 2).getTime(), Close: 510 },
            { Date: new Date(2023, 0, 3).getTime(), Close: 520 },
            { Date: new Date(2023, 0, 4).getTime(), Close: 530 },
            { Date: new Date(2023, 0, 5).getTime(), Close: 540 },
            { Date: new Date(2023, 0, 6).getTime(), Close: 550 }
        ],
        predicted_data: [
            { Date: new Date(2023, 0, 6).getTime(), Close: 550 },
            { Date: new Date(2023, 0, 7).getTime(), Close: 555 },
            { Date: new Date(2023, 0, 8).getTime(), Close: 560 },
            { Date: new Date(2023, 0, 9).getTime(), Close: 565 },
            { Date: new Date(2023, 0, 10).getTime(), Close: 570 }
        ]
    }
},
BHARTIARTL: {
    name: "Bharti Airtel Ltd.",
    technical: {
        price_trend: "BULLISH",
        key_levels: { support: 800.00, resistance: 1050.00 },
        moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "PREMIUM",
        key_metrics: { pe_ratio_analysis: "60.2", market_cap_assessment: "₹6,00,000 Cr" },
        metrics: {
            market_cap: "₹6,00,000 Cr",
            week_52_high: "₹1100.00",
            dividend_yield: "0.45%",
            pe_ratio: "60.2",
            week_52_low: "₹750.00",
            beta: "0.98"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.28, percentage: '28.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.17, percentage: '17.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.23, percentage: '23.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.13, percentage: '13.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.01, percentage: '1.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '88.3%', change: '+3.2%' },
            { title: 'Average Return', value: '15.0%', change: '+2.2%' },
            { title: 'Risk Score', value: 'Low', type: 'risk' }
        ]
    },
    news_sentiment: {
        distribution: [
            { name: 'Positive', value: 66, color: '#4ade80' },
            { name: 'Neutral', value: 24, color: '#60a5fa' },
            { name: 'Negative', value: 10, color: '#f87171' }
        ]
    },
    predictive: {
        confidence_score: 87,
        predicted_change: '+6.7%',
        risk_level: 'Low',
        historical_data: [
            { Date: new Date(2023, 0, 1).getTime(), Close: 820 },
            { Date: new Date(2023, 0, 2).getTime(), Close: 840 },
            { Date: new Date(2023, 0, 3).getTime(), Close: 860 },
            { Date: new Date(2023, 0, 4).getTime(), Close: 880 },
            { Date: new Date(2023, 0, 5).getTime(), Close: 900 },
            { Date: new Date(2023, 0, 6).getTime(), Close: 920 }
        ],
        predicted_data: [
            { Date: new Date(2023, 0, 6).getTime(), Close: 920 },
            { Date: new Date(2023, 0, 7).getTime(), Close: 935 },
            { Date: new Date(2023, 0, 8).getTime(), Close: 950 },
            { Date: new Date(2023, 0, 9).getTime(), Close: 965 },
            { Date: new Date(2023, 0, 10).getTime(), Close: 980 }
        ]
    }
},
HINDUNILVR: {
    name: "Hindustan Unilever Ltd.",
    technical: {
        price_trend: "NEUTRAL",
        key_levels: { support: 2200.00, resistance: 2600.00 },
        moving_averages: { "50_day": "BELOW", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "PREMIUM",
        key_metrics: { pe_ratio_analysis: "55.0", market_cap_assessment: "₹6,00,000 Cr" },
        metrics: {
            market_cap: "₹6,00,000 Cr",
            week_52_high: "₹2650.00",
            dividend_yield: "1.30%",
            pe_ratio: "55.0",
            week_52_low: "₹2100.00",
            beta: "0.75"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.24, percentage: '24.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.19, percentage: '19.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.25, percentage: '25.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.14, percentage: '14.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.01, percentage: '1.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '83.9%', change: '+2.0%' },
            { title: 'Average Return', value: '10.7%', change: '+1.2%' },
            { title: 'Risk Score', value: 'Low', type: 'risk' }
        ]
    },
    news_sentiment: {
        distribution: [
            { name: 'Positive', value: 54, color: '#4ade80' },
            { name: 'Neutral', value: 36, color: '#60a5fa' },
            { name: 'Negative', value: 10, color: '#f87171' }
        ]
    },
    predictive: {
        confidence_score: 78,
        predicted_change: '+3.8%',
        risk_level: 'Low',
        historical_data: [
            { Date: new Date(2023, 0, 1).getTime(), Close: 2250 },
            { Date: new Date(2023, 0, 2).getTime(), Close: 2270 },
            { Date: new Date(2023, 0, 3).getTime(), Close: 2290 },
            { Date: new Date(2023, 0, 4).getTime(), Close: 2310 },
            { Date: new Date(2023, 0, 5).getTime(), Close: 2330 },
            { Date: new Date(2023, 0, 6).getTime(), Close: 2350 }
        ],
        predicted_data: [
            { Date: new Date(2023, 0, 6).getTime(), Close: 2350 },
            { Date: new Date(2023, 0, 7).getTime(), Close: 2360 },
            { Date: new Date(2023, 0, 8).getTime(), Close: 2370 },
            { Date: new Date(2023, 0, 9).getTime(), Close: 2380 },
            { Date: new Date(2023, 0, 10).getTime(), Close: 2390 }
        ]
    }
},
KOTAKBANK: {
    name: "Kotak Mahindra Bank Ltd.",
    technical: {
        price_trend: "BEARISH",
        key_levels: { support: 1600.00, resistance: 1900.00 },
        moving_averages: { "50_day": "BELOW", "200_day": "BELOW" }
    },
    fundamental: {
        valuation: "DISCOUNT",
        key_metrics: { pe_ratio_analysis: "18.5", market_cap_assessment: "₹3,50,000 Cr" },
        metrics: {
            market_cap: "₹3,50,000 Cr",
            week_52_high: "₹2000.00",
            dividend_yield: "0.10%",
            pe_ratio: "18.5",
            week_52_low: "₹1550.00",
            beta: "0.85"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.22, percentage: '22.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.20, percentage: '20.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.26, percentage: '26.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.15, percentage: '15.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.01, percentage: '1.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '81.5%', change: '+1.8%' },
            { title: 'Average Return', value: '9.2%', change: '+0.9%' },
            { title: 'Risk Score', value: 'Medium', type: 'risk' }
        ]
    },
    news_sentiment: {
        distribution: [
            { name: 'Positive', value: 48, color: '#4ade80' },
            { name: 'Neutral', value: 42, color: '#60a5fa' },
            { name: 'Negative', value: 10, color: '#f87171' }
        ]
    },
    predictive: {
        confidence_score: 75,
        predicted_change: '+2.7%',
        risk_level: 'Medium',
        historical_data: [
            { Date: new Date(2023, 0, 1).getTime(), Close: 1700 },
            { Date: new Date(2023, 0, 2).getTime(), Close: 1680 },
            { Date: new Date(2023, 0, 3).getTime(), Close: 1660 },
            { Date: new Date(2023, 0, 4).getTime(), Close: 1640 },
            { Date: new Date(2023, 0, 5).getTime(), Close: 1620 },
            { Date: new Date(2023, 0, 6).getTime(), Close: 1600 }
        ],
        predicted_data: [
            { Date: new Date(2023, 0, 6).getTime(), Close: 1600 },
            { Date: new Date(2023, 0, 7).getTime(), Close: 1610 },
            { Date: new Date(2023, 0, 8).getTime(), Close: 1620 },
            { Date: new Date(2023, 0, 9).getTime(), Close: 1630 },
            { Date: new Date(2023, 0, 10).getTime(), Close: 1640 }
        ]
    }
},
ITC: {
    name: "ITC Ltd.",
    technical: {
        price_trend: "BULLISH",
        key_levels: { support: 400.00, resistance: 480.00 },
        moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "FAIR",
        key_metrics: { pe_ratio_analysis: "28.0", market_cap_assessment: "₹5,00,000 Cr" },
        metrics: {
            market_cap: "₹5,00,000 Cr",
            week_52_high: "₹485.00",
            dividend_yield: "3.50%",
            pe_ratio: "28.0",
            week_52_low: "₹390.00",
            beta: "0.70"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.27, percentage: '27.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.23, percentage: '23.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.13, percentage: '13.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.01, percentage: '1.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '86.2%', change: '+2.6%' },
            { title: 'Average Return', value: '12.5%', change: '+1.8%' },
            { title: 'Risk Score', value: 'Low', type: 'risk' }
        ]
    },
    news_sentiment: {
        distribution: [
            { name: 'Positive', value: 59, color: '#4ade80' },
            { name: 'Neutral', value: 31, color: '#60a5fa' },
            { name: 'Negative', value: 10, color: '#f87171' }
        ]
    },
    predictive: {
        confidence_score: 83,
        predicted_change: '+5.1%',
        risk_level: 'Low',
        historical_data: [
            { Date: new Date(2023, 0, 1).getTime(), Close: 410 },
            { Date: new Date(2023, 0, 2).getTime(), Close: 420 },
            { Date: new Date(2023, 0, 3).getTime(), Close: 430 },
            { Date: new Date(2023, 0, 4).getTime(), Close: 440 },
            { Date: new Date(2023, 0, 5).getTime(), Close: 450 },
            { Date: new Date(2023, 0, 6).getTime(), Close: 460 }
        ],
        predicted_data: [
            { Date: new Date(2023, 0, 6).getTime(), Close: 460 },
            { Date: new Date(2023, 0, 7).getTime(), Close: 465 },
            { Date: new Date(2023, 0, 8).getTime(), Close: 470 },
            { Date: new Date(2023, 0, 9).getTime(), Close: 475 },
            { Date: new Date(2023, 0, 10).getTime(), Close: 480 }
        ]
    }
}
};
