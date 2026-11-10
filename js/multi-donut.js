//Chart 5 - Multi-Donut
// Implementation of multi-donut chart showing crash risk by time and weekday
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { setupMultiDonutInteractions } from './interaction.js';

export function MultiDonut(data, config, selectedDays = []) {
  const { width, height, totalHeight, innerRadius, outerRadius } = config;
  const centerX = width / 2;
  const centerY = height / 2;

  // Get time bins and weekdays from config (All 7 days)
  const timeBins = config.timeBins;
  const weekdays = config.weekdayLabels.items;

  // Filter data: all 7 days of the week
  const weekdayData = data.filter(d => weekdays.includes(d.Dayweek));

  // Aggregate data: count fatalities by time and weekday, also collect road types
  const aggregatedData = d3.rollup(
    weekdayData,
    v => ({
      count: v.length,
      roadTypes: v.map(d => d['National Road Type']) // Store road types for tooltip
    }),
    d => d.Time,
    d => d.Dayweek
  );

  // Create matrix for heatmap
  const matrix = [];
  weekdays.forEach(weekday => {
    const row = [];
    timeBins.forEach(time => {
      const timeData = aggregatedData.get(time);
      const cellData = timeData ? timeData.get(weekday) : null;
      row.push({
        weekday,
        time,
        count: cellData ? cellData.count : 0,
        roadTypes: cellData ? cellData.roadTypes : []
      });
    });
    matrix.push(row);
  });

  // Find max count for color scale
  const maxCount = d3.max(matrix.flat(), d => d.count);

  // Color scale - red intensity for danger
  const colorScale = d3.scaleSequential()
    .domain([0, maxCount])
    .interpolator(d3.interpolateReds);

  // Create SVG with totalHeight to accommodate legend
  const svgHeight = totalHeight || height;
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", svgHeight)
    .attr("viewBox", [0, 0, width, svgHeight])
    .attr("class", "multi-donut-svg");

  // Create main group centered
  const g = svg.append("g")
    .attr("transform", `translate(${centerX}, ${centerY})`);

  // Calculate ring widths (7 rings for all days Mon-Sun)
  const ringWidth = (outerRadius - innerRadius) / weekdays.length;

  // Angle scale for time bins
  const angleScale = d3.scaleLinear()
    .domain([0, timeBins.length])
    .range([0, 2 * Math.PI]);

  // Create arc generator
  const arc = d3.arc();

  // Draw heatmap cells
  matrix.forEach((row, ringIndex) => {
    const innerR = innerRadius + ringIndex * ringWidth;
    const outerR = innerR + ringWidth;

    row.forEach((cell, segmentIndex) => {
      const startAngle = angleScale(segmentIndex);
      const endAngle = angleScale(segmentIndex + 1);

      // Determine opacity based on selected days
      const isSelected = selectedDays.length === 0 || selectedDays.includes(cell.weekday);
      const opacity = isSelected ? 1.0 : 0.2;
      
      g.append("path")
        .datum(cell)
        .attr("class", "heatmap-cell")
        .attr("d", arc({
          innerRadius: innerR,
          outerRadius: outerR,
          startAngle: startAngle,
          endAngle: endAngle
        }))
        .attr("fill", colorScale(cell.count))
        .attr("stroke", config.cellStroke)
        .attr("stroke-width", config.cellStrokeWidth)
        .style("cursor", "pointer")
        .style("opacity", opacity);
    });
  });

  // Add time labels around the outside
  timeBins.forEach((time, i) => {
    const angle = angleScale(i + 0.5) - Math.PI / 2; // Rotate to start at top
    const labelRadius = outerRadius + config.timeLabelOffset;
    const x = labelRadius * Math.cos(angle);
    const y = labelRadius * Math.sin(angle);

    g.append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", config.timeLabelFontSize)
      .attr("font-weight", "bold")
      .attr("fill", config.timeLabelColor)
      .text(time);
  });

  // Add weekday labels in the 0-3 time slot area (Mon-Sun from inner to outer)
  const weekdayConfig = config.weekdayLabels;
  weekdayConfig.items.forEach((weekday, i) => {
    // Position at the center of the 0-3 time bin (first bin, index 0)
    const angle = angleScale(0.5) - Math.PI / 2; // Center of 0-3 slot, starting at top
    
    // Calculate radius for each weekday ring (Monday inner, Sunday outer)
    const labelRadius = innerRadius + ringWidth * (i + 0.5);
    
    // Calculate x, y position
    const x = labelRadius * Math.cos(angle);
    const y = labelRadius * Math.sin(angle);
    
    // Determine opacity based on selected days
    const isSelected = selectedDays.length === 0 || selectedDays.includes(weekday);
    const labelOpacity = isSelected ? 1.0 : 0.3;
    
    g.append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", weekdayConfig.fontSize)
      .attr("font-weight", "500")
      .attr("fill", weekdayConfig.color)
      .style("pointer-events", "none")
      .style("opacity", labelOpacity)
      .text(weekday);
  });

  // Add center title
  g.append("text")
    .attr("x", 0)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .attr("font-size", config.centerTitleFontSize)
    .attr("font-weight", "bold")
    .attr("fill", config.centerTitleColor)
    .text("Crash Risk");
  
  g.append("text")
    .attr("x", 0)
    .attr("y", 15)
    .attr("text-anchor", "middle")
    .attr("font-size", config.centerSubtitleFontSize)
    .attr("fill", config.centerTitleColor)
    .text("Clock");

  // Return the chart with scales and data
  const node_element = svg.node();
  node_element.scales = { colorScale };
  node_element.chartElements = { matrix, timeBins, weekdays };
  return node_element;
}

