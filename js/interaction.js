// Import d3 for interactions and event handling
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

//Chart 1
// Globe interaction functions
export function setupGlobeInteractions(svg, projection, mapGroup, isGlobeView, currentRotation, sensitivity, showTooltip, hideTooltip, zoomToAustralia) {
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
        
        projection.rotate(newRotation);
        currentRotation = newRotation;
        
        // Update all paths
        mapGroup.selectAll("path").attr("d", d3.geoPath().projection(projection));
      }
    });
  
  svg.call(drag);
  
  // Add zoom interaction
  const zoom = d3.zoom()
    .scaleExtent([0.5, 8])
    .on("zoom", function(event) {
      if (isGlobeView) {
        const { transform } = event;
        projection.scale(transform.k * 750);
        
        // Update globe circle
        svg.select("circle").attr("r", projection.scale());
        
        // Update all paths
        mapGroup.selectAll("path").attr("d", d3.geoPath().projection(projection));
      }
    });
  
  svg.call(zoom);
  
  return { drag, zoom };
}

export function setupGlobeTooltip() {
  // Tooltip functions
  function showTooltip(event, stateName, stateData, yearSelect) {
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
    
    const selectedYear = yearSelect.property("value");
    const yearText = selectedYear === 'all' ? '(2020-2024)' : `(${selectedYear})`;
    
    const content = stateData 
      ? `<strong>${stateName}</strong><br/>
         Avg. fatalities per 100k ${yearText}: ${stateData.fatalities_per_100k.toFixed(1)}<br/>
         Total fatalities ${yearText}: ${stateData.total_fatalities}`
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
  
  return { showTooltip, hideTooltip };
}
//Chart 1 End






















//Chart 2
// Sunburst chart interactions
export function setupSunburstInteractions(svg, elements) {
  const { root, arc, radius, path, label, parent } = elements;

  // Create tooltip
  let tooltip = d3.select('.sunburst-tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body')
      .append('div')
      .attr('class', 'sunburst-tooltip');
  }

  // Add hover interactions to arcs
  path
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      // Lighten only the hovered arc by increasing brightness
      d3.select(this)
        .style("filter", "brightness(1.25)");

      // Build tooltip content based on depth
      const format = d3.format(",");
      let content = '';
      
      if (d.depth === 1) {
        // Year level
        content = `
          <div style="font-weight: bold; margin-bottom: 5px;">Year: ${d.data.name}</div>
          <div>Total Fatalities: <strong>${format(d.value)}</strong></div>
        `;
      } else if (d.depth === 2) {
        // Age group level
        const year = d.parent.data.name;
        const percentage = ((d.value / d.parent.value) * 100).toFixed(1);
        content = `
          <div style="font-weight: bold; margin-bottom: 5px;">${year}</div>
          <div>Age Group: <strong>${d.data.name}</strong></div>
          <div>Fatalities: <strong>${format(d.value)}</strong> (${percentage}%)</div>
        `;
      } else if (d.depth === 3) {
        // Jurisdiction level
        const year = d.parent.parent.data.name;
        const ageGroup = d.parent.data.name;
        const percentage = ((d.value / d.parent.value) * 100).toFixed(1);
        content = `
          <div style="font-weight: bold; margin-bottom: 5px;">${year} - ${ageGroup}</div>
          <div>Jurisdiction: <strong>${d.data.name}</strong></div>
          <div>Fatalities: <strong>${format(d.value)}</strong> (${percentage}%)</div>
        `;
      }
      
      // Show tooltip
      tooltip
        .style('visibility', 'visible')
        .html(content);
    })
    .on("mousemove", function(event) {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on("mouseout", function(event, d) {
      // Restore hovered arc to its default appearance
      d3.select(this)
        .style("filter", null);

      // Hide tooltip
      tooltip.style('visibility', 'hidden');
    })
    .on("click", clicked);

  // Center circle click to reset
  parent.on("click", clicked);

  // Handle zoom on click
  function clicked(event, p) {
    parent.datum(p.parent || root);

    // Update insights based on clicked segment
    updateInsights(p);

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    });

    const t = svg.transition().duration(750);

    // Transition the arcs
    path.transition(t)
      .tween("data", d => {
        const i = d3.interpolate(d.current, d.target);
        return t => d.current = i(t);
      })
      .filter(function(d) {
        return +this.getAttribute("fill-opacity") || arcVisible(d.target);
      })
      .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
      .attr("pointer-events", d => arcVisible(d.target) ? "auto" : "none")
      .attrTween("d", d => () => arc(d.current));

    // Transition the labels
    label.filter(function(d) {
        return +this.getAttribute("fill-opacity") || labelVisible(d.target);
      }).transition(t)
      .attr("fill-opacity", d => +labelVisible(d.target))
      .attrTween("transform", d => () => labelTransform(d.current));
  }

  // Update insights based on clicked segment
  function updateInsights(node) {
    const insightsContainer = document.getElementById('chart2-dynamic-insights');
    if (!insightsContainer) return;

    const format = d3.format(",");
    
    // If root level (reset), show default message
    if (!node.parent) {
      insightsContainer.innerHTML = `
        <p><strong>Structure:</strong><br>
        • Inner ring: Years (2020-2024)<br>
        • Middle ring: Age groups<br>
        • Outer ring: Jurisdictions</p>
        
        <p><strong>Interaction:</strong> Click any segment to zoom in and explore. Click the center circle to zoom back out and return to the full view.</p>
      `;
      return;
    }

    let html = '';
    
    // Year level (depth 1)
    if (node.depth === 1) {
      const year = node.data.name;
      const total = node.value;
      const children = node.children || [];
      
      html = `
        <p><strong>Year: ${year}</strong></p>
        <p>Total fatalities: <strong>${format(total)}</strong></p>
        <p>This year's data is broken down into ${children.length} age groups.</p>
        <p><em>Click an age group segment to explore further, or click the center to return.</em></p>
      `;
    }
    
    // Age group level (depth 2)
    else if (node.depth === 2) {
      const ageGroup = node.data.name;
      const year = node.parent.data.name;
      const total = node.value;
      const children = node.children || [];
      const yearTotal = node.parent.value;
      const percentage = ((total / yearTotal) * 100).toFixed(1);
      
      html = `
        <p><strong>${year} - ${ageGroup}</strong></p>
        <p>Fatalities: <strong>${format(total)}</strong> (${percentage}% of ${year})</p>
        <p>This age group's fatalities span across ${children.length} jurisdictions.</p>
        <p><em>Click a jurisdiction segment to see details, or click the center to return.</em></p>
      `;
    }
    
    // Jurisdiction level (depth 3)
    else if (node.depth === 3) {
      const jurisdiction = node.data.name;
      const ageGroup = node.parent.data.name;
      const year = node.parent.parent.data.name;
      const total = node.value;
      const ageGroupTotal = node.parent.value;
      const percentage = ((total / ageGroupTotal) * 100).toFixed(1);
      
      html = `
        <p><strong>${year} - ${ageGroup} - ${jurisdiction}</strong></p>
        <p>Fatalities: <strong>${format(total)}</strong></p>
        <p>This represents ${percentage}% of the ${ageGroup} age group in ${year}.</p>
        <p><em>Click the center to zoom back out.</em></p>
      `;
    }
    
    insightsContainer.innerHTML = html;
  }

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
}
//Chart 2 End


















