//Chart 3
// Violin Chart visualization showing fatality demographics by road user type and gender
// Each violin is split into two colors: male (blue) and female (red)

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { VIOLIN_CONFIG } from './shared-constants.js';
import { setupViolinInteractions } from './interaction.js';

export function createViolinChart(containerId, data, roadUserTypes) {
  // Clear any existing content
  d3.select(`#${containerId}`).selectAll("*").remove();
  
  const container = d3.select(`#${containerId}`);
  const containerWidth = container.node().getBoundingClientRect().width;
  
  // Use container width if available, otherwise use config width
  const totalWidth = containerWidth > 0 ? containerWidth : VIOLIN_CONFIG.width;
  const totalHeight = VIOLIN_CONFIG.height;
  const margin = VIOLIN_CONFIG.margin;
  const width = totalWidth - margin.left - margin.right;
  const height = totalHeight - margin.top - margin.bottom;
  
  // Create SVG
  const svg = container
    .append("svg")
    .attr("width", totalWidth)
    .attr("height", totalHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Group data by road user and gender, creating arrays of individual records
  const groupedData = d3.group(data, d => d['Road User'], d => d.Gender);
  
  // Find max count for Y scale by counting records per road user/gender
  let maxCount = 0;
  roadUserTypes.forEach(roadUser => {
    const maleCount = groupedData.get(roadUser)?.get('Male')?.length || 0;
    const femaleCount = groupedData.get(roadUser)?.get('Female')?.length || 0;
    maxCount = Math.max(maxCount, maleCount, femaleCount);
  });
  
  // Build Y scale
  const y = d3.scaleLinear()
    .domain([0, maxCount * 1.1])
    .range([height, 0]);
  
  // Add Y axis
  const yAxis = svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y).ticks(8))
    .selectAll("text")
    .style("font-size", VIOLIN_CONFIG.axis.fontSize)
    .style("fill", VIOLIN_CONFIG.axis.color);
  
  // Re-select the y-axis group for updates
  const yAxisGroup = svg.select(".y-axis");
  
  // Y axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "600")
    .style("fill", VIOLIN_CONFIG.axis.color)
    .text("Count of Road User");
  
  // Label mapping for mobile/tablet abbreviations
  const mobileLabels = {
    'Driver': 'Drvr',
    'Motorcycle pillion passenger': 'MC-P',
    'Motorcycle rider': 'MC-R',
    'Passenger': 'Pax',
    'Pedal cyclist': 'Cycl',
    'Pedestrian': 'Ped',
    'Unknown': 'Unk'
  };
  
  // Desktop labels (shorter than full but clearer than abbreviations)
  const desktopLabels = {
    'Motorcycle pillion passenger': 'Motorcycle Passenger',
    'Motorcycle rider': 'Motorcycle Rider',
    'Pedal cyclist': 'Pedal Cyclist'
  };
  
  // Determine if we should use abbreviations based on screen width
  // Desktop (>= 1024px): desktop labels
  // Tablet/Mobile (< 1024px): abbreviations
  const useAbbreviations = window.innerWidth < 1024;
  
  // Build X scale
  const x = d3.scaleBand()
    .range([0, width])
    .domain(roadUserTypes)
    .padding(VIOLIN_CONFIG.padding);
  
  // Add X axis with responsive labels (desktop labels on desktop, abbreviated on mobile/tablet)
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => useAbbreviations ? (mobileLabels[d] || d) : (desktopLabels[d] || d)))
    .selectAll("text")
    .style("text-anchor", "middle")
    .attr("dy", "1em")
    .style("font-size", VIOLIN_CONFIG.axis.fontSize)
    .style("fill", VIOLIN_CONFIG.axis.color);
  
  // Create histogram function for binning
  const histogram = d3.histogram()
    .domain([0, maxCount])
    .thresholds(VIOLIN_CONFIG.binCount)
    .value(d => d);
  
  // Compute binning for each road user type and gender
  const sumstat = [];
  roadUserTypes.forEach(roadUser => {
    const maleRecords = groupedData.get(roadUser)?.get('Male') || [];
    const femaleRecords = groupedData.get(roadUser)?.get('Female') || [];
    
    const maleCount = maleRecords.length;
    const femaleCount = femaleRecords.length;
    
    // Create distribution data with Gaussian/normal-like distribution for oval shape
    // This creates a smooth, symmetric violin shape
    const createGaussianDistribution = (count, numRecords) => {
      if (numRecords === 0) return [];
      
      const values = [];
      const mean = count;
      const stdDev = count * 0.15; // Standard deviation controls the spread
      
      for (let i = 0; i < numRecords; i++) {
        // Use Box-Muller transform to generate normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        // Scale and shift to center around the count
        const value = mean + z * stdDev;
        values.push(Math.max(0, value)); // Ensure non-negative
      }
      
      return values;
    };
    
    const maleValues = createGaussianDistribution(maleCount, maleRecords.length);
    const femaleValues = createGaussianDistribution(femaleCount, femaleRecords.length);
    
    const maleBins = histogram(maleValues);
    const femaleBins = histogram(femaleValues);
    
    sumstat.push({
      roadUser: roadUser,
      gender: 'Male',
      bins: maleBins,
      count: maleCount
    });
    
    sumstat.push({
      roadUser: roadUser,
      gender: 'Female',
      bins: femaleBins,
      count: femaleCount
    });
  });
  
  // Find maximum bin length for scaling
  let maxNum = 0;
  sumstat.forEach(stat => {
    const lengths = stat.bins.map(bin => bin.length);
    const longest = d3.max(lengths) || 0;
    if (longest > maxNum) {
      maxNum = longest;
    }
  });
  
  // Scale for violin width
  const xNum = d3.scaleLinear()
    .range([0, x.bandwidth() / 2])
    .domain([0, maxNum]);
  
  // Add clipPath for zooming
  const clip = svg.append("defs").append("svg:clipPath")
    .attr("id", "clip-violin")
    .append("svg:rect")
    .attr("width", width)
    .attr("height", height)
    .attr("x", 0)
    .attr("y", 0);
  
  // Create violin group with clip path
  const violinContainer = svg.append('g')
    .attr("clip-path", "url(#clip-violin)");
  
  // Add violins
  roadUserTypes.forEach(roadUser => {
    const maleData = sumstat.find(s => s.roadUser === roadUser && s.gender === 'Male');
    const femaleData = sumstat.find(s => s.roadUser === roadUser && s.gender === 'Female');
    
    const violinGroup = violinContainer.append("g")
      .attr("class", "violin-group")
      .attr("transform", `translate(${x(roadUser)},0)`);
    
    // Add male violin (left side)
    if (maleData && maleData.bins.length > 0) {
      violinGroup.append("path")
        .datum(maleData.bins)
        .attr("class", "violin male-violin")
        .attr("data-roaduser", roadUser)
        .attr("data-gender", "Male")
        .attr("data-count", maleData.count)
        .style("stroke", VIOLIN_CONFIG.violin.stroke)
        .style("stroke-width", VIOLIN_CONFIG.violin.strokeWidth)
        .style("fill", VIOLIN_CONFIG.violin.maleFill)
        .style("opacity", VIOLIN_CONFIG.violin.opacity)
        .attr("d", d3.area()
          .x0(d => x.bandwidth() / 2 - xNum(d.length))
          .x1(d => x.bandwidth() / 2)
          .y(d => y(d.x0))
          .curve(d3[VIOLIN_CONFIG.curve])
        );
    }
    
    // Add female violin (right side)
    if (femaleData && femaleData.bins.length > 0) {
      violinGroup.append("path")
        .datum(femaleData.bins)
        .attr("class", "violin female-violin")
        .attr("data-roaduser", roadUser)
        .attr("data-gender", "Female")
        .attr("data-count", femaleData.count)
        .style("stroke", VIOLIN_CONFIG.violin.stroke)
        .style("stroke-width", VIOLIN_CONFIG.violin.strokeWidth)
        .style("fill", VIOLIN_CONFIG.violin.femaleFill)
        .style("opacity", VIOLIN_CONFIG.violin.opacity)
        .attr("d", d3.area()
          .x0(d => x.bandwidth() / 2)
          .x1(d => x.bandwidth() / 2 + xNum(d.length))
          .y(d => y(d.x0))
          .curve(d3[VIOLIN_CONFIG.curve])
        );
    }
    
  });
  
  // Add legend
  // On mobile/tablet (where we use abbreviations), place legend at the bottom center
  // On desktop, keep it at the original position
  // Calculate total legend width for proper centering: two rects + text + spacing
  const totalLegendWidth = (VIOLIN_CONFIG.legend.rectSize * 2) + VIOLIN_CONFIG.legend.spacing + 80; // 80px for text widths
  const legendX = useAbbreviations ? (width - totalLegendWidth) / 2 : VIOLIN_CONFIG.legend.x;
  const legendY = useAbbreviations ? height + 50 : VIOLIN_CONFIG.legend.y;

  const legend = svg.append("g")
    .attr("class", "violin-legend")
    .attr("transform", `translate(${legendX},${legendY})`);
  
  // Male legend
  legend.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", VIOLIN_CONFIG.legend.rectSize)
    .attr("height", VIOLIN_CONFIG.legend.rectSize)
    .attr("fill", VIOLIN_CONFIG.violin.maleFill)
    .attr("opacity", VIOLIN_CONFIG.violin.opacity);
  
  legend.append("text")
    .attr("x", VIOLIN_CONFIG.legend.rectSize + 5)
    .attr("y", VIOLIN_CONFIG.legend.rectSize / 2)
    .attr("dy", "0.35em")
    .style("font-size", VIOLIN_CONFIG.legend.fontSize)
    .style("fill", VIOLIN_CONFIG.axis.color)
    .text("Male");
  
  // Female legend
  legend.append("rect")
    .attr("x", VIOLIN_CONFIG.legend.spacing)
    .attr("y", 0)
    .attr("width", VIOLIN_CONFIG.legend.rectSize)
    .attr("height", VIOLIN_CONFIG.legend.rectSize)
    .attr("fill", VIOLIN_CONFIG.violin.femaleFill)
    .attr("opacity", VIOLIN_CONFIG.violin.opacity);
  
  legend.append("text")
    .attr("x", VIOLIN_CONFIG.legend.spacing + VIOLIN_CONFIG.legend.rectSize + 5)
    .attr("y", VIOLIN_CONFIG.legend.rectSize / 2)
    .attr("dy", "0.35em")
    .style("font-size", VIOLIN_CONFIG.legend.fontSize)
    .style("fill", VIOLIN_CONFIG.axis.color)
    .text("Female");
  
  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "600")
    .style("fill", VIOLIN_CONFIG.axis.color)
    .text("Fatality Demographics by Road User Type and Gender");
  
  // Prepare violin data for interactions
  const violinData = [];
  roadUserTypes.forEach(roadUser => {
    const maleCount = groupedData.get(roadUser)?.get('Male')?.length || 0;
    const femaleCount = groupedData.get(roadUser)?.get('Female')?.length || 0;
    
    violinData.push({
      roadUser: roadUser,
      gender: 'Male',
      count: maleCount
    });
    
    violinData.push({
      roadUser: roadUser,
      gender: 'Female',
      count: femaleCount
    });
  });
  
  // Setup interactions (including zoom and brush)
  setupViolinInteractions(svg, violinContainer, violinData, VIOLIN_CONFIG, {
    y,
    yAxisGroup,
    width,
    height
  });
}
//Chart 3 End
