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
        { Date: new Date(2025, 4, 15).getTime(), Close: 305 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 308 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 312 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 316 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 320 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 324 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 328 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 332 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 336 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 340 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 344 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 348 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 352 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 356 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 360 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 364 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 368 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 372 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 376 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 380 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 384 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 388 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 392 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 396 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 400 }
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
    { Date: new Date(2025, 3, 6).getTime(), Close: 212.50 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 211.01 }
  ],
      predicted_data: [
    { Date: new Date(2025, 4, 15).getTime(), Close: 211.01 },
    { Date: new Date(2025, 4, 30).getTime(), Close: 212.51 },
    { Date: new Date(2025, 5, 14).getTime(), Close: 214.01 },
    { Date: new Date(2025, 5, 29).getTime(), Close: 215.51 },
    { Date: new Date(2025, 6, 14).getTime(), Close: 217.01 },
    { Date: new Date(2025, 6, 29).getTime(), Close: 218.51 },
    { Date: new Date(2025, 7, 14).getTime(), Close: 220.01 },
    { Date: new Date(2025, 7, 29).getTime(), Close: 221.51 },
    { Date: new Date(2025, 8, 13).getTime(), Close: 223.01 },
    { Date: new Date(2025, 8, 28).getTime(), Close: 224.51 },
    { Date: new Date(2025, 9, 13).getTime(), Close: 226.01 },
    { Date: new Date(2025, 9, 28).getTime(), Close: 227.51 },
    { Date: new Date(2025, 10, 12).getTime(), Close: 229.01 },
    { Date: new Date(2025, 10, 27).getTime(), Close: 230.51 },
    { Date: new Date(2025, 11, 12).getTime(), Close: 232.01 },
    { Date: new Date(2025, 11, 27).getTime(), Close: 233.51 },
    { Date: new Date(2026, 0, 11).getTime(), Close: 235.01 },
    { Date: new Date(2026, 0, 26).getTime(), Close: 236.51 },
    { Date: new Date(2026, 1, 10).getTime(), Close: 238.01 },
    { Date: new Date(2026, 1, 25).getTime(), Close: 239.51 },
    { Date: new Date(2026, 2, 12).getTime(), Close: 241.01 },
    { Date: new Date(2026, 2, 27).getTime(), Close: 242.51 },
    { Date: new Date(2026, 3, 11).getTime(), Close: 244.01 },
    { Date: new Date(2026, 3, 26).getTime(), Close: 245.51 },
    { Date: new Date(2026, 4, 11).getTime(), Close: 247.01 }
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
        { Date: new Date(2025, 4, 15).getTime(), Close: 120 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 123 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 126 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 129 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 132 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 135 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 138 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 141 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 144 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 147 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 150 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 153 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 156 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 159 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 162 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 165 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 168 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 171 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 174 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 177 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 180 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 183 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 186 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 189 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 192 }
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
        { Date: new Date(2025, 4, 15).getTime(), Close: 700 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 710 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 720 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 730 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 740 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 750 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 760 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 770 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 780 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 790 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 800 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 810 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 820 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 830 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 840 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 850 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 860 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 870 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 880 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 890 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 900 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 910 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 920 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 930 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 940 }
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
        { Date: new Date(2025, 4, 15).getTime(), Close: 140 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 142 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 145 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 148 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 151 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 154 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 157 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 160 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 163 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 166 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 169 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 172 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 175 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 178 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 181 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 184 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 187 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 190 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 193 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 196 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 199 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 202 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 205 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 208 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 211 }
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
        { Date: new Date(2025, 4, 15).getTime(), Close: 350 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 355 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 360 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 365 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 370 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 375 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 380 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 385 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 390 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 395 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 400 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 405 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 410 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 415 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 420 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 425 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 430 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 435 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 440 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 445 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 450 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 455 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 460 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 465 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 470 }
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
        { Date: new Date(2025, 4, 15).getTime(), Close: 900 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 915 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 930 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 945 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 960 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 975 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 990 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 1005 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 1020 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 1035 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 1050 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 1065 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 1080 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 1095 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 1110 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 1125 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 1140 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 1155 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 1170 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 1185 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 1200 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 1215 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 1230 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 1245 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 1260 }
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
        { Date: new Date(2025, 4, 15).getTime(), Close: 160 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 162 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 165 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 168 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 171 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 174 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 177 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 180 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 183 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 186 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 189 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 192 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 195 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 198 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 201 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 204 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 207 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 210 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 213 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 216 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 219 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 222 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 225 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 228 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 231 }
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
        { Date: new Date(2025, 4, 15).getTime(), Close: 160 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 162 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 164 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 166 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 168 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 170 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 172 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 174 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 176 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 178 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 180 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 182 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 184 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 186 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 188 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 190 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 192 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 194 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 196 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 198 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 200 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 202 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 204 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 206 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 208 }
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
    { Date: new Date(2024, 10, 1).getTime(), Close: 1343.80 },
    { Date: new Date(2024, 11, 2).getTime(), Close: 1316.45 },
    { Date: new Date(2024, 12, 3).getTime(), Close: 1285.00 },
    { Date: new Date(2025, 1, 4).getTime(), Close: 1300.00 },
    { Date: new Date(2025, 2, 5).getTime(), Close: 1308.00 },
    { Date: new Date(2025, 3, 6).getTime(), Close: 1356.00 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 1424.40 }
      ],
      predicted_data: [
    { Date: new Date(2025, 4, 15).getTime(), Close: 1424.40 },
    { Date: new Date(2025, 4, 30).getTime(), Close: 1439.59 },
    { Date: new Date(2025, 5, 14).getTime(), Close: 1454.78 },
    { Date: new Date(2025, 5, 29).getTime(), Close: 1469.97 },
    { Date: new Date(2025, 6, 14).getTime(), Close: 1485.16 },
    { Date: new Date(2025, 6, 29).getTime(), Close: 1500.35 },
    { Date: new Date(2025, 7, 14).getTime(), Close: 1515.54 },
    { Date: new Date(2025, 7, 29).getTime(), Close: 1530.73 },
    { Date: new Date(2025, 8, 13).getTime(), Close: 1545.92 },
    { Date: new Date(2025, 8, 28).getTime(), Close: 1561.11 },
    { Date: new Date(2025, 9, 13).getTime(), Close: 1576.30 },
    { Date: new Date(2025, 9, 28).getTime(), Close: 1591.49 },
    { Date: new Date(2025, 10, 12).getTime(), Close: 1606.68 },
    { Date: new Date(2025, 10, 27).getTime(), Close: 1621.87 },
    { Date: new Date(2025, 11, 12).getTime(), Close: 1637.06 },
    { Date: new Date(2025, 11, 27).getTime(), Close: 1652.25 },
    { Date: new Date(2026, 0, 11).getTime(), Close: 1667.44 },
    { Date: new Date(2026, 0, 26).getTime(), Close: 1682.63 },
    { Date: new Date(2026, 1, 10).getTime(), Close: 1697.82 },
    { Date: new Date(2026, 1, 25).getTime(), Close: 1713.01 },
    { Date: new Date(2026, 2, 12).getTime(), Close: 1728.20 },
    { Date: new Date(2026, 2, 27).getTime(), Close: 1743.39 },
    { Date: new Date(2026, 3, 11).getTime(), Close: 1758.58 },
    { Date: new Date(2026, 3, 26).getTime(), Close: 1773.77 },
    { Date: new Date(2026, 4, 11).getTime(), Close: 1788.96 }
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
    { Date: new Date(2024, 10, 1).getTime(), Close: 1808.40 },
    { Date: new Date(2024, 11, 2).getTime(), Close: 1870.00 },
    { Date: new Date(2024, 12, 3).getTime(), Close: 1857.00 },
    { Date: new Date(2025, 1, 4).getTime(), Close: 1855.85 },
    { Date: new Date(2025, 2, 5).getTime(), Close: 1891.80 },
    { Date: new Date(2025, 3, 6).getTime(), Close: 1900.95 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 1920.25 }
        ],
        predicted_data: [
    { Date: new Date(2025, 4, 15).getTime(), Close: 1920.25 },
    { Date: new Date(2025, 4, 30).getTime(), Close: 1933.90 },
    { Date: new Date(2025, 5, 14).getTime(), Close: 1947.55 },
    { Date: new Date(2025, 5, 29).getTime(), Close: 1961.20 },
    { Date: new Date(2025, 6, 14).getTime(), Close: 1974.85 },
    { Date: new Date(2025, 6, 29).getTime(), Close: 1988.50 },
    { Date: new Date(2025, 7, 14).getTime(), Close: 2002.15 },
    { Date: new Date(2025, 7, 29).getTime(), Close: 2015.80 },
    { Date: new Date(2025, 8, 13).getTime(), Close: 2029.45 },
    { Date: new Date(2025, 8, 28).getTime(), Close: 2043.10 },
    { Date: new Date(2025, 9, 13).getTime(), Close: 2056.75 },
    { Date: new Date(2025, 9, 28).getTime(), Close: 2070.40 },
    { Date: new Date(2025, 10, 12).getTime(), Close: 2084.05 },
    { Date: new Date(2025, 10, 27).getTime(), Close: 2097.70 },
    { Date: new Date(2025, 11, 12).getTime(), Close: 2111.35 },
    { Date: new Date(2025, 11, 27).getTime(), Close: 2125.00 },
    { Date: new Date(2026, 0, 11).getTime(), Close: 2138.65 },
    { Date: new Date(2026, 0, 26).getTime(), Close: 2152.30 },
    { Date: new Date(2026, 1, 10).getTime(), Close: 2165.95 },
    { Date: new Date(2026, 1, 25).getTime(), Close: 2179.60 },
    { Date: new Date(2026, 2, 12).getTime(), Close: 2193.25 },
    { Date: new Date(2026, 2, 27).getTime(), Close: 2206.90 },
    { Date: new Date(2026, 3, 11).getTime(), Close: 2220.55 },
    { Date: new Date(2026, 3, 26).getTime(), Close: 2234.20 },
    { Date: new Date(2026, 4, 11).getTime(), Close: 2247.85 }
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
            week_52_high: "₹4592.00",
            dividend_yield: "1.25%",
            pe_ratio: "30.1",
            week_52_low: "₹3056.00",
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
    { Date: new Date(2024, 10, 1).getTime(), Close: 4244.40 },
    { Date: new Date(2024, 11, 2).getTime(), Close: 4150.05 },
    { Date: new Date(2024, 12, 3).getTime(), Close: 4077.35 },
    { Date: new Date(2025, 1, 4).getTime(), Close: 3910.00 },
    { Date: new Date(2025, 2, 5).getTime(), Close: 3560.05 },
    { Date: new Date(2025, 3, 6).getTime(), Close: 3499.05 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 3483.30 }
        ],
        predicted_data: [
            { Date: new Date(2025, 4, 15).getTime(), Close: 3485 },
            { Date: new Date(2025, 4, 15).getTime(), Close: 3550 },
            { Date: new Date(2025, 4, 30).getTime(), Close: 3570 },
            { Date: new Date(2025, 5, 14).getTime(), Close: 3590 },
            { Date: new Date(2025, 5, 29).getTime(), Close: 3610 },
            { Date: new Date(2025, 6, 14).getTime(), Close: 3632 },
            { Date: new Date(2025, 6, 29).getTime(), Close: 3655 },
            { Date: new Date(2025, 7, 14).getTime(), Close: 3678 },
            { Date: new Date(2025, 7, 29).getTime(), Close: 3700 },
            { Date: new Date(2025, 8, 13).getTime(), Close: 3722 },
            { Date: new Date(2025, 8, 28).getTime(), Close: 3745 },
            { Date: new Date(2025, 9, 13).getTime(), Close: 3768 },
            { Date: new Date(2025, 9, 28).getTime(), Close: 3790 },
            { Date: new Date(2025, 10, 12).getTime(), Close: 3812 },
            { Date: new Date(2025, 10, 27).getTime(), Close: 3835 },
            { Date: new Date(2025, 11, 12).getTime(), Close: 3858 },
            { Date: new Date(2025, 11, 27).getTime(), Close: 3880 },
            { Date: new Date(2026, 0, 11).getTime(), Close: 3902 },
            { Date: new Date(2026, 0, 26).getTime(), Close: 3925 },
            { Date: new Date(2026, 1, 10).getTime(), Close: 3948 },
            { Date: new Date(2026, 1, 25).getTime(), Close: 3970 },
            { Date: new Date(2026, 2, 12).getTime(), Close: 3992 },
            { Date: new Date(2026, 2, 27).getTime(), Close: 4015 },
            { Date: new Date(2026, 3, 11).getTime(), Close: 4038 },
            { Date: new Date(2026, 3, 26).getTime(), Close: 4060 },
            { Date: new Date(2026, 4, 11).getTime(), Close: 4082 }
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
    { Date: new Date(2026, 4, 11).getTime(), Close: 1797.28 },
    { Date: new Date(2026, 4, 26).getTime(), Close: 1807.00 },
    { Date: new Date(2026, 5, 11).getTime(), Close: 1816.72 },
        ]
    }
},
ICICIBANK: {
    name: "ICICI Bank Ltd.",
    technical: {
        price_trend: "BULLISH",
        key_levels: { support: 1347.00, resistance: 1600.00 },
        moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "FAIR",
        key_metrics: { pe_ratio_analysis: "21.3", market_cap_assessment: "₹10,28,000 Cr" },
        metrics: {
            market_cap: "₹7,00,000 Cr",
            week_52_high: "₹1459.00",
            dividend_yield: "-",
            pe_ratio: "21.3",
            week_52_low: "₹1051.00",
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
            { name: 'Positive', value: 70, color: '#4ade80' },
            { name: 'Neutral', value: 20, color: '#60a5fa' },
            { name: 'Negative', value: 10, color: '#f87171' }
        ]
    },
    predictive: {
        confidence_score: 84,
        predicted_change: '+5.5%',
        risk_level: 'Low',
        historical_data: [
    { Date: new Date(2024, 10, 1).getTime(), Close: 1292.83 },
    { Date: new Date(2024, 11, 2).getTime(), Close: 1311.65 },
    { Date: new Date(2024, 12, 3).getTime(), Close: 1343.00 },
    { Date: new Date(2025, 1, 4).getTime(), Close: 1360.00 },
    { Date: new Date(2025, 2, 5).getTime(), Close: 1427.00 },
    { Date: new Date(2025, 3, 6).getTime(), Close: 1436.00 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 1454.00 }
        ],
        predicted_data: [
    { Date: new Date(2025, 4, 15).getTime(), Close: 1454.00 },
    { Date: new Date(2025, 4, 30).getTime(), Close: 1460.59 },
    { Date: new Date(2025, 5, 14).getTime(), Close: 1467.18 },
    { Date: new Date(2025, 5, 29).getTime(), Close: 1473.77 },
    { Date: new Date(2025, 6, 14).getTime(), Close: 1480.36 },
    { Date: new Date(2025, 6, 29).getTime(), Close: 1486.95 },
    { Date: new Date(2025, 7, 14).getTime(), Close: 1493.54 },
    { Date: new Date(2025, 7, 29).getTime(), Close: 1500.13 },
    { Date: new Date(2025, 8, 13).getTime(), Close: 1506.72 },
    { Date: new Date(2025, 8, 28).getTime(), Close: 1513.31 },
    { Date: new Date(2025, 9, 13).getTime(), Close: 1519.90 },
    { Date: new Date(2025, 9, 28).getTime(), Close: 1526.49 },
    { Date: new Date(2025, 10, 12).getTime(), Close: 1533.08 },
    { Date: new Date(2025, 10, 27).getTime(), Close: 1539.67 },
    { Date: new Date(2025, 11, 12).getTime(), Close: 1546.26 },
    { Date: new Date(2025, 11, 27).getTime(), Close: 1552.85 },
    { Date: new Date(2026, 0, 11).getTime(), Close: 1559.44 },
    { Date: new Date(2026, 0, 26).getTime(), Close: 1566.03 },
    { Date: new Date(2026, 1, 10).getTime(), Close: 1572.62 },
    { Date: new Date(2026, 1, 25).getTime(), Close: 1579.21 },
    { Date: new Date(2026, 2, 12).getTime(), Close: 1585.80 },
    { Date: new Date(2026, 2, 27).getTime(), Close: 1592.39 },
    { Date: new Date(2026, 3, 11).getTime(), Close: 1598.98 },
    { Date: new Date(2026, 3, 26).getTime(), Close: 1605.57 },
    { Date: new Date(2026, 4, 11).getTime(), Close: 1612.16 }
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
    { Date: new Date(2024, 10, 1).getTime(), Close: 476.95 },
    { Date: new Date(2024, 11, 2).getTime(), Close: 478.05 },
    { Date: new Date(2024, 12, 3).getTime(), Close: 472.00 },
    { Date: new Date(2025, 1, 4).getTime(), Close: 466.00 },
    { Date: new Date(2025, 2, 5).getTime(), Close: 450.00 },
    { Date: new Date(2025, 3, 6).getTime(), Close: 390.15 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 429.10 }
        ],
        predicted_data: [
    { Date: new Date(2025, 4, 15).getTime(), Close: 429.10 },
    { Date: new Date(2025, 4, 30).getTime(), Close: 432.55 },
    { Date: new Date(2025, 5, 14).getTime(), Close: 436.00 },
    { Date: new Date(2025, 5, 29).getTime(), Close: 439.45 },
    { Date: new Date(2025, 6, 14).getTime(), Close: 442.90 },
    { Date: new Date(2025, 6, 29).getTime(), Close: 446.35 },
    { Date: new Date(2025, 7, 14).getTime(), Close: 449.80 },
    { Date: new Date(2025, 7, 29).getTime(), Close: 453.25 },
    { Date: new Date(2025, 8, 13).getTime(), Close: 456.70 },
    { Date: new Date(2025, 8, 28).getTime(), Close: 460.15 },
    { Date: new Date(2025, 9, 13).getTime(), Close: 463.60 },
    { Date: new Date(2025, 9, 28).getTime(), Close: 467.05 },
    { Date: new Date(2025, 10, 12).getTime(), Close: 470.50 },
    { Date: new Date(2025, 10, 27).getTime(), Close: 473.95 },
    { Date: new Date(2025, 11, 12).getTime(), Close: 477.40 },
    { Date: new Date(2025, 11, 27).getTime(), Close: 480.85 },
    { Date: new Date(2026, 0, 11).getTime(), Close: 484.30 },
    { Date: new Date(2026, 0, 26).getTime(), Close: 487.75 },
    { Date: new Date(2026, 1, 10).getTime(), Close: 491.20 },
    { Date: new Date(2026, 1, 25).getTime(), Close: 494.65 },
    { Date: new Date(2026, 2, 12).getTime(), Close: 498.10 },
    { Date: new Date(2026, 2, 27).getTime(), Close: 501.55 },
    { Date: new Date(2026, 3, 11).getTime(), Close: 505.00 },
    { Date: new Date(2026, 3, 26).getTime(), Close: 508.45 },
    { Date: new Date(2026, 4, 11).getTime(), Close: 511.90 }
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
    { Date: new Date(2024, 10, 1).getTime(), Close: 1746.90 },
    { Date: new Date(2024, 11, 2).getTime(), Close: 1763.15 },
    { Date: new Date(2024, 12, 3).getTime(), Close: 1770.00 },
    { Date: new Date(2025, 1, 4).getTime(), Close: 1941.90 },
    { Date: new Date(2025, 2, 5).getTime(), Close: 1993.10 },
    { Date: new Date(2025, 3, 6).getTime(), Close: 2301.90 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 2092.40 }
        ],
        predicted_data: [
    { Date: new Date(2025, 4, 15).getTime(), Close: 2092.40 },
    { Date: new Date(2025, 4, 30).getTime(), Close: 2092.12 },
    { Date: new Date(2025, 5, 14).getTime(), Close: 2091.84 },
    { Date: new Date(2025, 5, 29).getTime(), Close: 2091.56 },
    { Date: new Date(2025, 6, 14).getTime(), Close: 2091.28 },
    { Date: new Date(2025, 6, 29).getTime(), Close: 2091.00 },
    { Date: new Date(2025, 7, 14).getTime(), Close: 2090.72 },
    { Date: new Date(2025, 7, 29).getTime(), Close: 2090.44 },
    { Date: new Date(2025, 8, 13).getTime(), Close: 2090.16 },
    { Date: new Date(2025, 8, 28).getTime(), Close: 2089.88 },
    { Date: new Date(2025, 9, 13).getTime(), Close: 2089.60 },
    { Date: new Date(2025, 9, 28).getTime(), Close: 2089.32 },
    { Date: new Date(2025, 10, 12).getTime(), Close: 2089.04 },
    { Date: new Date(2025, 10, 27).getTime(), Close: 2088.76 },
    { Date: new Date(2025, 11, 12).getTime(), Close: 2088.48 },
    { Date: new Date(2025, 11, 27).getTime(), Close: 2088.20 },
    { Date: new Date(2026, 0, 11).getTime(), Close: 2087.92 },
    { Date: new Date(2026, 0, 26).getTime(), Close: 2087.64 },
    { Date: new Date(2026, 1, 10).getTime(), Close: 2087.36 },
    { Date: new Date(2026, 1, 25).getTime(), Close: 2087.08 },
    { Date: new Date(2026, 2, 12).getTime(), Close: 2086.80 },
    { Date: new Date(2026, 2, 27).getTime(), Close: 2086.52 },
    { Date: new Date(2026, 3, 11).getTime(), Close: 2086.24 },
    { Date: new Date(2026, 3, 26).getTime(), Close: 2085.96 },
    { Date: new Date(2026, 4, 11).getTime(), Close: 2085.63 }
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
        confidence_score: 88,
        predicted_change: '+3.8%',
        risk_level: 'Low',
        historical_data: [
    { Date: new Date(2024, 10, 1).getTime(), Close: 2524.80 },
    { Date: new Date(2024, 11, 2).getTime(), Close: 2514.85 },
    { Date: new Date(2024, 12, 3).getTime(), Close: 2494.00 },
    { Date: new Date(2025, 1, 4).getTime(), Close: 2260.20 },
    { Date: new Date(2025, 2, 5).getTime(), Close: 2341.90 },
    { Date: new Date(2025, 3, 6).getTime(), Close: 2425.00 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 2360.00 }
        ],
        predicted_data: [
    { Date: new Date(2025, 4, 15).getTime(), Close: 2360.00 },
    { Date: new Date(2025, 4, 30).getTime(), Close: 2390.23 },
    { Date: new Date(2025, 5, 14).getTime(), Close: 2420.46 },
    { Date: new Date(2025, 5, 29).getTime(), Close: 2450.69 },
    { Date: new Date(2025, 6, 14).getTime(), Close: 2480.92 },
    { Date: new Date(2025, 6, 29).getTime(), Close: 2511.15 },
    { Date: new Date(2025, 7, 14).getTime(), Close: 2541.38 },
    { Date: new Date(2025, 7, 29).getTime(), Close: 2571.61 },
    { Date: new Date(2025, 8, 13).getTime(), Close: 2601.84 },
    { Date: new Date(2025, 8, 28).getTime(), Close: 2632.07 },
    { Date: new Date(2025, 9, 13).getTime(), Close: 2662.30 },
    { Date: new Date(2025, 9, 28).getTime(), Close: 2692.53 },
    { Date: new Date(2025, 10, 12).getTime(), Close: 2722.76 },
    { Date: new Date(2025, 10, 27).getTime(), Close: 2752.99 },
    { Date: new Date(2025, 11, 12).getTime(), Close: 2783.22 },
    { Date: new Date(2025, 11, 27).getTime(), Close: 2813.45 },
    { Date: new Date(2026, 0, 11).getTime(), Close: 2843.68 },
    { Date: new Date(2026, 0, 26).getTime(), Close: 2873.91 },
    { Date: new Date(2026, 1, 10).getTime(), Close: 2904.14 },
    { Date: new Date(2026, 1, 25).getTime(), Close: 2934.37 },
    { Date: new Date(2026, 2, 12).getTime(), Close: 2964.60 },
    { Date: new Date(2026, 2, 27).getTime(), Close: 2994.83 },
    { Date: new Date(2026, 3, 11).getTime(), Close: 3025.06 },
    { Date: new Date(2026, 3, 26).getTime(), Close: 3055.29 },
    { Date: new Date(2026, 4, 11).getTime(), Close: 3085.52 }
        ]
    }
},
  BHARTIARTL: {
    name: "Bharti Airtel Limited",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 900.00, resistance: 1100.00 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "OVERVALUED",
      key_metrics: { pe_ratio_analysis: "32.5", market_cap_assessment: "₹10,90,000 Cr" },
      metrics: {
        market_cap: "₹10,90,000 Cr",
        week_52_high: "₹1917.00",
        dividend_yield: "-",
        pe_ratio: "32.5",
        week_52_low: "₹1219.00",
        beta: "1.00"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.28, percentage: '28.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.20, percentage: '20.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.21, percentage: '21.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.11, percentage: '11.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '86.5%', change: '+2.7%' },
        { title: 'Average Return', value: '14.8%', change: '+2.0%' },
        { title: 'Risk Score', value: 'Medium', type: 'risk' }
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
      confidence_score: 85,
      predicted_change: '+7.9%',
      risk_level: 'Medium',
      historical_data: [
    { Date: new Date(2024, 10, 1).getTime(), Close: 1627.15 },
    { Date: new Date(2024, 11, 2).getTime(), Close: 1587.75 },
    { Date: new Date(2024, 12, 3).getTime(), Close: 1626.30 },
    { Date: new Date(2025, 1, 4).getTime(), Close: 1570.20 },
    { Date: new Date(2025, 2, 5).getTime(), Close: 1733.40 },
    { Date: new Date(2025, 3, 6).getTime(), Close: 1717.90 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 1834.20 }
      ],
      predicted_data: [
    { Date: new Date(2025, 4, 15).getTime(), Close: 1834.20 },
    { Date: new Date(2025, 4, 30).getTime(), Close: 1848.75 },
    { Date: new Date(2025, 5, 14).getTime(), Close: 1863.30 },
    { Date: new Date(2025, 5, 29).getTime(), Close: 1877.85 },
    { Date: new Date(2025, 6, 14).getTime(), Close: 1892.40 },
    { Date: new Date(2025, 6, 29).getTime(), Close: 1906.95 },
    { Date: new Date(2025, 7, 14).getTime(), Close: 1921.50 },
    { Date: new Date(2025, 7, 29).getTime(), Close: 1936.05 },
    { Date: new Date(2025, 8, 13).getTime(), Close: 1950.60 },
    { Date: new Date(2025, 8, 28).getTime(), Close: 1965.15 },
    { Date: new Date(2025, 9, 13).getTime(), Close: 1979.70 },
    { Date: new Date(2025, 9, 28).getTime(), Close: 1994.25 },
    { Date: new Date(2025, 10, 12).getTime(), Close: 2008.80 },
    { Date: new Date(2025, 10, 27).getTime(), Close: 2023.35 },
    { Date: new Date(2025, 11, 12).getTime(), Close: 2037.90 },
    { Date: new Date(2025, 11, 27).getTime(), Close: 2052.45 },
    { Date: new Date(2026, 0, 11).getTime(), Close: 2067.00 },
    { Date: new Date(2026, 0, 26).getTime(), Close: 2081.55 },
    { Date: new Date(2026, 1, 10).getTime(), Close: 2096.10 },
    { Date: new Date(2026, 1, 25).getTime(), Close: 2110.65 },
    { Date: new Date(2026, 2, 12).getTime(), Close: 2125.20 },
    { Date: new Date(2026, 2, 27).getTime(), Close: 2139.75 },
    { Date: new Date(2026, 3, 11).getTime(), Close: 2154.30 },
    { Date: new Date(2026, 3, 26).getTime(), Close: 2168.85 },
    { Date: new Date(2026, 4, 11).getTime(), Close: 2183.34 }
      ]
    }
  },