//Chart 3
// Violin Chart interaction functions
export function setupViolinInteractions(svg, violinContainer, data, config, scales) {
  const { y, yAxisGroup, width, height } = scales;
  
  // Create tooltip
  let tooltip = d3.select('.violin-tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body')
      .append('div')
      .attr('class', 'violin-tooltip');
  }
  
  // Add hover interactions to violins
  svg.selectAll('.violin')
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      // Lighten only the hovered violin using a brightness filter (keep base opacity)
      d3.select(this)
        .style('filter', 'brightness(1.25)');

      // Get data from attributes
      const roadUser = d3.select(this).attr('data-roaduser');
      const gender = d3.select(this).attr('data-gender');
      const count = d3.select(this).attr('data-count');
      
      // Show tooltip with formatted content
      const format = d3.format(",");
      tooltip
        .style('visibility', 'visible')
        .html(`
          <div style="font-weight: bold; margin-bottom: 5px;">${roadUser}</div>
          <div>Gender: <strong>${gender}</strong></div>
          <div>Fatalities: <strong>${format(count)}</strong></div>
        `);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', function() {
      // Restore violin appearance for hover state
      d3.select(this)
        .style('filter', null);

      // Hide tooltip
      tooltip.style('visibility', 'hidden');
    });
  
  // Add click interaction to highlight specific road user type
  svg.selectAll('.violin')
    .on('click', function(event) {
      event.stopPropagation();
      
      const roadUser = d3.select(this).attr('data-roaduser');
      
      // Dim all violins
      svg.selectAll('.violin')
        .style('opacity', 0.2);
      
      // Highlight selected road user type (both male and female)
      svg.selectAll(`.violin[data-roaduser="${roadUser}"]`)
        .style('opacity', config.violin.hoverOpacity);
    });
  
  // Click on SVG background to reset highlight
  svg.on('click', function() {
    svg.selectAll('.violin')
      .style('opacity', config.violin.opacity);
  });
  
  // Add brush for zooming (Y-axis only)
  if (config.zoom.enabled) {
    // Create brush
    const brush = d3.brushY()
      .extent([[0, 0], [width, height]])
      .on("end", brushed);
    
    // Add brush to a separate layer (under violins so tooltips still work)
    const brushLayer = svg.insert("g", ":first-child")
      .attr("class", "brush")
      .call(brush);
    
    // Store original Y domain for reset
    const originalYDomain = y.domain();
    
    function brushed(event) {
      const selection = event.selection;
      
      // If no selection (user didn't drag), do nothing
      if (!selection) return;
      
      // Get the Y-axis range from brush selection
      const [y1, y0] = selection.map(y.invert);
      
      // Update Y scale domain
      y.domain([y0, y1]);
      
      // Remove brush selection
      brushLayer.call(brush.move, null);
      
      // Update Y axis with transition
      yAxisGroup.transition()
        .duration(config.zoom.transitionDuration)
        .call(d3.axisLeft(y).ticks(8));
      
      // Update all violin paths with new Y scale
      svg.selectAll('.violin')
        .transition()
        .duration(config.zoom.transitionDuration)
        .attr('d', function() {
          const bins = d3.select(this).datum();
          const gender = d3.select(this).attr('data-gender');
          
          // Get x position info
          const roadUser = d3.select(this).attr('data-roaduser');
          const xBand = d3.scaleBand()
            .range([0, width])
            .domain(data.map(d => d.roadUser).filter((v, i, a) => a.indexOf(v) === i))
            .padding(config.padding);
          
          // Calculate max bin length for this violin's x scale
          const maxBinLength = d3.max(bins, b => b.length) || 1;
          const xNum = d3.scaleLinear()
            .range([0, xBand.bandwidth() / 2])
            .domain([0, maxBinLength]);
          
          // Create area generator based on gender
          if (gender === 'Male') {
            return d3.area()
              .x0(d => xBand.bandwidth() / 2 - xNum(d.length))
              .x1(d => xBand.bandwidth() / 2)
              .y(d => y(d.x0))
              .curve(d3[config.curve])(bins);
          } else {
            return d3.area()
              .x0(d => xBand.bandwidth() / 2)
              .x1(d => xBand.bandwidth() / 2 + xNum(d.length))
              .y(d => y(d.x0))
              .curve(d3[config.curve])(bins);
          }
        });
    }
    
    // Double-click to reset zoom
    svg.on('dblclick', function() {
      // Reset Y domain
      y.domain(originalYDomain);
      
      // Update Y axis
      yAxisGroup.transition()
        .duration(config.zoom.transitionDuration)
        .call(d3.axisLeft(y).ticks(8));
      
      // Reset all violin paths
      svg.selectAll('.violin')
        .transition()
        .duration(config.zoom.transitionDuration)
        .attr('d', function() {
          const bins = d3.select(this).datum();
          const gender = d3.select(this).attr('data-gender');
          
          const roadUser = d3.select(this).attr('data-roaduser');
          const xBand = d3.scaleBand()
            .range([0, width])
            .domain(data.map(d => d.roadUser).filter((v, i, a) => a.indexOf(v) === i))
            .padding(config.padding);
          
          const maxBinLength = d3.max(bins, b => b.length) || 1;
          const xNum = d3.scaleLinear()
            .range([0, xBand.bandwidth() / 2])
            .domain([0, maxBinLength]);
          
          if (gender === 'Male') {
            return d3.area()
              .x0(d => xBand.bandwidth() / 2 - xNum(d.length))
              .x1(d => xBand.bandwidth() / 2)
              .y(d => y(d.x0))
              .curve(d3[config.curve])(bins);
          } else {
            return d3.area()
              .x0(d => xBand.bandwidth() / 2)
              .x1(d => xBand.bandwidth() / 2 + xNum(d.length))
              .y(d => y(d.x0))
              .curve(d3[config.curve])(bins);
          }
        });
    });
  }
}

