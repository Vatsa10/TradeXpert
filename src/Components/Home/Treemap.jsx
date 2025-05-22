// Treemap.jsx
import React, { useState } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/Home.css';

const Treemap = ({ data }) => {
  const { theme } = useTheme();
  const [hoveredCompany, setHoveredCompany] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const width = 1000;
  const height = 700;  // Increased from 550 to 700

  // Transform the data into the hierarchical structure
  const processData = (data) => {
    const result = {
      name: "Market",
      children: Object.entries(data).map(([sector, companies]) => ({
        name: sector,
        children: Object.entries(companies).map(([name, details]) => ({
          name,
          value: 100, // You can adjust this based on market cap if available
          ...details
        }))
      }))
    };
    return result;
  };

  const treemap = d3.treemap()
    .size([width, height])
    .paddingTop(20)
    .paddingRight(2)
    .paddingBottom(2)
    .paddingLeft(2)
    .round(true);

  const root = d3.hierarchy(processData(data))
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  treemap(root);

  const colorScale = d3.scaleSequential(d3.interpolateRdYlBu)
    .domain([3, -3]);

  const handleMouseEnter = (event, d) => {
    if (d.data.price) { 
      setHoveredCompany({
        name: d.data.name,
        price: d.data.price,
        volume: d.data.volume,
        change: d.data.change,
        position: {
          x: d.x0,
          y: d.y0,
          width: d.x1 - d.x0,
          height: d.y1 - d.y0
        }
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredCompany(null);
  };

  return (
    <div className="treemap-container">
      <h2 className="treemap-title">Market Heatmap</h2>
      <div className="treemap-content">
        <svg width={width} height={height}>
          {root.descendants().map((d, i) => {
            if (d.depth === 0) return null;  

            return (
              <g key={i} transform={`translate(${d.x0},${d.y0})`}>
                <rect
                  className="treemap-tile"
                  width={d.x1 - d.x0}
                  height={d.y1 - d.y0}
                  fill={d.children ? 
                    theme === 'dark' ? '#333' : '#eee' : 
                    colorScale(d.data.change)}
                  stroke={d.children ? 
                    theme === 'dark' ? '#555' : '#999' : 
                    theme === 'dark' ? '#444' : 'white'}
                  strokeWidth={d.children ? 2 : 1}
                  onMouseEnter={(event) => handleMouseEnter(event, d)}
                  onMouseLeave={handleMouseLeave}
                />
                {d.depth === 1 && (
                  <text
                    x={5}
                    y={15}
                    fill={theme === 'dark' ? '#fff' : '#000'}
                    fontSize="12px"
                    fontWeight="bold"
                  >
                    {d.data.name}
                  </text>
                )}
                {!d.children && (
                  <text
                    x={(d.x1 - d.x0) / 2}
                    y={(d.y1 - d.y0) / 2}
                    textAnchor="middle"
                    dy="0.35em"
                    fill={theme === 'dark' ? '#fff' : '#000'}
                    fontSize={Math.min((d.x1 - d.x0) / 6, (d.y1 - d.y0) / 6, 14)}
                    fontWeight="bold"
                  >
                    {d.data.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {hoveredCompany && (
          <div
            className="tooltip"
            style={{
              position: 'absolute',
              left: `${hoveredCompany.position.x + hoveredCompany.position.width/2}px`,
              top: `${hoveredCompany.position.y + hoveredCompany.position.height/2}px`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: theme === 'dark' ? 'var(--tooltip-bg-dark)' : 'var(--tooltip-bg-light)',
              border: `1px solid ${theme === 'dark' ? 'var(--tooltip-border-dark)' : 'var(--tooltip-border-light)'}`,
              padding: '8px',
              borderRadius: '4px',
              pointerEvents: 'none'
            }}
          >
            <div><strong>{hoveredCompany.name}</strong></div>
            <div>Price: ${hoveredCompany.price}</div>
            <div>Volume: {hoveredCompany.volume}</div>
            <div>Change: {hoveredCompany.change}%</div>
          </div>
        )}
        
        <div className="heatmap-scale">
          <div className="scale-gradient"></div>
          <div className="scale-labels">
            <span>+3</span>
            <span>+2</span>
            <span>+1</span>
            <span>0</span>
            <span>-1</span>
            <span>-2</span>
            <span>-3</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Treemap;