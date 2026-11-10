//Chart 1
// Globe visualization for Chart 1
// Shows interactive 3D globe focused on Australia with drag-to-rotate and zoom functionality

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { GLOBE_CONFIG } from './shared-constants.js';

export async function createGlobe(containerId, worldData, australiaData, fatalityData) {
  // Clear any existing content
  d3.select(`#${containerId}`).selectAll("*").remove();
  
  const container = d3.select(`#${containerId}`);
  const width = container.node().getBoundingClientRect().width;
  const height = GLOBE_CONFIG.height;
  const sensitivity = GLOBE_CONFIG.sensitivity;

  // Get years and set up filtering
  const years = [...new Set(fatalityData.map(d => d.year))].sort((a, b) => a - b);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  let currentFilteredData = fatalityData;
  
  // Create simple slider
  const sliderElement = document.getElementById('chart1-year-slider');
  if (sliderElement.noUiSlider) sliderElement.noUiSlider.destroy();
  
  noUiSlider.create(sliderElement, {
    start: [minYear, maxYear],
    connect: true,
    step: 1,
    range: { min: minYear, max: maxYear },
    pips: { mode: 'steps', density: 100 }
  });
  
  // Create SVG
  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);
  
  // Set up projection centered on Australia
  const projection = d3.geoOrthographic()
    .scale(GLOBE_CONFIG.projection.scale)
    .center(GLOBE_CONFIG.projection.center)
    .rotate(GLOBE_CONFIG.projection.rotate)
    .translate([width / 2, height / 2]);
  
  const initialScale = GLOBE_CONFIG.projection.initialScale;
  const path = d3.geoPath().projection(projection);
  
  // Create globe background
  const globe = svg.append("circle")
    .attr("fill", GLOBE_CONFIG.globe.fill)
    .attr("stroke", GLOBE_CONFIG.globe.stroke)
    .attr("stroke-width", GLOBE_CONFIG.globe.strokeWidth)
    .attr("cx", width / 2)
    .attr("cy", height / 2)
    .attr("r", initialScale);
  
  // Create map group
  const mapGroup = svg.append("g");
  
  // State to track current view mode
  let isGlobeView = true;
  let currentRotation = [-133, 25];
  
  // Function to calculate fatalities for color mapping based on current filtered data
  function calculateFatalities(data) {
    const avgFatalities = {};
    const jurisdictions = [...new Set(data.map(d => d.jurisdiction))];
    
    jurisdictions.forEach(jurisdiction => {
      const jurisdictionData = data.filter(d => d.jurisdiction === jurisdiction);
      const avgRate = d3.mean(jurisdictionData, d => d.fatalities_per_100k);
      avgFatalities[jurisdiction] = avgRate || 0; // Default to 0 if undefined
    });
    
    return avgFatalities;
  }
  
  // Function to update story with top and bottom states
  function updateStoryStats(fatalityStats) {
    // Sort states by fatality rate
    const sortedStates = Object.entries(fatalityStats)
      .filter(([state, rate]) => rate > 0) // Filter out states with no data
      .sort((a, b) => b[1] - a[1]); // Sort descending
    
    // Get top 3 highest
    const highest = sortedStates.slice(0, 3);
    const highestList = document.getElementById('chart1-highest-states');
    if (highestList) {
      highestList.innerHTML = highest.map(([state, rate]) => 
        `<li><strong>${state}</strong> (${rate.toFixed(2)} per 100k)</li>`
      ).join('');
    }
    
    // Get bottom 3 lowest
    const lowest = sortedStates.slice(-3).reverse();
    const lowestList = document.getElementById('chart1-lowest-states');
    if (lowestList) {
      lowestList.innerHTML = lowest.map(([state, rate]) => 
        `<li><strong>${state}</strong> (${rate.toFixed(2)} per 100k)</li>`
      ).join('');
    }
  }
  
  // Initial fatality calculations
  let avgFatalities = calculateFatalities(currentFilteredData);
  
  // Create color scale for fatalities
  let maxFatality = d3.max(Object.values(avgFatalities)) || 10; // Default max if undefined
  let scaleMax = Math.ceil(maxFatality / GLOBE_CONFIG.legend.tickInterval) * GLOBE_CONFIG.legend.tickInterval;
  let colorScale = d3.scaleSequential()
    .domain([0, scaleMax])
    .interpolator(GLOBE_CONFIG.colorInterpolator);
  
  // Update story stats on initial load
  updateStoryStats(avgFatalities);
  
  // Create mapping between GeoJSON names and CSV jurisdiction names
  const nameMapping = {
    "Western Australia": "Western Australia",
    "Northern Territory": "Northern Territory", 
    "South Australia": "South Australia",
    "Queensland": "Queensland",
    "New South Wales": "New South Wales",
    "Victoria": "Victoria",
    "Tasmania": "Tasmania",
    "Australian Capital Territory": "Australian Capital Territory"
  };
  
  // Add world countries (excluding Australia)
  const worldCountries = worldData.features.filter(d => d.properties.name !== "Australia");
  
  mapGroup.append("g")
    .attr("class", "world-countries")
    .selectAll("path")
    .data(worldCountries)
    .enter().append("path")
    .attr("d", path)
    .attr("fill", "#ddd")
    .attr("stroke", "#999")
    .attr("stroke-width", 0.3)
    .style("opacity", 0.6);
  
  // Add Australian states directly on the globe with color coding
  mapGroup.append("g")
    .attr("class", "australia-states-globe")
    .selectAll("path")
    .data(australiaData.features)
    .enter().append("path")
    .attr("d", path)
    .attr("fill", d => {
      const mappedName = nameMapping[d.properties.name];
      const avgRate = avgFatalities[mappedName];
      
      return avgRate && avgRate > 0 ? colorScale(avgRate) : "#ccc";
    })
    .attr("stroke", GLOBE_CONFIG.states.stroke)
    .attr("stroke-width", GLOBE_CONFIG.states.strokeWidth)
    .style("cursor", "pointer")
    .style("opacity", GLOBE_CONFIG.states.opacity)
    .on("mouseover", function(event, d) {
      const mappedName = nameMapping[d.properties.name];
      const avgRate = avgFatalities[mappedName];
      const jurisdictionData = currentFilteredData.filter(f => f.jurisdiction === mappedName);
      const totalFatalities = d3.sum(jurisdictionData, f => f.total_fatalities);
      
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 1);
      
      // Show tooltip
      showTooltip(event, d.properties.name, { 
        fatalities_per_100k: avgRate, 
        total_fatalities: totalFatalities 
      });
    })
    .on("mouseout", function() {
      d3.select(this)
        .transition()
        .duration(200)
        .style("opacity", 0.9);
      
      hideTooltip();
    });
  
  // Add color legend to globe view
  addColorLegend(colorScale, Object.values(avgFatalities));
  
  // Slider update handler
  sliderElement.noUiSlider.on('update', function(values) {
    const [startYear, endYear] = values.map(v => Math.round(parseFloat(v)));
    currentFilteredData = fatalityData.filter(d => d.year >= startYear && d.year <= endYear);
    
    // Recalculate and update
    avgFatalities = calculateFatalities(currentFilteredData);
    updateStoryStats(avgFatalities);
    
    maxFatality = d3.max(Object.values(avgFatalities)) || 10;
    scaleMax = Math.ceil(maxFatality / 5) * 5;
    colorScale = d3.scaleSequential().domain([0, scaleMax]).interpolator(GLOBE_CONFIG.colorInterpolator);
    
    // Update state colors
    mapGroup.selectAll(".australia-states-globe path")
      .transition().duration(500)
      .attr("fill", d => {
        const mappedName = nameMapping[d.properties.name];
        const avgRate = avgFatalities[mappedName];
        return avgRate && avgRate > 0 ? colorScale(avgRate) : "#ccc";
      });
    
    // Update legend
    svg.select(".color-legend").remove();
    addColorLegend(colorScale, Object.values(avgFatalities));
  });
  
  
  // Add drag interaction for globe rotation
  const drag = d3.drag()
    .on("drag", function(event) {
      if (isGlobeView) {
        const rotate = projection.rotate();
        const k = sensitivity / projection.scale();
        const newRotation = [
          rotate[0] + event.dx * k,
          rotate[1] - event.dy * k
        ];
        currentRotation = newRotation;
        projection.rotate(newRotation);
        updatePaths();
      }
    });
  
  svg.call(drag);
  
  // Add zoom interaction
  const zoom = d3.zoom()
    .scaleExtent([0.3, 8])
    .on("zoom", function(event) {
      if (isGlobeView) {
        const newScale = initialScale * event.transform.k;
        projection.scale(newScale);
        globe.attr("r", newScale);
        updatePaths();
      }
    });
  
  svg.call(zoom);
  
  // Function to update all paths
  function updatePaths() {
    mapGroup.selectAll("path").attr("d", path);
  }
  
  // Function to add color legend
  function addColorLegend(colorScale, values) {
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - legendWidth - 20;
    const legendY = 20;
    
    // Calculate scale range - always start from 0
    const maxValue = d3.max(values) || 10;
    const scaleMax = Math.ceil(maxValue / 5) * 5; // Round up to nearest 5
    
    // Create scale ticks (0, 5, 10, 15, 20, etc.)
    const tickInterval = 5;
    const ticks = [];
    for (let i = 0; i <= scaleMax; i += tickInterval) {
      ticks.push(i);
    }
    
    // Create legend group
    const legend = svg.append("g")
      .attr("class", "color-legend")
      .attr("transform", `translate(${legendX}, ${legendY})`);
    
    // Create gradient definition
    const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");
    defs.select("#legend-gradient").remove(); // Remove existing gradient
    const gradient = defs.append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");
    
    // Add gradient stops based on 0 to scaleMax range
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const value = t * scaleMax;
      gradient.append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", colorScale(value));
    }
    
    // Add legend rectangle
    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("fill", "url(#legend-gradient)")
      .attr("stroke", "#333")
      .attr("stroke-width", 1);
    
    // Add legend title
    legend.append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .text("Fatalities per 100k");
    
    // Add tick marks and labels
    ticks.forEach((tick, i) => {
      const x = (tick / scaleMax) * legendWidth;
      
      // Add tick mark
      legend.append("line")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", legendHeight)
        .attr("y2", legendHeight + 5)
        .attr("stroke", "#333")
        .attr("stroke-width", 1);
      
      // Add tick label
      legend.append("text")
        .attr("x", x)
        .attr("y", legendHeight + 18)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#666")
        .text(tick);
    });
  }
  
  // Tooltip functions
  function showTooltip(event, stateName, stateData) {
    const tooltip = d3.select("body").append("div")
      .attr("class", "globe-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0);
    
    const content = stateData 
      ? `<strong>${stateName}</strong><br/>
         Avg. fatalities per 100k (2020-2024): ${stateData.fatalities_per_100k.toFixed(1)}<br/>
         Total fatalities (2020-2024): ${stateData.total_fatalities}`
      : `<strong>${stateName}</strong><br/>No data available`;
    
    tooltip.html(content)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 10) + "px")
      .transition()
      .duration(200)
      .style("opacity", 1);
  }
  
  function hideTooltip() {
    d3.selectAll(".globe-tooltip").remove();
  }
  
  
  // Add instructions
  const instructions = container.append("div")
    .attr("class", "globe-instructions")
    .style("text-align", GLOBE_CONFIG.instructions.textAlign)
    .style("margin-top", GLOBE_CONFIG.instructions.marginTop)
    .style("font-size", GLOBE_CONFIG.instructions.fontSize)
    .style("color", GLOBE_CONFIG.instructions.color);
  
  instructions.html("🌍 <strong>Drag to rotate</strong> • <strong>Scroll to zoom</strong> • <strong>Hover over states for details</strong>");
}
//Chart 1 End