// Chart 3 - Year Filter Setup
export function setupChart3YearFilter(containerId, years, onFilterChange) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  // Create checkbox filter
  function createCheckboxFilter(container, items, idPrefix) {
    // Add Select All checkbox
    const selectAllWrapper = document.createElement('div');
    selectAllWrapper.className = 'filter-checkbox-item';
    
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = `${idPrefix}-select-all`;
    selectAllCheckbox.value = '__select_all__';
    selectAllCheckbox.checked = true;
    
    const selectAllLabel = document.createElement('label');
    selectAllLabel.htmlFor = `${idPrefix}-select-all`;
    selectAllLabel.textContent = 'Select All';
    selectAllLabel.style.fontWeight = 'bold';
    
    selectAllWrapper.appendChild(selectAllCheckbox);
    selectAllWrapper.appendChild(selectAllLabel);
    container.appendChild(selectAllWrapper);
    
    // Add separator
    const separator = document.createElement('div');
    separator.style.borderTop = '2px solid #ddd';
    separator.style.margin = '6px 0';
    container.appendChild(separator);
    
    // Add individual items
    items.forEach((item, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'filter-checkbox-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${idPrefix}-${index}`;
      checkbox.value = item;
      checkbox.checked = true;
      checkbox.className = 'filter-item-checkbox';
      
      const label = document.createElement('label');
      label.htmlFor = `${idPrefix}-${index}`;
      label.textContent = item;
      
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
      
      // Add change listener for individual checkboxes
      checkbox.addEventListener('change', function() {
        updateSelectAllState(container);
        onFilterChange();
      });
    });
    
    // Add change listener for Select All
    selectAllCheckbox.addEventListener('change', function() {
      const isChecked = this.checked;
      container.querySelectorAll('.filter-item-checkbox').forEach(cb => {
        cb.checked = isChecked;
      });
      onFilterChange();
    });
  }
  
  // Function to update Select All checkbox state
  function updateSelectAllState(container) {
    const selectAllCheckbox = container.querySelector('input[value="__select_all__"]');
    const itemCheckboxes = container.querySelectorAll('.filter-item-checkbox');
    const allChecked = Array.from(itemCheckboxes).every(cb => cb.checked);
    
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = allChecked;
    }
  }
  
  // Populate filter
  createCheckboxFilter(container, years, 'chart3-year-checkbox');
  
  // Setup collapsible filter header
  const header = document.querySelector('.collapsible-header[data-filter="chart3-year"]');
  if (header) {
    header.addEventListener('click', function() {
      container.classList.toggle('collapsed');
      this.classList.toggle('expanded');
    });
  }
  
  // Return utility function to get selected values
  return {
    getSelectedYears: () => {
      const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
      return Array.from(checkboxes)
        .map(cb => cb.value)
        .filter(value => value !== '__select_all__')
        .map(v => +v); // Convert to numbers
    }
  };
}

