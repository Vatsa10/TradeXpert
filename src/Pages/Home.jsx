import React from 'react';
import { useTheme } from '../context/ThemeContext';
import MarketOverview from '../Components/Home/MarketOverview';
import Treemap from '../Components/Home/Treemap';
import NewsSection from '../Components/Home/NewsSection';
import InvestmentBundles from '../Components/Home/InvestmentBundles';
import '../styles/Home.css';

// Card Components (keep these here as they're used across components)
export const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-card rounded-lg border border-border shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className = '', ...props }) => (
  <div className={`flex flex-col p-6 ${className}`} {...props} />
);

export const CardTitle = ({ className = '', ...props }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
);

export const CardContent = ({ className = '', ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

function Home() {
  const { theme } = useTheme();

  const marketOverview = {
    dowJones: { value: "34,945.47", change: "+1.2%" },
    sp500: { value: "4,505.10", change: "+0.8%" },
    nasdaq: { value: "14,113.70", change: "+1.5%" },
    marketSentiment: "Bullish"
  };

  const marketData = {
    Technology: {
      AAPL: { change: 2.5, changePercent: 1.68, price: 206.55, volume: "85M" },
      MSFT: { change: 1.8, changePercent: 0.63, price: 285.6, volume: "65M" },
      GOOGL: { change: -0.5, changePercent: -0.02, price: 2750.8, volume: "55M" },
      NVDA: { change: 3.2, changePercent: 2.15, price: 425.5, volume: "45M" },
      AMD: { change: 2.8, changePercent: 1.95, price: 128.9, volume: "40M" },
      INTC: { change: -1.2, changePercent: -0.85, price: 45.6, volume: "35M" }
    },
    Financial: {
      JPM: { change: -0.7, changePercent: -0.45, price: 155.8, volume: "35M" },
      BAC: { change: 1.1, changePercent: 2.60, price: 42.3, volume: "40M" },
      WFC: { change: 0.5, changePercent: 0.91, price: 55.2, volume: "30M" },
      GS: { change: 1.8, changePercent: 1.35, price: 385.4, volume: "25M" },
      MS: { change: -0.9, changePercent: -0.78, price: 92.6, volume: "20M" },
      V: { change: 2.1, changePercent: 1.95, price: 245.8, volume: "28M" }
    },
    Healthcare: {
      JNJ: { change: 0.8, changePercent: 0.48, price: 165.3, volume: "25M" },
      PFE: { change: -1.2, changePercent: -2.55, price: 45.75, volume: "35M" },
      UNH: { change: 1.5, changePercent: 0.31, price: 480.9, volume: "18M" },
      ABBV: { change: 2.3, changePercent: 1.85, price: 138.5, volume: "22M" },
      MRK: { change: -0.6, changePercent: -0.42, price: 105.2, volume: "20M" }
    },
    Consumer: {
      AMZN: { change: 2.8, changePercent: 2.15, price: 128.9, volume: "65M" },
      WMT: { change: 0.4, changePercent: 0.25, price: 156.7, volume: "25M" },
      PG: { change: -0.3, changePercent: -0.18, price: 145.6, volume: "20M" },
      KO: { change: 1.2, changePercent: 0.95, price: 58.9, volume: "22M" },
      PEP: { change: 0.7, changePercent: 0.45, price: 168.3, volume: "18M" },
      COST: { change: 1.5, changePercent: 1.25, price: 552.4, volume: "28M" }
    },
    Energy: {
      XOM: { change: -1.5, changePercent: -1.25, price: 105.8, volume: "30M" },
      CVX: { change: -0.8, changePercent: -0.65, price: 155.4, volume: "25M" },
      COP: { change: 1.9, changePercent: 1.75, price: 115.6, volume: "20M" },
      SLB: { change: 2.4, changePercent: 2.15, price: 52.8, volume: "18M" },
      EOG: { change: -1.1, changePercent: -0.95, price: 125.3, volume: "15M" }
    },
    Communications: {
      META: { change: 2.6, changePercent: 2.15, price: 335.8, volume: "42M" },
      DIS: { change: -0.9, changePercent: -0.75, price: 95.4, volume: "28M" },
      NFLX: { change: 3.2, changePercent: 2.85, price: 485.2, volume: "32M" },
      TMUS: { change: 0.8, changePercent: 0.65, price: 162.7, volume: "18M" },
      VZ: { change: -0.5, changePercent: -0.35, price: 42.8, volume: "22M" }
    }
  };

  const latestNews = [
    { id: 1, title: "Govt to focus on 20 countries, six sectors to boost exports", time: "9:20 AM", category: "Economy" },
    { id: 2, title: "Jupiter Wagons gets LoA worth Rs 600 crore", time: "9:14 AM", category: "Corporate", tag: "JWL" },
    { id: 3, title: "East West Freight Carriers enters into service contract", time: "9:49 AM", category: "Corporate", tag: "540006" },
    { id: 4, title: "Oil India signs MoU with Petrobras", time: "9:05 AM", category: "Corporate", tag: "OIL" },
    { id: 5, title: "US markets settle mostly higher after Powell testimony", time: "8:29 AM", category: "Market" }
  ];

  const investmentBundles = [
    { name: "Excel Industries Ltd.", sector: "Pesticides & Agrochemicals", value: 156.75, performance: 6327 },
    { name: "Meghmani Organics Ltd.", sector: "Pesticides & Agrochemicals", value: 125.25, performance: 2158 },
    { name: "NRB Bearings Ltd.", sector: "Bearings", value: 145.50, performance: 3250 },
    { name: "Sterlite Technologies Ltd.", sector: "Cable", value: 132.80, performance: 4120 },
    { name: "Phillips Carbon Black Ltd.", sector: "Carbon Black", value: 185.90, performance: 3750 }
  ];

  return (
    <div className={`home ${theme}`}>
      <MarketOverview marketOverview={marketOverview} />
      
      <section className="heatmap-section">
        <Treemap data={marketData} />
      </section>
      
      <NewsSection latestNews={latestNews} />
      <InvestmentBundles bundles={investmentBundles} />
    </div>
  );
}

export default Home;