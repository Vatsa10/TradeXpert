import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { COMPANY_DATA } from '../../data/companyData';
import '../../styles/Analysis/PredictiveAnalytics.css';
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import * as am5stock from "@amcharts/amcharts5/stock";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

const PredictiveAnalytics = ({ symbol }) => {
  const { theme } = useTheme();
  const [timeframe, setTimeframe] = useState('1 Week');
  const chartRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    // Check for valid data inside useEffect
    if (!symbol || !COMPANY_DATA[symbol]?.predictive) {
      if (rootRef.current) {
        rootRef.current.dispose();
      }
      return;
    }

    const companyData = COMPANY_DATA[symbol].predictive;

    if (rootRef.current) {
      rootRef.current.dispose();
    }

    const root = am5.Root.new("chartdiv");
    rootRef.current = root;

    // Create custom theme
    const customTheme = am5.Theme.new(root);
    customTheme.rule("Label").setAll({
      fill: theme === 'dark' ? am5.color("#ffffff") : am5.color("#1a1a1a"),
      fontSize: "0.9em"
    });

    root.setThemes([am5themes_Animated.new(root), customTheme]);

    const stockChart = root.container.children.push(am5stock.StockChart.new(root, {
      paddingRight: 0
    }));

    const mainPanel = stockChart.panels.push(am5stock.StockPanel.new(root, {
      wheelY: "zoomX",
      panX: true,
      panY: true
    }));

    // Create axes
    const valueAxis = mainPanel.yAxes.push(am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {
        pan: "zoom"
      }),
      numberFormat: "#,###.00",
      extraTooltipPrecision: 2
    }));

    const dateAxis = mainPanel.xAxes.push(am5xy.GaplessDateAxis.new(root, {
      baseInterval: { timeUnit: "day", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, {})
    }));

    // Historical data series
    const historicalSeries = mainPanel.series.push(am5xy.LineSeries.new(root, {
      name: "Historical",
      valueXField: "Date",
      valueYField: "Close",
      xAxis: dateAxis,
      yAxis: valueAxis,
      stroke: am5.color("#2563eb"),
      fill: am5.color("#2563eb"),
      tooltip: am5.Tooltip.new(root, {
        labelText: "Historical: ${valueY}"
      })
    }));

    // Predicted data series
    const predictedSeries = mainPanel.series.push(am5xy.LineSeries.new(root, {
      name: "Predicted",
      valueXField: "Date",
      valueYField: "Close",
      xAxis: dateAxis,
      yAxis: valueAxis,
      stroke: am5.color("#34d399"),
      fill: am5.color("#34d399"),
      strokeDasharray: [3, 3], // Dashed line for predictions
      tooltip: am5.Tooltip.new(root, {
        labelText: "Predicted: ${valueY}"
      })
    }));

    // Add legend
    const legend = mainPanel.children.push(am5.Legend.new(root, {
      centerX: am5.p50,
      x: am5.p50
    }));
    legend.data.setAll(mainPanel.series.values);

    // Update with company-specific data
    historicalSeries.data.setAll(companyData.historical_data);
    predictedSeries.data.setAll(companyData.predicted_data);

    // Add cursor
    mainPanel.set("cursor", am5xy.XYCursor.new(root, {
      xAxis: dateAxis,
      yAxis: valueAxis,
      behavior: "zoomX"
    }));

    // Add scrollbar
    stockChart.set("scrollbarX", am5.Scrollbar.new(root, {
      orientation: "horizontal"
    }));

    return () => {
      if (rootRef.current) {
        rootRef.current.dispose();
      }
    };
  }, [theme, symbol]);

  // Data validation after Hooks
  if (!symbol || !COMPANY_DATA[symbol] || !COMPANY_DATA[symbol].predictive) {
    return <div className="no-data-message">No predictive data available for this company</div>;
  }

  const companyData = COMPANY_DATA[symbol].predictive;

  return (
    <div className={`analytics-panel ${theme}`}>
      <div className="panel-header">
        <h2 className="panel-title">Predictive Analytics - {COMPANY_DATA[symbol].name}</h2>
        <p className="panel-subtitle">Historical data and AI-powered price predictions</p>
      </div>
      
      <div className="controls-section">
        <div className="prediction-header">
          <h3>Prediction Timeframe</h3>
          <div className="timeframe-selector">
            <select
              className="select-dropdown"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option>1 Week</option>
              <option>1 Month</option>
              <option>3 Months</option>
              <option>6 Months</option>
              <option>1 Year</option>
            </select>
          </div>
        </div>
        <div className="metrics-banner">
          <span className="metric">
            Confidence Score: <strong>{companyData?.confidence_score || 0}%</strong>
          </span>
          <span className="metric">
            Predicted Change: 
            <strong className={
              (companyData?.predicted_change || '').startsWith('+') ? 'positive' : 'negative'
            }>
              {companyData?.predicted_change || 'N/A'}
            </strong>
          </span>
          <span className="metric">
            Risk Level: <strong>{companyData?.risk_level || 'N/A'}</strong>
          </span>
        </div>
      </div>

      <div className="chart-wrapper">
        <div id="chartdiv" style={{ width: "100%", height: "500px" }}></div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;