//Chart 3 End



















//Chart 4
export function setupSankeyInteractions(svg, data, config, chartNode) {
  // Add sankey class to SVG for CSS targeting
  svg.classed("sankey-chart", true);

  // Create tooltip
  let tooltip = d3.select('.sankey-tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body')
      .append('div')
      .attr('class', 'sankey-tooltip');
  }

  // Interaction state
  let selectedNode = null;
  let selectedLink = null;

  // Highlight function for nodes (used for click selection)
  function highlightNode(nodeData) {
    if (!nodeData) {
      // Reset all highlighting
      svg.selectAll('.node rect')
        .style('opacity', 1)
        .style('stroke-width', 2)
        .style('filter', null);
      svg.selectAll('.link').style('opacity', 1);
      return;
    }

    // Dim all elements for selection state
    svg.selectAll('.node rect')
      .style('opacity', 0.3)
      .style('stroke-width', 2)
      .style('filter', null);
    svg.selectAll('.link').style('opacity', 0.2);

    // Highlight selected node
    svg.selectAll('.node rect')
      .filter(d => d === nodeData)
      .style('opacity', 1)
      .style('stroke-width', 3);

    // Highlight connected links
    svg.selectAll('.link')
      .filter(d => d.source === nodeData || d.target === nodeData)
      .style('opacity', 1);

    // Highlight connected nodes
    svg.selectAll('.node rect')
      .filter(d => {
        return svg.selectAll('.link')
          .data()
          .some(link => 
            (link.source === nodeData && link.target === d) ||
            (link.target === nodeData && link.source === d)
          );
      })
      .style('opacity', 0.8);
  }

  // Add interactions to nodes
  svg.selectAll('.node rect')
    .on('mouseover', function(event, d) {
      // Lighten hovered node similar to sunburst
      d3.select(this)
        .style('filter', 'brightness(1.25)');

      // Calculate total flow for this node
      const totalFlow = d.value || 0;

      const tooltipContent = `
        <strong>${d.name}</strong><br/>
        Total Flow: ${totalFlow.toFixed(2)}%
      `;

      tooltip
        .style('visibility', 'visible')
        .html(tooltipContent);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', function() {
      // Restore node appearance after hover (selection state handled separately)
      d3.select(this)
        .style('filter', null);
      tooltip.style('visibility', 'hidden');
    })
    .on('click', function(event, d) {
      selectedNode = selectedNode === d ? null : d;
      highlightNode(selectedNode);
    });

  // Add interactions to links
  svg.selectAll('.link')
    .on('mouseover', function(event, d) {
      // Lighten this link similar to sunburst
      d3.select(this)
        .style('filter', 'brightness(1.25)');
      
      const tooltipContent = `
        <strong>${d.source.name} → ${d.target.name}</strong><br/>
        Percentage: ${d.value.toFixed(1)}%
      `;

      tooltip
        .style('visibility', 'visible')
        .html(tooltipContent);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .style('filter', null);
      tooltip.style('visibility', 'hidden');
    })
    .on('click', function(event, d) {
      selectedLink = selectedLink === d ? null : d;
      if (selectedLink) {
        svg.selectAll('.link').style('opacity', 0.2);
        d3.select(this).style('opacity', 1);
      } else {
        svg.selectAll('.link').style('opacity', 1);
      }
    });

  // Add legend interactions
  svg.selectAll('.age-legend, .intervention-legend')
    .style('cursor', 'pointer')
    .on('click', function(event, d) {
      const nodeData = chartNode.chartElements.nodes.find(node => node.name === d);
      if (nodeData) {
        selectedNode = selectedNode === nodeData ? null : nodeData;
        highlightNode(selectedNode);
      }
    });
}

