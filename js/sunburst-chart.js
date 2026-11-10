//Chart 2
// Simple sunburst chart implementation with persistent labels
// Hierarchy: Year → Age Group → Jurisdiction

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { setupSunburstInteractions } from './interaction.js';

// Build hierarchical data structure
function buildHierarchy(rawData) {
  const hierarchy = {
    name: "Road Fatalities",
    children: []
  };

  // Group by Year → Age → State
  const yearMap = d3.group(rawData, d => d.Year);
  
  yearMap.forEach((yearData, year) => {
    const yearNode = {
      name: String(year),
      children: []
    };
    
    const ageMap = d3.group(yearData, d => d.Age);
    
    ageMap.forEach((ageData, age) => {
      const ageNode = {
        name: age,
        children: []
      };
      
      const stateMap = d3.group(ageData, d => d.State);
      
      stateMap.forEach((stateData, state) => {
        const value = d3.sum(stateData, d => d['Count*(Crash ID)']);
        ageNode.children.push({
          name: state,
          value: value
        });
      });
      
      yearNode.children.push(ageNode);
    });
    
    hierarchy.children.push(yearNode);
  });
  
  return hierarchy;
}

// Main sunburst chart function
export function SunburstChart(data, config) {
  const { width, height, colorScheme } = config;
  const radius = width / 6;

  // Build hierarchy
  const hierarchyData = buildHierarchy(data);
  
  // Create color scale
  const color = d3.scaleOrdinal()
    .domain(hierarchyData.children.map(d => d.name))
    .range(colorScheme);

  // Compute the layout
  const hierarchy = d3.hierarchy(hierarchyData)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);
  
  const root = d3.partition()
    .size([2 * Math.PI, hierarchy.height + 1])
    (hierarchy);
  
  root.each(d => d.current = d);

  // Create the arc generator
  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

  // Create the SVG container
  const svg = d3.create("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, width])
    .style("font", "14px sans-serif");

  // Append the arcs
  const path = svg.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
    .attr("fill", d => { 
      while (d.depth > 1) d = d.parent; 
      return color(d.data.name); 
    })
    .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
    .attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")
    .attr("d", d => arc(d.current));

  // Tooltips are handled in interaction.js - no SVG title elements needed

  // Append labels
  const label = svg.append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .style("user-select", "none")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
    .attr("dy", "0.35em")
    .attr("fill-opacity", d => +labelVisible(d.current))
    .attr("transform", d => labelTransform(d.current))
    .attr("font-size", d => {
      if (d.depth === 1) return "16px";  // Years (inner ring)
      if (d.depth === 2) return "14px";  // Age groups (middle ring)
      return "12px";  // Jurisdictions (outer ring)
    })
    .attr("font-weight", d => d.depth === 1 ? "bold" : "normal")
    .text(d => d.data.name);

  // Center circle for reset
  const parent = svg.append("circle")
    .datum(root)
    .attr("r", radius)
    .attr("fill", "none")
    .attr("pointer-events", "all");

  // Add center text
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("font-size", "18px")
    .attr("font-weight", "bold")
    .attr("fill", "#333")
    .style("pointer-events", "none")
    .text("Road Fatalities");

  // Helper functions
  function arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }

  return {
    node: svg.node(),
    elements: { root, arc, radius, path, label, parent }
  };
}

// Render function
export function renderSunburstChart(container, data, config) {
  container.innerHTML = '';
  
  const chart = SunburstChart(data, config);
  container.appendChild(chart.node);
  
  // Setup interactions
  const svg = d3.select(chart.node);
  setupSunburstInteractions(svg, chart.elements);
}
//Chart 2 End
