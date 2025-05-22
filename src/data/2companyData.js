export const COMPANY_DATA = {
  // Existing data for AAPL, MSFT, GOOGL, AMZN, META, TSLA, NVDA, JPM, WMT, HD, RELIANCE, TCS, HDFCBANK, ICICIBANK, etc. remains unchanged
  // Adding new mock data for stocks not already present in the file

  AXISBANK: {
    name: "Axis Bank Ltd.",
    technical: {
        price_trend: "BULLISH",
        key_levels: { support: 850.00, resistance: 980.00 },
        moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
        valuation: "FAIR",
        key_metrics: { pe_ratio_analysis: "22.7", market_cap_assessment: "₹3,00,000 Cr" },
        metrics: {
            market_cap: "₹3,00,000 Cr",
            week_52_high: "₹1000.00",
            dividend_yield: "0.75%",
            pe_ratio: "22.7",
            week_52_low: "₹800.00",
            beta: "1.10"
        }
    },
    ai_insights: {
        feature_importance: [
            { factor: 'Technical', weight: 0.27, percentage: '27.0%', color: '#86efac' },
            { factor: 'Sentiment', weight: 0.19, percentage: '19.0%', color: '#818cf8' },
            { factor: 'Fundamental', weight: 0.23, percentage: '23.0%', color: '#818cf8' },
            { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
            { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
            { factor: 'Volatility', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
            { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
            { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
        ]
    },
    performance: {
        metrics: [
            { title: 'Prediction Accuracy', value: '86.3%', change: '+2.4%' },
            { title: 'Average Return', value: '12.5%', change: '+1.8%' },
            { title: 'Risk Score', value: 'Medium', type: 'risk' }
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
        confidence_score: 83,
        predicted_change: '+5.8%',
        risk_level: 'Medium',
        historical_data: [
            { Date: new Date(2023, 0, 1).getTime(), Close: 820 },
            { Date: new Date(2023, 0, 2).getTime(), Close: 840 },
            { Date: new Date(2023, 0, 3).getTime(), Close: 860 },
            { Date: new Date(2023, 0, 4).getTime(), Close: 880 },
            { Date: new Date(2023, 0, 5).getTime(), Close: 900 },
            { Date: new Date(2023, 0, 6).getTime(), Close: 920 }
        ],
        predicted_data: [
            { Date: new Date(2025, 4, 15).getTime(), Close: 920 },
            { Date: new Date(2025, 4, 30).getTime(), Close: 930 },
            { Date: new Date(2025, 5, 14).getTime(), Close: 940 },
            { Date: new Date(2025, 5, 29).getTime(), Close: 950 },
            { Date: new Date(2025, 6, 14).getTime(), Close: 962 },
            { Date: new Date(2025, 6, 29).getTime(), Close: 975 },
            { Date: new Date(2025, 7, 14).getTime(), Close: 988 },
            { Date: new Date(2025, 7, 29).getTime(), Close: 1000 },
            { Date: new Date(2025, 8, 13).getTime(), Close: 1012 },
            { Date: new Date(2025, 8, 28).getTime(), Close: 1025 },
            { Date: new Date(2025, 9, 13).getTime(), Close: 1038 },
            { Date: new Date(2025, 9, 28).getTime(), Close: 1050 },
            { Date: new Date(2025, 10, 12).getTime(), Close: 1062 },
            { Date: new Date(2025, 10, 27).getTime(), Close: 1075 },
            { Date: new Date(2025, 11, 12).getTime(), Close: 1088 },
            { Date: new Date(2025, 11, 27).getTime(), Close: 1100 },
            { Date: new Date(2026, 0, 11).getTime(), Close: 1112 },
            { Date: new Date(2026, 0, 26).getTime(), Close: 1125 },
            { Date: new Date(2026, 1, 10).getTime(), Close: 1138 },
            { Date: new Date(2026, 1, 25).getTime(), Close: 1150 },
            { Date: new Date(2026, 2, 12).getTime(), Close: 1162 },
            { Date: new Date(2026, 2, 27).getTime(), Close: 1175 },
            { Date: new Date(2026, 3, 11).getTime(), Close: 1188 },
            { Date: new Date(2026, 3, 26).getTime(), Close: 1200 },
            { Date: new Date(2026, 4, 11).getTime(), Close: 1212 }
        ]
    }
  },
  V: {
    name: "Visa Inc.",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 220.50, resistance: 250.75 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "PREMIUM",
      key_metrics: { pe_ratio_analysis: "30.5", market_cap_assessment: "$500,000,000,000" },
      metrics: {
        market_cap: "$500,000,000,000",
        week_52_high: "$255.00",
        dividend_yield: "0.80%",
        pe_ratio: "30.5",
        week_52_low: "$210.00",
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
        { title: 'Prediction Accuracy', value: '88.5%', change: '+2.9%' },
        { title: 'Average Return', value: '14.7%', change: '+2.0%' },
        { title: 'Risk Score', value: 'Low', type: 'risk' }
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
      confidence_score: 87,
      predicted_change: '+6.8%',
      risk_level: 'Low',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 210 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 215 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 220 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 225 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 230 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 235 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 235 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 238 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 241 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 244 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 247 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 250 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 253 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 256 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 259 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 262 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 265 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 268 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 271 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 274 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 277 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 280 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 283 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 286 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 289 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 292 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 295 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 298 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 301 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 304 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 307 }
      ]
    }
  },
  JNJ: {
    name: "Johnson & Johnson",
    technical: {
      price_trend: "NEUTRAL",
      key_levels: { support: 145.00, resistance: 165.00 },
      moving_averages: { "50_day": "ABOVE", "200_day": "BELOW" }
    },
    fundamental: {
      valuation: "FAIR",
      key_metrics: { pe_ratio_analysis: "20.3", market_cap_assessment: "$400,000,000,000" },
      metrics: {
        market_cap: "$400,000,000,000",
        week_52_high: "$170.00",
        dividend_yield: "2.90%",
        pe_ratio: "20.3",
        week_52_low: "$140.00",
        beta: "0.60"
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
        { title: 'Average Return', value: '10.8%', change: '+1.5%' },
        { title: 'Risk Score', value: 'Low', type: 'risk' }
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
      predicted_change: '+4.5%',
      risk_level: 'Low',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 150 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 152 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 154 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 156 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 158 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 160 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 160 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 161 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 162 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 163 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 164 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 165 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 166 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 167 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 168 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 169 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 170 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 171 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 172 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 173 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 174 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 175 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 176 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 177 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 178 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 179 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 180 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 181 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 182 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 183 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 184 }
      ]
    }
  },
  BAC: {
    name: "Bank of America Corporation",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 30.50, resistance: 38.75 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "FAIR",
      key_metrics: { pe_ratio_analysis: "12.8", market_cap_assessment: "$300,000,000,000" },
      metrics: {
        market_cap: "$300,000,000,000",
        week_52_high: "$40.00",
        dividend_yield: "2.50%",
        pe_ratio: "12.8",
        week_52_low: "$28.00",
        beta: "1.20"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.26, percentage: '26.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.19, percentage: '19.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.23, percentage: '23.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '86.4%', change: '+2.3%' },
        { title: 'Average Return', value: '11.9%', change: '+1.6%' },
        { title: 'Risk Score', value: 'Medium', type: 'risk' }
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
      confidence_score: 83,
      predicted_change: '+5.7%',
      risk_level: 'Medium',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 32 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 33 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 34 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 35 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 36 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 37 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 37 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 37.5 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 38 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 38.5 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 39 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 39.5 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 40 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 40.5 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 41 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 41.5 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 42 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 42.5 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 43 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 43.5 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 44 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 44.5 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 45 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 45.5 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 46 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 46.5 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 47 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 47.5 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 48 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 48.5 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 49 }
      ]
    }
  },
  PG: {
    name: "Procter & Gamble Company",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 140.00, resistance: 160.00 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "PREMIUM",
      key_metrics: { pe_ratio_analysis: "25.6", market_cap_assessment: "$380,000,000,000" },
      metrics: {
        market_cap: "$380,000,000,000",
        week_52_high: "$165.00",
        dividend_yield: "2.40%",
        pe_ratio: "25.6",
        week_52_low: "$135.00",
        beta: "0.45"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.27, percentage: '27.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.23, percentage: '23.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.13, percentage: '13.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.04, percentage: '4.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '87.9%', change: '+2.6%' },
        { title: 'Average Return', value: '13.4%', change: '+1.8%' },
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
      confidence_score: 86,
      predicted_change: '+6.2%',
      risk_level: 'Low',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 142 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 144 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 146 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 148 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 150 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 152 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 152 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 153 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 154 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 155 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 156 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 157 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 158 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 159 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 160 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 161 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 162 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 163 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 164 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 165 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 166 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 167 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 168 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 169 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 170 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 171 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 172 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 173 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 174 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 175 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 176 }
      ]
    }
  },
  MA: {
    name: "Mastercard Incorporated",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 380.00, resistance: 420.00 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "PREMIUM",
      key_metrics: { pe_ratio_analysis: "35.2", market_cap_assessment: "$400,000,000,000" },
      metrics: {
        market_cap: "$400,000,000,000",
        week_52_high: "$430.00",
        dividend_yield: "0.60%",
        pe_ratio: "35.2",
        week_52_low: "$360.00",
        beta: "1.05"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.29, percentage: '29.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.17, percentage: '17.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '88.2%', change: '+3.0%' },
        { title: 'Average Return', value: '15.1%', change: '+2.2%' },
        { title: 'Risk Score', value: 'Medium', type: 'risk' }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 67, color: '#4ade80' },
        { name: 'Neutral', value: 23, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 89,
      predicted_change: '+7.3%',
      risk_level: 'Medium',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 370 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 375 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 380 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 385 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 390 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 395 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 395 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 398 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 401 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 404 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 407 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 410 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 413 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 416 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 419 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 422 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 425 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 428 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 431 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 434 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 437 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 440 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 443 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 446 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 449 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 452 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 455 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 458 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 461 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 464 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 467 }
      ]
    }
  },
  UNH: {
    name: "UnitedHealth Group Incorporated",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 480.00, resistance: 540.00 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "PREMIUM",
      key_metrics: { pe_ratio_analysis: "22.8", market_cap_assessment: "$500,000,000,000" },
      metrics: {
        market_cap: "$500,000,000,000",
        week_52_high: "$550.00",
        dividend_yield: "1.40%",
        pe_ratio: "22.8",
        week_52_low: "$450.00",
        beta: "0.80"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.26, percentage: '26.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.19, percentage: '19.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.23, percentage: '23.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.13, percentage: '13.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '87.6%', change: '+2.8%' },
        { title: 'Average Return', value: '14.0%', change: '+1.9%' },
        { title: 'Risk Score', value: 'Low', type: 'risk' }
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
      confidence_score: 85,
      predicted_change: '+6.5%',
      risk_level: 'Low',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 460 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 470 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 480 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 490 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 500 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 510 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 510 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 515 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 520 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 525 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 530 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 535 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 540 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 545 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 550 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 555 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 560 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 565 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 570 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 575 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 580 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 585 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 590 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 595 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 600 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 605 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 610 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 615 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 620 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 625 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 630 }
      ]
    }
  },
  PFE: {
    name: "Pfizer Inc.",
    technical: {
      price_trend: "BEARISH",
      key_levels: { support: 25.00, resistance: 30.00 },
      moving_averages: { "50_day": "BELOW", "200_day": "BELOW" }
    },
    fundamental: {
      valuation: "FAIR",
      key_metrics: { pe_ratio_analysis: "15.4", market_cap_assessment: "$160,000,000,000" },
      metrics: {
        market_cap: "$160,000,000,000",
        week_52_high: "$35.00",
        dividend_yield: "5.00%",
        pe_ratio: "15.4",
        week_52_low: "$24.00",
        beta: "0.70"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.24, percentage: '24.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.20, percentage: '20.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.10, percentage: '10.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.04, percentage: '4.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '84.5%', change: '+2.1%' },
        { title: 'Average Return', value: '8.7%', change: '+1.2%' },
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
      predicted_change: '-2.5%',
      risk_level: 'Medium',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 30 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 29.5 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 29 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 28.5 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 28 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 27.5 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 27.5 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 27.2 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 26.9 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 26.6 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 26.3 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 26 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 25.7 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 25.4 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 25.1 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 24.8 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 24.5 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 24.2 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 23.9 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 23.6 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 23.3 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 23 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 22.7 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 22.4 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 22.1 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 21.8 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 21.5 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 21.2 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 20.9 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 20.6 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 20.3 }
      ]
    }
  },
  CVX: {
    name: "Chevron Corporation",
    technical: {
      price_trend: "NEUTRAL",
      key_levels: { support: 140.00, resistance: 160.00 },
      moving_averages: { "50_day": "ABOVE", "200_day": "BELOW" }
    },
    fundamental: {
      valuation: "FAIR",
      key_metrics: { pe_ratio_analysis: "14.7", market_cap_assessment: "$300,000,000,000" },
      metrics: {
        market_cap: "$300,000,000,000",
        week_52_high: "$170.00",
        dividend_yield: "4.00%",
        pe_ratio: "14.7",
        week_52_low: "$135.00",
        beta: "1.15"
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
        { title: 'Prediction Accuracy', value: '85.8%', change: '+2.4%' },
        { title: 'Average Return', value: '11.2%', change: '+1.5%' },
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
      predicted_change: '+3.8%',
      risk_level: 'Medium',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 145 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 147 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 149 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 151 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 153 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 155 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 155 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 156 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 157 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 158 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 159 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 160 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 161 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 162 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 163 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 164 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 165 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 166 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 167 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 168 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 169 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 170 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 171 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 172 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 173 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 174 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 175 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 176 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 177 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 178 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 179 }
      ]
    }
  },
  NFLX: {
    name: "Netflix, Inc.",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 400.00, resistance: 480.00 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "PREMIUM",
      key_metrics: { pe_ratio_analysis: "40.5", market_cap_assessment: "$200,000,000,000" },
      metrics: {
        market_cap: "$200,000,000,000",
        week_52_high: "$500.00",
        dividend_yield: "-",
        pe_ratio: "40.5",
        week_52_low: "$350.00",
        beta: "1.30"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.30, percentage: '30.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.10, percentage: '10.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.10, percentage: '10.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.01, percentage: '1.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '87.3%', change: '+2.9%' },
        { title: 'Average Return', value: '16.5%', change: '+2.3%' },
        { title: 'Risk Score', value: 'High', type: 'risk' }
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
      confidence_score: 88,
      predicted_change: '+8.2%',
      risk_level: 'High',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 380 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 390 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 400 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 410 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 420 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 430 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 430 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 435 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 440 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 445 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 450 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 455 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 460 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 465 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 470 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 475 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 480 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 485 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 490 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 495 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 500 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 505 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 510 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 515 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 520 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 525 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 530 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 535 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 540 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 545 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 550 }
      ]
    }
  },
  HAL: {
    name: "Hindustan Aeronautics Limited",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 2800.00, resistance: 3200.00 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "PREMIUM",
      key_metrics: { pe_ratio_analysis: "35.8", market_cap_assessment: "₹2,00,000 Cr" },
      metrics: {
        market_cap: "₹2,00,000 Cr",
        week_52_high: "₹3300.00",
        dividend_yield: "1.00%",
        pe_ratio: "35.8",
        week_52_low: "₹2500.00",
        beta: "1.20"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.29, percentage: '29.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.21, percentage: '21.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.20, percentage: '20.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.11, percentage: '11.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '88.1%', change: '+3.2%' },
        { title: 'Average Return', value: '17.3%', change: '+2.5%' },
        { title: 'Risk Score', value: 'Medium', type: 'risk' }
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
      predicted_change: '+9.5%',
      risk_level: 'Medium',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 2600 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 2650 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 2700 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 2750 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 2800 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 2850 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 2850 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 2875 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 2900 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 2925 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 2950 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 2975 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 3000 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 3025 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 3050 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 3075 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 3100 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 3125 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 3150 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 3175 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 3200 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 3225 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 3250 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 3275 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 3300 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 3325 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 3350 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 3375 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 3400 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 3425 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 3450 }
      ]
    }
  },
  BEL: {
    name: "Bharat Electronics Limited",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 200.00, resistance: 250.00 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "PREMIUM",
      key_metrics: { pe_ratio_analysis: "40.2", market_cap_assessment: "₹1,50,000 Cr" },
      metrics: {
        market_cap: "₹1,50,000 Cr",
        week_52_high: "₹260.00",
        dividend_yield: "1.20%",
        pe_ratio: "40.2",
        week_52_low: "₹180.00",
        beta: "1.10"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.28, percentage: '28.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.20, percentage: '20.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.08, percentage: '8.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '89.0%', change: '+3.1%' },
        { title: 'Average Return', value: '18.2%', change: '+2.4%' },
        { title: 'Risk Score', value: 'Medium', type: 'risk' }
      ]
    },
    news_sentiment: {
      distribution: [
        { name: 'Positive', value: 72, color: '#4ade80' },
        { name: 'Neutral', value: 18, color: '#60a5fa' },
        { name: 'Negative', value: 10, color: '#f87171' }
      ]
    },
    predictive: {
      confidence_score: 90,
      predicted_change: '+10.5%',
      risk_level: 'Medium',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 190 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 195 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 200 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 205 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 210 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 215 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 215 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 218 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 221 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 224 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 227 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 230 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 233 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 236 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 239 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 242 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 245 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 248 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 251 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 254 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 257 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 260 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 263 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 266 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 269 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 272 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 275 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 278 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 281 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 284 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 287 }
      ]
    }
  },
  ADANIPOWER: {
    name: "Adani Power Limited",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 500.00, resistance: 600.00 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "OVERVALUED",
      key_metrics: { pe_ratio_analysis: "45.6", market_cap_assessment: "₹2,50,000 Cr" },
      metrics: {
        market_cap: "₹2,50,000 Cr",
        week_52_high: "₹650.00",
        dividend_yield: "-",
        pe_ratio: "45.6",
        week_52_low: "₹400.00",
        beta: "1.50"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.30, percentage: '30.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.22, percentage: '22.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.18, percentage: '18.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.10, percentage: '10.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.10, percentage: '10.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.06, percentage: '6.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.01, percentage: '1.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '86.7%', change: '+2.8%' },
        { title: 'Average Return', value: '19.4%', change: '+2.6%' },
        { title: 'Risk Score', value: 'High', type: 'risk' }
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
      confidence_score: 87,
      predicted_change: '+11.2%',
      risk_level: 'High',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 450 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 460 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 470 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 480 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 490 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 500 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 500 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 510 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 520 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 530 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 540 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 550 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 560 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 570 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 580 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 590 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 600 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 610 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 620 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 630 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 640 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 650 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 660 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 670 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 680 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 690 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 700 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 710 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 720 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 730 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 740 }
      ]
    }
  },
  BAJAJ_AUTO: {
    name: "Bajaj Auto Limited",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 7000.00, resistance: 8000.00 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "PREMIUM",
      key_metrics: { pe_ratio_analysis: "32.4", market_cap_assessment: "₹2,00,000 Cr" },
      metrics: {
        market_cap: "₹2,00,000 Cr",
        week_52_high: "₹8200.00",
        dividend_yield: "1.50%",
        pe_ratio: "32.4",
        week_52_low: "₹6500.00",
        beta: "0.95"
      }
    },
    ai_insights: {
      feature_importance: [
        { factor: 'Technical', weight: 0.27, percentage: '27.0%', color: '#86efac' },
        { factor: 'Sentiment', weight: 0.19, percentage: '19.0%', color: '#818cf8' },
        { factor: 'Fundamental', weight: 0.23, percentage: '23.0%', color: '#818cf8' },
        { factor: 'Historical', weight: 0.12, percentage: '12.0%', color: '#818cf8' },
        { factor: 'News', weight: 0.09, percentage: '9.0%', color: '#e9d5ff' },
        { factor: 'Volatility', weight: 0.05, percentage: '5.0%', color: '#cbd5e1' },
        { factor: 'Market Trends', weight: 0.03, percentage: '3.0%', color: '#cbd5e1' },
        { factor: 'Sector Performance', weight: 0.02, percentage: '2.0%', color: '#cbd5e1' }
      ]
    },
    performance: {
      metrics: [
        { title: 'Prediction Accuracy', value: '87.8%', change: '+2.9%' },
        { title: 'Average Return', value: '15.6%', change: '+2.1%' },
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
      confidence_score: 86,
      predicted_change: '+8.7%',
      risk_level: 'Medium',
      historical_data: [
        { Date: new Date(2023, 0, 1).getTime(), Close: 6800 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 6900 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 7000 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 7100 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 7200 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 7300 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 7300 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 7350 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 7400 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 7450 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 7500 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 7550 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 7600 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 7650 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 7700 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 7750 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 7800 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 7850 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 7900 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 7950 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 8000 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 8050 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 8100 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 8150 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 8200 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 8250 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 8300 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 8350 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 8400 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 8450 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 8500 }
      ]
    }
  },
  BRTI: {
    name: "Bharti Airtel Limited",
    technical: {
      price_trend: "BULLISH",
      key_levels: { support: 900.00, resistance: 1100.00 },
      moving_averages: { "50_day": "ABOVE", "200_day": "ABOVE" }
    },
    fundamental: {
      valuation: "OVERVALUED",
      key_metrics: { pe_ratio_analysis: "60.5", market_cap_assessment: "₹5,50,000 Cr" },
      metrics: {
        market_cap: "₹5,50,000 Cr",
        week_52_high: "₹1150.00",
        dividend_yield: "0.40%",
        pe_ratio: "60.5",
        week_52_low: "₹850.00",
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
        { Date: new Date(2023, 0, 1).getTime(), Close: 880 },
        { Date: new Date(2023, 0, 2).getTime(), Close: 900 },
        { Date: new Date(2023, 0, 3).getTime(), Close: 920 },
        { Date: new Date(2023, 0, 4).getTime(), Close: 940 },
        { Date: new Date(2023, 0, 5).getTime(), Close: 960 },
        { Date: new Date(2023, 0, 6).getTime(), Close: 980 }
      ],
      predicted_data: [
        { Date: new Date(2025, 4, 15).getTime(), Close: 980 },
        { Date: new Date(2025, 4, 30).getTime(), Close: 990 },
        { Date: new Date(2025, 5, 14).getTime(), Close: 1000 },
        { Date: new Date(2025, 5, 29).getTime(), Close: 1010 },
        { Date: new Date(2025, 6, 14).getTime(), Close: 1020 },
        { Date: new Date(2025, 6, 29).getTime(), Close: 1030 },
        { Date: new Date(2025, 7, 14).getTime(), Close: 1040 },
        { Date: new Date(2025, 7, 29).getTime(), Close: 1050 },
        { Date: new Date(2025, 8, 13).getTime(), Close: 1060 },
        { Date: new Date(2025, 8, 28).getTime(), Close: 1070 },
        { Date: new Date(2025, 9, 13).getTime(), Close: 1080 },
        { Date: new Date(2025, 9, 28).getTime(), Close: 1090 },
        { Date: new Date(2025, 10, 12).getTime(), Close: 1100 },
        { Date: new Date(2025, 10, 27).getTime(), Close: 1110 },
        { Date: new Date(2025, 11, 12).getTime(), Close: 1120 },
        { Date: new Date(2025, 11, 27).getTime(), Close: 1130 },
        { Date: new Date(2026, 0, 11).getTime(), Close: 1140 },
        { Date: new Date(2026, 0, 26).getTime(), Close: 1150 },
        { Date: new Date(2026, 1, 10).getTime(), Close: 1160 },
        { Date: new Date(2026, 1, 25).getTime(), Close: 1170 },
        { Date: new Date(2026, 2, 12).getTime(), Close: 1180 },
        { Date: new Date(2026, 2, 27).getTime(), Close: 1190 },
        { Date: new Date(2026, 3, 11).getTime(), Close: 1200 },
        { Date: new Date(2026, 3, 26).getTime(), Close: 1210 },
        { Date: new Date(2026, 4, 11).getTime(), Close: 1220 }
      ]
    }
  }
};