// Chart 4 - Year Filter Setup
export function setupChart4YearFilter(containerId, years, onFilterChange) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  // Create checkbox filter
  function createCheckboxFilter(container, items, idPrefix) {
    // Add Select All checkbox
    const selectAllWrapper = document.createElement('div');
    selectAllWrapper.className = 'filter-checkbox-item';
    
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = `${idPrefix}-select-all`;
    selectAllCheckbox.value = '__select_all__';
    selectAllCheckbox.checked = true;
    
    const selectAllLabel = document.createElement('label');
    selectAllLabel.htmlFor = `${idPrefix}-select-all`;
    selectAllLabel.textContent = 'Select All';
    selectAllLabel.style.fontWeight = 'bold';
    
    selectAllWrapper.appendChild(selectAllCheckbox);
    selectAllWrapper.appendChild(selectAllLabel);
    container.appendChild(selectAllWrapper);
    
    // Add separator
    const separator = document.createElement('div');
    separator.style.borderTop = '2px solid #ddd';
    separator.style.margin = '6px 0';
    container.appendChild(separator);
    
    // Add individual items
    items.forEach((item, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'filter-checkbox-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${idPrefix}-${index}`;
      checkbox.value = item;
      checkbox.checked = true;
      checkbox.className = 'filter-item-checkbox';
      
      const label = document.createElement('label');
      label.htmlFor = `${idPrefix}-${index}`;
      label.textContent = item;
      
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
      
      // Add change listener for individual checkboxes
      checkbox.addEventListener('change', function() {
        updateSelectAllState(container);
        onFilterChange();
      });
    });
    
    // Add change listener for Select All
    selectAllCheckbox.addEventListener('change', function() {
      const isChecked = this.checked;
      container.querySelectorAll('.filter-item-checkbox').forEach(cb => {
        cb.checked = isChecked;
      });
      onFilterChange();
    });
  }
  
  // Function to update Select All checkbox state
  function updateSelectAllState(container) {
    const selectAllCheckbox = container.querySelector('input[value="__select_all__"]');
    const itemCheckboxes = container.querySelectorAll('.filter-item-checkbox');
    const allChecked = Array.from(itemCheckboxes).every(cb => cb.checked);
    
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = allChecked;
    }
  }
  
  // Populate filter
  createCheckboxFilter(container, years, 'chart4-year-checkbox');
  
  // Setup collapsible filter header
  const header = document.querySelector('.collapsible-header[data-filter="chart4-year"]');
  if (header) {
    header.addEventListener('click', function() {
      container.classList.toggle('collapsed');
      this.classList.toggle('expanded');
    });
  }
  
  // Return utility function to get selected values
  return {
    getSelectedYears: () => {
      const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
      return Array.from(checkboxes)
        .map(cb => cb.value)
        .filter(value => value !== '__select_all__')
        .map(v => +v); // Convert to numbers
    }
  };
}
//Chart 4 End




