SBIN: {
    name: "State Bank of India",
    technical: {
        price_trend: "BULLISH",
        key_levels: { support: 720.00, resistance: 800.00 },
        moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "FAIR",
        key_metrics: { pe_ratio_analysis: "9.7", market_cap_assessment: "₹7,00,000 Cr" },
        metrics: {
            market_cap: "₹7,00,000 Cr",
            week_52_high: "₹912.00",
            dividend_yield: "2.02%",
            pe_ratio: "9.7",
            week_52_low: "₹680.00",
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
    { Date: new Date(2024, 10, 1).getTime(), Close: 802.30 },
    { Date: new Date(2024, 11, 2).getTime(), Close: 744.80 },
    { Date: new Date(2024, 12, 3).getTime(), Close: 750.00 },
    { Date: new Date(2025, 1, 4).getTime(), Close: 799.80 },
    { Date: new Date(2025, 2, 5).getTime(), Close: 779.25 },
    { Date: new Date(2025, 3, 6).getTime(), Close: 786.05 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 785.35 }
        ],
        predicted_data: [
    { Date: new Date(2025, 4, 15).getTime(), Close: 785.35 },
    { Date: new Date(2025, 4, 30).getTime(), Close: 791.93 },
    { Date: new Date(2025, 5, 14).getTime(), Close: 798.51 },
    { Date: new Date(2025, 5, 29).getTime(), Close: 805.09 },
    { Date: new Date(2025, 6, 14).getTime(), Close: 811.67 },
    { Date: new Date(2025, 6, 29).getTime(), Close: 818.25 },
    { Date: new Date(2025, 7, 14).getTime(), Close: 824.83 },
    { Date: new Date(2025, 7, 29).getTime(), Close: 831.41 },
    { Date: new Date(2025, 8, 13).getTime(), Close: 837.99 },
    { Date: new Date(2025, 8, 28).getTime(), Close: 844.57 },
    { Date: new Date(2025, 9, 13).getTime(), Close: 851.15 },
    { Date: new Date(2025, 9, 28).getTime(), Close: 857.73 },
    { Date: new Date(2025, 10, 12).getTime(), Close: 864.31 },
    { Date: new Date(2025, 10, 27).getTime(), Close: 870.89 },
    { Date: new Date(2025, 11, 12).getTime(), Close: 877.47 },
    { Date: new Date(2025, 11, 27).getTime(), Close: 884.05 },
    { Date: new Date(2026, 0, 11).getTime(), Close: 890.63 },
    { Date: new Date(2026, 0, 26).getTime(), Close: 897.21 },
    { Date: new Date(2026, 1, 10).getTime(), Close: 903.79 },
    { Date: new Date(2026, 1, 25).getTime(), Close: 910.37 },
    { Date: new Date(2026, 2, 12).getTime(), Close: 916.95 },
    { Date: new Date(2026, 2, 27).getTime(), Close: 923.53 },
    { Date: new Date(2026, 3, 11).getTime(), Close: 930.11 },
    { Date: new Date(2026, 3, 26).getTime(), Close: 936.69 },
    { Date: new Date(2026, 4, 11).getTime(), Close: 943.27 }      
        ]
    }
},
MRF: {
    name: "Madras Rubber Factory",
    technical: {
        price_trend: "BULLISH",
        key_levels: { support: 115000.00, resistance: 132000.00 },
        moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "PREMIUM",
        key_metrics: { pe_ratio_analysis: "30.5", market_cap_assessment: "₹56,000 Cr" },
        metrics: {
            market_cap: "₹56,000 Cr",
            week_52_high: "₹132,500.00",
            dividend_yield: "0.13%",
            pe_ratio: "30.5",
            week_52_low: "₹105,500.00",
            beta: "0.65"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.29, percentage: '29.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.23, percentage: '23.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.01, percentage: '1.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '88.1%', change: '+2.6%' },
            { title: 'Average Return', value: '14.2%', change: '+1.9%' },
            { title: 'Risk Score', value: 'Low', type: 'risk' }
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
        confidence_score: 87,
        predicted_change: '+6.8%',
        risk_level: 'Low',
        historical_data: [
    { Date: new Date(2024, 10, 1).getTime(), Close: 119000.00 },
    { Date: new Date(2024, 11, 2).getTime(), Close: 116162.46 },
    { Date: new Date(2024, 12, 3).getTime(), Close: 104650.00 },
    { Date: new Date(2025, 1, 4).getTime(), Close: 108000.00 },
    { Date: new Date(2025, 2, 5).getTime(), Close: 123990.00 },
    { Date: new Date(2025, 3, 6).getTime(), Close: 127680.00 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 142400.00 }
        ],
        predicted_data: [
              { Date: new Date(2025, 4, 15).getTime(), Close: 142400.00 },
    { Date: new Date(2025, 4, 30).getTime(), Close: 143100.65 },
    { Date: new Date(2025, 5, 14).getTime(), Close: 143801.30 },
    { Date: new Date(2025, 5, 29).getTime(), Close: 144501.95 },
    { Date: new Date(2025, 6, 14).getTime(), Close: 145202.60 },
    { Date: new Date(2025, 6, 29).getTime(), Close: 145903.25 },
    { Date: new Date(2025, 7, 14).getTime(), Close: 146603.90 },
    { Date: new Date(2025, 7, 29).getTime(), Close: 147304.55 },
    { Date: new Date(2025, 8, 13).getTime(), Close: 148005.20 },
    { Date: new Date(2025, 8, 28).getTime(), Close: 148705.85 },
    { Date: new Date(2025, 9, 13).getTime(), Close: 149406.50 },
    { Date: new Date(2025, 9, 28).getTime(), Close: 150107.15 },
    { Date: new Date(2025, 10, 12).getTime(), Close: 150807.80 },
    { Date: new Date(2025, 10, 27).getTime(), Close: 151508.45 },
    { Date: new Date(2025, 11, 12).getTime(), Close: 152209.10 },
    { Date: new Date(2025, 11, 27).getTime(), Close: 152909.75 },
    { Date: new Date(2026, 0, 11).getTime(), Close: 153610.40 },
    { Date: new Date(2026, 0, 26).getTime(), Close: 154311.05 },
    { Date: new Date(2026, 1, 10).getTime(), Close: 155011.70 },
    { Date: new Date(2026, 1, 25).getTime(), Close: 155712.35 },
    { Date: new Date(2026, 2, 12).getTime(), Close: 156413.00 },
    { Date: new Date(2026, 2, 27).getTime(), Close: 157113.65 },
    { Date: new Date(2026, 3, 11).getTime(), Close: 157814.30 },
    { Date: new Date(2026, 3, 26).getTime(), Close: 158514.95 },
    { Date: new Date(2026, 4, 11).getTime(), Close: 159215.60 }
        ]
    }
},
ADANIENT: {
    name: "Adani Enterprises Ltd.",
    technical: {
        price_trend: "BULLISH",
        key_levels: { support: 2850.00, resistance: 3400.00 },
        moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "FAIR",
        key_metrics: { pe_ratio_analysis: "38.5", market_cap_assessment: "₹3,20,000 Cr" },
        metrics: {
            market_cap: "₹3,20,000 Cr",
            week_52_high: "₹3,494.75",
            dividend_yield: "0.07%",
            pe_ratio: "138.5",
            week_52_low: "₹2,200.00",
            beta: "1.25"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.27, percentage: '27.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.19, percentage: '19.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.23, percentage: '23.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.13, percentage: '13.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.01, percentage: '1.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '84.2%', change: '+2.1%' },
            { title: 'Average Return', value: '15.1%', change: '+1.7%' },
            { title: 'Risk Score', value: 'High', type: 'risk' }
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
        confidence_score: 78,
        predicted_change: '+8.2%',
        risk_level: 'High',
        historical_data: [
    { Date: new Date(2024, 10, 1).getTime(), Close: 2800.00 },
    { Date: new Date(2024, 11, 2).getTime(), Close: 2496.25 },
    { Date: new Date(2024, 12, 3).getTime(), Close: 2412.80 },
    { Date: new Date(2025, 1, 4).getTime(), Close: 2450.00 },
    { Date: new Date(2025, 2, 5).getTime(), Close: 2467.70 },
    { Date: new Date(2025, 3, 6).getTime(), Close: 2481.00 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 2493.80 }
        ],
        predicted_data: [
    { Date: new Date(2025, 4, 15).getTime(), Close: 2493.80 },
    { Date: new Date(2025, 4, 30).getTime(), Close: 2557.83 },
    { Date: new Date(2025, 5, 14).getTime(), Close: 2621.86 },
    { Date: new Date(2025, 5, 29).getTime(), Close: 2685.89 },
    { Date: new Date(2025, 6, 14).getTime(), Close: 2749.92 },
    { Date: new Date(2025, 6, 29).getTime(), Close: 2813.95 },
    { Date: new Date(2025, 7, 14).getTime(), Close: 2877.98 },
    { Date: new Date(2025, 7, 29).getTime(), Close: 2942.01 },
    { Date: new Date(2025, 8, 13).getTime(), Close: 3006.04 },
    { Date: new Date(2025, 8, 28).getTime(), Close: 3070.07 },
    { Date: new Date(2025, 9, 13).getTime(), Close: 3134.10 },
    { Date: new Date(2025, 9, 28).getTime(), Close: 3198.13 },
    { Date: new Date(2025, 10, 12).getTime(), Close: 3262.16 },
    { Date: new Date(2025, 10, 27).getTime(), Close: 3326.19 },
    { Date: new Date(2025, 11, 12).getTime(), Close: 3390.22 },
    { Date: new Date(2025, 11, 27).getTime(), Close: 3454.25 },
    { Date: new Date(2026, 0, 11).getTime(), Close: 3518.28 },
    { Date: new Date(2026, 0, 26).getTime(), Close: 3582.31 },
    { Date: new Date(2026, 1, 10).getTime(), Close: 3646.34 },
    { Date: new Date(2026, 1, 25).getTime(), Close: 3710.37 },
    { Date: new Date(2026, 2, 12).getTime(), Close: 3774.40 },
    { Date: new Date(2026, 2, 27).getTime(), Close: 3838.43 },
    { Date: new Date(2026, 3, 11).getTime(), Close: 3902.46 },
    { Date: new Date(2026, 3, 26).getTime(), Close: 3966.49 },
    { Date: new Date(2026, 4, 11).getTime(), Close: 4030.52 }
        ]
    }
},
TATASTEEL: {
    name: "Tata Steel Ltd.",
    technical: {
        price_trend: "BULLISH",
        key_levels: { support: 140.00, resistance: 170.00 },
        moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "FAIR",
        key_metrics: { pe_ratio_analysis: "17.2", market_cap_assessment: "₹1,70,000 Cr" },
        metrics: {
            market_cap: "₹1,70,000 Cr",
            week_52_high: "₹172.80",
            dividend_yield: "3.10%",
            pe_ratio: "57.2",
            week_52_low: "₹108.00",
            beta: "1.20"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.28, percentage: '28.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.13, percentage: '13.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.01, percentage: '1.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '83.5%', change: '+2.0%' },
            { title: 'Average Return', value: '11.2%', change: '+1.3%' },
            { title: 'Risk Score', value: 'Medium', type: 'risk' }
        ]
    },
    news_sentiment: {
        distribution: [
            { name: 'Positive', value: 56, color: '#4ade80' },
            { name: 'Neutral', value: 34, color: '#60a5fa' },
            { name: 'Negative', value: 10, color: '#f87171' }
        ]
    },
    predictive: {
        confidence_score: 79,
        predicted_change: '+5.6%',
        risk_level: 'Medium',
        historical_data: [
            { Date: new Date(2024, 10, 1).getTime(), Close: 120.50 },
            { Date: new Date(2024, 11, 2).getTime(), Close: 128.40 },
            { Date: new Date(2024, 12, 3).getTime(), Close: 135.10 },
            { Date: new Date(2025, 1, 4).getTime(), Close: 142.00 },
            { Date: new Date(2025, 2, 5).getTime(), Close: 148.20 },
            { Date: new Date(2025, 3, 6).getTime(), Close: 153.80 },
            { Date: new Date(2025, 4, 15).getTime(), Close: 158.60 }
        ],
        predicted_data: [
            { Date: new Date(2025, 4, 15).getTime(), Close: 158.60 },
            { Date: new Date(2025, 4, 30).getTime(), Close: 160.10 },
            { Date: new Date(2025, 5, 14).getTime(), Close: 161.60 },
            { Date: new Date(2025, 5, 29).getTime(), Close: 163.10 },
            { Date: new Date(2025, 6, 14).getTime(), Close: 164.60 },
            { Date: new Date(2025, 6, 29).getTime(), Close: 166.10 },
            { Date: new Date(2025, 7, 14).getTime(), Close: 167.60 },
            { Date: new Date(2025, 7, 29).getTime(), Close: 169.10 },
            { Date: new Date(2025, 8, 13).getTime(), Close: 170.60 },
            { Date: new Date(2025, 8, 28).getTime(), Close: 172.10 },
            { Date: new Date(2025, 9, 13).getTime(), Close: 173.60 },
            { Date: new Date(2025, 9, 28).getTime(), Close: 175.10 },
            { Date: new Date(2025, 10, 12).getTime(), Close: 176.60 },
            { Date: new Date(2025, 10, 27).getTime(), Close: 178.10 },
            { Date: new Date(2025, 11, 12).getTime(), Close: 179.60 },
            { Date: new Date(2025, 11, 27).getTime(), Close: 181.10 },
            { Date: new Date(2026, 0, 11).getTime(), Close: 182.60 },
            { Date: new Date(2026, 0, 26).getTime(), Close: 184.10 },
            { Date: new Date(2026, 1, 10).getTime(), Close: 185.60 },
            { Date: new Date(2026, 1, 25).getTime(), Close: 187.10 },
            { Date: new Date(2026, 2, 12).getTime(), Close: 188.60 },
            { Date: new Date(2026, 2, 27).getTime(), Close: 190.10 },
            { Date: new Date(2026, 3, 11).getTime(), Close: 191.60 },
            { Date: new Date(2026, 3, 26).getTime(), Close: 193.10 },
            { Date: new Date(2026, 4, 11).getTime(), Close: 194.60 }
        ]
    }
},
ELECON: {
    name: "Elecon Engineering Company Ltd.",
    technical: {
        price_trend: "BULLISH",
        key_levels: { support: 1_200, resistance: 1_600 },
        moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "FAIR",
        key_metrics: { pe_ratio_analysis: "55.5", market_cap_assessment: "₹13,500 Cr" },
        metrics: {
            market_cap: "₹13,500 Cr",
            week_52_high: "₹739.00",
            dividend_yield: "0.21%",
            pe_ratio: "35.5",
            week_52_low: "₹340.00",
            beta: "0.85"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.29, percentage: '29.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.23, percentage: '23.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.01, percentage: '1.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '84.7%', change: '+2.4%' },
            { title: 'Average Return', value: '18.2%', change: '+2.2%' },
            { title: 'Risk Score', value: 'Medium', type: 'risk' }
        ]
    },
    news_sentiment: {
        distribution: [
            { name: 'Positive', value: 61, color: '#4ade80' },
            { name: 'Neutral', value: 29, color: '#60a5fa' },
            { name: 'Negative', value: 10, color: '#f87171' }
        ]
    },
    predictive: {
        confidence_score: 81,
        predicted_change: '+7.1%',
        risk_level: 'Medium',
        historical_data: [
    { Date: new Date(2024, 10, 1).getTime(), Close: 566.40 },
    { Date: new Date(2024, 11, 2).getTime(), Close: 545.10 },
    { Date: new Date(2024, 12, 3).getTime(), Close: 520.15 },
    { Date: new Date(2025, 1, 4).getTime(), Close: 459.85 },
    { Date: new Date(2025, 2, 5).getTime(), Close: 416.60 },
    { Date: new Date(2025, 3, 6).getTime(), Close: 573.90 },
    { Date: new Date(2025, 4, 15).getTime(), Close: 679.80 }
        ],
        predicted_data: [
    { Date: new Date(2025, 4, 15).getTime(), Close: 679.80 },
    { Date: new Date(2025, 4, 30).getTime(), Close: 691.06 },
    { Date: new Date(2025, 5, 14).getTime(), Close: 702.32 },
    { Date: new Date(2025, 5, 29).getTime(), Close: 713.58 },
    { Date: new Date(2025, 6, 14).getTime(), Close: 724.84 },
    { Date: new Date(2025, 6, 29).getTime(), Close: 736.10 },
    { Date: new Date(2025, 7, 14).getTime(), Close: 747.36 },
    { Date: new Date(2025, 7, 29).getTime(), Close: 758.62 },
    { Date: new Date(2025, 8, 13).getTime(), Close: 769.88 },
    { Date: new Date(2025, 8, 28).getTime(), Close: 781.14 },
    { Date: new Date(2025, 9, 13).getTime(), Close: 792.40 },
    { Date: new Date(2025, 9, 28).getTime(), Close: 803.66 },
    { Date: new Date(2025, 10, 12).getTime(), Close: 814.92 },
    { Date: new Date(2025, 10, 27).getTime(), Close: 826.18 },
    { Date: new Date(2025, 11, 12).getTime(), Close: 837.44 },
    { Date: new Date(2025, 11, 27).getTime(), Close: 848.70 },
    { Date: new Date(2026, 0, 11).getTime(), Close: 859.96 },
    { Date: new Date(2026, 0, 26).getTime(), Close: 871.22 },
    { Date: new Date(2026, 1, 10).getTime(), Close: 882.48 },
    { Date: new Date(2026, 1, 25).getTime(), Close: 893.74 },
    { Date: new Date(2026, 2, 12).getTime(), Close: 905.00 },
    { Date: new Date(2026, 2, 27).getTime(), Close: 916.26 },
    { Date: new Date(2026, 3, 11).getTime(), Close: 927.52 },
    { Date: new Date(2026, 3, 26).getTime(), Close: 938.78 },
    { Date: new Date(2026, 4, 11).getTime(), Close: 950.04 }
        ]
    }
},

};