// Renders a multi donut chart into a container element
export function renderMultiDonut(container, data, config, selectedDays = []) {
  // Clear any existing content in the container
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!containerElement) {
    console.error('Container not found:', container);
    return null;
  }
  
  containerElement.innerHTML = '';

  // Create the multi donut chart with day filter
  const chart = MultiDonut(data, config, selectedDays);

  // Append the chart to the container
  containerElement.appendChild(chart);

  // Get the SVG element for adding interactions
  const svg = d3.select(chart);

  // Add legend
  addMultiDonutLegend(svg, chart.scales, config);

  // Set up interactions
  setupMultiDonutInteractions(svg, data, config, chart);

  return chart;
}

// Adds a legend to the multi donut chart (Chart 1 style)
function addMultiDonutLegend(svg, scales, config) {
  const legendConfig = config.legend;
  const { x, y, width, height } = legendConfig;

  // Create legend group
  const legend = svg.append("g")
    .attr("class", "color-legend")
    .attr("transform", `translate(${x}, ${y})`);

  // Get max value from color scale domain
  const maxValue = scales.colorScale.domain()[1];
  const scaleMax = Math.ceil(maxValue);
  
  // Generate tick values (0, 5, 10, 15, 20, etc.)
  const tickInterval = 5;
  const ticks = [];
  for (let i = 0; i <= scaleMax; i += tickInterval) {
    ticks.push(i);
  }
  
  // Create gradient definition
  const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");
  defs.select("#radial-legend-gradient").remove();
  const gradient = defs.append("linearGradient")
    .attr("id", "radial-legend-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");
  
  // Add gradient stops
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const value = (i / steps) * scaleMax;
    gradient.append("stop")
      .attr("offset", `${(i / steps) * 100}%`)
      .attr("stop-color", scales.colorScale(value));
  }
  
  // Add legend title
  legend.append("text")
    .attr("x", width / 2)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("fill", "#333")
    .text("Fatality Count");
  
  // Add legend rectangle with gradient
  legend.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "url(#radial-legend-gradient)")
    .attr("stroke", "#333")
    .attr("stroke-width", 1);
  
  // Add tick marks and labels
  ticks.forEach((tick, i) => {
    const xPos = (tick / scaleMax) * width;
    
    // Add tick mark
    legend.append("line")
      .attr("x1", xPos)
      .attr("x2", xPos)
      .attr("y1", height)
      .attr("y2", height + 5)
      .attr("stroke", "#333")
      .attr("stroke-width", 1);
    
    // Add tick label
    legend.append("text")
      .attr("x", xPos)
      .attr("y", height + 18)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#666")
      .text(tick);
  });
  
}
//Chart 5 End