//Chart 5 - Multi-Donut
export function setupMultiDonutInteractions(svg, data, config, chartNode) {
  // Add multi-donut class to SVG for CSS targeting
  svg.classed("multi-donut", true);

  // Create simple tooltip
  let tooltip = d3.select('.multi-donut-tooltip');
  if (tooltip.empty()) {
    tooltip = d3.select('body')
      .append('div')
      .attr('class', 'multi-donut-tooltip');
  }

  // Add hover interactions to heatmap cells
  svg.selectAll('.heatmap-cell')
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      // Highlight cell on hover
      d3.select(this)
        .attr('stroke', '#000')
        .attr('stroke-width', 2)
        .style('opacity', 0.9);
      
      // Determine risk level based on fatality count
      const riskLevel = d.count >= 30 ? 'High' : d.count >= 15 ? 'Medium' : 'Low';
      const riskColor = d.count >= 30 ? '#e15759' : d.count >= 15 ? '#f28e2c' : '#59a14f';
      
      // Show simple tooltip
      const tooltipContent = `
        <div style="font-weight: bold; margin-bottom: 5px;">${d.weekday} | ${d.time}</div>
        <div>Fatalities: <strong>${d.count}</strong></div>
        <div>Risk Level: <strong style="color: ${riskColor};">${riskLevel}</strong></div>
      `;
      
      tooltip
        .style('visibility', 'visible')
        .html(tooltipContent);
    })
    .on('mousemove', function(event) {
      // Follow mouse position
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', function() {
      // Remove highlight
      d3.select(this)
        .attr('stroke', config.cellStroke)
        .attr('stroke-width', config.cellStrokeWidth)
        .style('opacity', 1);
      
      // Hide tooltip
      tooltip.style('visibility', 'hidden');
    });

  // Add hover effect to time labels
  svg.selectAll('text')
    .filter(function() {
      const text = d3.select(this).text();
      return text.includes('–') && text.length < 10; // Time labels
    })
    .style('cursor', 'pointer')
    .on('mouseover', function() {
      d3.select(this).attr('fill', '#e74c3c').attr('font-size', '15px');
    })
    .on('mouseout', function() {
      d3.select(this).attr('fill', config.timeLabelColor).attr('font-size', config.timeLabelFontSize);
    });
}

// Chart 5 - Filter UI Setup
export function setupChart5Filters(filterContainers, filterData, onFilterChange) {
  const { dayFilterContainer, roadTypeFilterContainer, ageFilterContainer } = filterContainers;
  const { days, roadTypes, ageGroups } = filterData;
  
  // Function to create checkbox filter with Select All as first option
  function createCheckboxFilter(container, items, idPrefix) {
    // Add "Select All" as first checkbox
    const selectAllWrapper = document.createElement('div');
    selectAllWrapper.className = 'filter-checkbox-item select-all-item';
    
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = `${idPrefix}-select-all`;
    selectAllCheckbox.value = '__select_all__';
    selectAllCheckbox.checked = true;
    
    const selectAllLabel = document.createElement('label');
    selectAllLabel.htmlFor = `${idPrefix}-select-all`;
    selectAllLabel.textContent = 'Select All';
    selectAllLabel.style.fontWeight = 'bold';
    
    selectAllWrapper.appendChild(selectAllCheckbox);
    selectAllWrapper.appendChild(selectAllLabel);
    container.appendChild(selectAllWrapper);
    
    // Add separator
    const separator = document.createElement('div');
    separator.style.borderTop = '2px solid #ddd';
    separator.style.margin = '6px 0';
    container.appendChild(separator);
    
    // Add individual items
    items.forEach((item, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'filter-checkbox-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `${idPrefix}-${index}`;
      checkbox.value = item;
      checkbox.checked = true;
      checkbox.className = 'filter-item-checkbox';
      
      const label = document.createElement('label');
      label.htmlFor = `${idPrefix}-${index}`;
      label.textContent = item;
      
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
      
      // Add change listener for individual checkboxes
      checkbox.addEventListener('change', function() {
        updateSelectAllState(container);
        onFilterChange();
      });
    });
    
    // Add change listener for Select All
    selectAllCheckbox.addEventListener('change', function() {
      const isChecked = this.checked;
      container.querySelectorAll('.filter-item-checkbox').forEach(cb => {
        cb.checked = isChecked;
      });
      onFilterChange();
    });
  }
  
  // Function to update Select All checkbox state
  function updateSelectAllState(container) {
    const selectAllCheckbox = container.querySelector('input[value="__select_all__"]');
    const itemCheckboxes = container.querySelectorAll('.filter-item-checkbox');
    const allChecked = Array.from(itemCheckboxes).every(cb => cb.checked);
    
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = allChecked;
    }
  }
  
  // Populate filters
  createCheckboxFilter(dayFilterContainer, days, 'day-checkbox');
  createCheckboxFilter(roadTypeFilterContainer, roadTypes, 'roadtype-checkbox');
  createCheckboxFilter(ageFilterContainer, ageGroups, 'age-checkbox');
  
  // Setup collapsible filter headers
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', function() {
      const filterType = this.getAttribute('data-filter');
      let container;
      
      if (filterType === 'day') container = dayFilterContainer;
      else if (filterType === 'roadtype') container = roadTypeFilterContainer;
      else if (filterType === 'age') container = ageFilterContainer;
      
      if (container) {
        container.classList.toggle('collapsed');
        this.classList.toggle('expanded');
      }
    });
  });
  
  // Return utility function to get selected values
  return {
    getSelectedValues: (container) => {
      const checkboxes = container.querySelectorAll('input[type="checkbox"]:checked');
      return Array.from(checkboxes)
        .map(cb => cb.value)
        .filter(value => value !== '__select_all__');
    }
  };
}

// Chart 5 - Year Slider Setup
export function setupChart5YearSlider(elementId, years, onUpdate) {
  const sliderElement = document.getElementById(elementId);
  if (!sliderElement) return null;
  
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  
  if (sliderElement.noUiSlider) sliderElement.noUiSlider.destroy();
  
  noUiSlider.create(sliderElement, {
    start: [minYear, maxYear],
    connect: true,
    step: 1,
    range: { min: minYear, max: maxYear },
    pips: { mode: 'steps', density: 100 }
  });
  
  sliderElement.noUiSlider.on('update', onUpdate);
  
  return {
    getYearRange: () => sliderElement.noUiSlider.get().map(v => Math.round(parseFloat(v)))
  };
}
//Chart 5 End

