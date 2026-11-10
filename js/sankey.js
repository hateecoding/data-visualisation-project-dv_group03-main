//Chart 4 - Sankey Diagram
// D3.js v7 compatible Sankey layout algorithm and chart implementation
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { setupSankeyInteractions } from './interaction.js';

function createSankey() { //before d3.sankey = function() {
  var sankey = {},
      nodeWidth = 24,
      nodePadding = 8,
      size = [1, 1],
      nodes = [],
      links = [];

  sankey.nodeWidth = function(_) {
    if (!arguments.length) return nodeWidth;
    nodeWidth = +_;
    return sankey;
  };

  sankey.nodePadding = function(_) {
    if (!arguments.length) return nodePadding;
    nodePadding = +_;
    return sankey;
  };

  sankey.nodes = function(_) {
    if (!arguments.length) return nodes;
    nodes = _;
    return sankey;
  };

  sankey.links = function(_) {
    if (!arguments.length) return links;
    links = _;
    return sankey;
  };

  sankey.size = function(_) {
    if (!arguments.length) return size;
    size = _;
    return sankey;
  };

  sankey.layout = function(iterations) {
    computeNodeLinks();
    computeNodeValues();
    computeNodeBreadths();
    computeNodeDepths(iterations);
    computeLinkDepths();
    return sankey;
  };

  sankey.relayout = function() {
    computeLinkDepths();
    return sankey;
  };

  sankey.link = function() {
    var curvature = .5;

    function link(d) {
      var x0 = d.source.x + d.source.dx,
          x1 = d.target.x,
          xi = d3.interpolateNumber(x0, x1),
          x2 = xi(curvature),
          x3 = xi(1 - curvature),
          y0 = d.source.y + d.sy + d.dy / 2,
          y1 = d.target.y + d.ty + d.dy / 2;
      return "M" + x0 + "," + y0
           + "C" + x2 + "," + y0
           + " " + x3 + "," + y1
           + " " + x1 + "," + y1;
    }

    link.curvature = function(_) {
      if (!arguments.length) return curvature;
      curvature = +_;
      return link;
    };

    return link;
  };

  // Populate the sourceLinks and targetLinks for each node.
  // Also, if the source and target are not objects, assume they are indices.
  function computeNodeLinks() {
    nodes.forEach(function(node) {
      node.sourceLinks = [];
      node.targetLinks = [];
    });
    links.forEach(function(link) {
      var source = link.source,
          target = link.target;
      if (typeof source === "number") source = link.source = nodes[link.source];
      if (typeof target === "number") target = link.target = nodes[link.target];
      source.sourceLinks.push(link);
      target.targetLinks.push(link);
    });
  }

  // Compute the value (size) of each node by summing the associated links.
  function computeNodeValues() {
    nodes.forEach(function(node) {
      node.value = Math.max(
        d3.sum(node.sourceLinks, value),
        d3.sum(node.targetLinks, value)
      );
    });
  }

  // Iteratively assign the breadth (x-position) for each node.
  // Nodes are assigned the maximum breadth of incoming neighbors plus one;
  // nodes with no incoming links are assigned breadth zero, while
  // nodes with no outgoing links are assigned the maximum breadth.
  function computeNodeBreadths() {
    var remainingNodes = nodes,
        nextNodes,
        x = 0;

    while (remainingNodes.length) {
      nextNodes = [];
      remainingNodes.forEach(function(node) {
        node.x = x;
        node.dx = nodeWidth;
        node.sourceLinks.forEach(function(link) {
          if (nextNodes.indexOf(link.target) < 0) {
            nextNodes.push(link.target);
          }
        });
      });
      remainingNodes = nextNodes;
      ++x;
    }

    moveSinksRight(x);
    scaleNodeBreadths((size[0] - nodeWidth) / (x - 1));
  }

  function moveSinksRight(x) {
    nodes.forEach(function(node) {
      if (!node.sourceLinks.length) {
        node.x = x - 1;
      }
    });
  }

  function scaleNodeBreadths(kx) {
    nodes.forEach(function(node) {
      node.x *= kx;
    });
  }

  function computeNodeDepths(iterations) {
    // Group nodes by breadth (x position) - D3 v7 compatible
    var nodesByBreadth = d3.group(nodes, d => d.x);
    nodesByBreadth = Array.from(nodesByBreadth.entries())
        .sort((a, b) => d3.ascending(a[0], b[0]))
        .map(d => d[1]);

    initializeNodeDepth();
    resolveCollisions();
    for (var alpha = 1; iterations > 0; --iterations) {
      relaxRightToLeft(alpha *= .99);
      resolveCollisions();
      relaxLeftToRight(alpha);
      resolveCollisions();
    }

    function initializeNodeDepth() {
      var ky = d3.min(nodesByBreadth, function(nodes) {
        return (size[1] - (nodes.length - 1) * nodePadding) / d3.sum(nodes, value);
      });

      nodesByBreadth.forEach(function(nodes) {
        nodes.forEach(function(node, i) {
          node.y = i;
          node.dy = node.value * ky;
        });
      });

      links.forEach(function(link) {
        link.dy = link.value * ky;
      });
    }

    function relaxLeftToRight(alpha) {
      nodesByBreadth.forEach(function(nodes, breadth) {
        nodes.forEach(function(node) {
          if (node.targetLinks.length) {
            var y = d3.sum(node.targetLinks, weightedSource) / d3.sum(node.targetLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedSource(link) {
        return center(link.source) * link.value;
      }
    }

    function relaxRightToLeft(alpha) {
      nodesByBreadth.slice().reverse().forEach(function(nodes) {
        nodes.forEach(function(node) {
          if (node.sourceLinks.length) {
            var y = d3.sum(node.sourceLinks, weightedTarget) / d3.sum(node.sourceLinks, value);
            node.y += (y - center(node)) * alpha;
          }
        });
      });

      function weightedTarget(link) {
        return center(link.target) * link.value;
      }
    }

    function resolveCollisions() {
      nodesByBreadth.forEach(function(nodes) {
        var node,
            dy,
            y0 = 0,
            n = nodes.length,
            i;

        // Push any overlapping nodes down.
        nodes.sort(ascendingDepth);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dy = y0 - node.y;
          if (dy > 0) node.y += dy;
          y0 = node.y + node.dy + nodePadding;
        }

        // If the bottommost node goes outside the bounds, push it back up.
        dy = y0 - nodePadding - size[1];
        if (dy > 0) {
          y0 = node.y -= dy;

          // Push any overlapping nodes back up.
          for (i = n - 2; i >= 0; --i) {
            node = nodes[i];
            dy = node.y + node.dy + nodePadding - y0;
            if (dy > 0) node.y -= dy;
            y0 = node.y;
          }
        }
      });
    }

    function ascendingDepth(a, b) {
      return a.y - b.y;
    }
  }

  function computeLinkDepths() {
    nodes.forEach(function(node) {
      node.sourceLinks.sort(ascendingTargetDepth);
      node.targetLinks.sort(ascendingSourceDepth);
    });
    nodes.forEach(function(node) {
      var sy = 0, ty = 0;
      node.sourceLinks.forEach(function(link) {
        link.sy = sy;
        sy += link.dy;
      });
      node.targetLinks.forEach(function(link) {
        link.ty = ty;
        ty += link.dy;
      });
    });

    function ascendingSourceDepth(a, b) {
      return a.source.y - b.source.y;
    }

    function ascendingTargetDepth(a, b) {
      return a.target.y - b.target.y;
    }
  }

  function center(node) {
    return node.y + node.dy / 2;
  }

  function value(link) {
    return link.value;
  }

  return sankey;
};

// Main Sankey Chart function
export function SankeyChart(data, config) {
  const { width, height, marginTop, marginRight, marginBottom, marginLeft } = config;

  var units = "%";
  
  // Format variables
  var formatNumber = d3.format(",.1f"),
      format = function(d) { return formatNumber(d) + units; };

  // Prepare graph structure
  const graph = { nodes: [], links: [] };
  
  // Get all unique jurisdictions and sort them
  const jurisdictions = [...new Set(data.map(d => d.jurisdiction))].sort();
  
  // Define custom color scheme
  const stateColorScheme = [
    '#4e79a7', '#f28e2c', '#e15759', '#76b7b2',
    '#59a14f', '#edc949', '#af7aa1', '#ff9da7'
  ];
  
  const color = d3.scaleOrdinal()
    .domain(jurisdictions.concat(['Enforcement Actions', 'Driver Fatalities']))
    .range(stateColorScheme.concat(['#2c5f8d', '#c44e52']));
  
  // Build nodes: source -> states -> target
  graph.nodes.push({ name: "Enforcement Actions" });
  jurisdictions.forEach(jurisdiction => graph.nodes.push({ name: jurisdiction }));
  graph.nodes.push({ name: "Driver Fatalities" });

  // Build links in single pass
  data.forEach(d => {
    if (d.enforcementPercent > 0) {
      graph.links.push({
        source: "Enforcement Actions",
        target: d.jurisdiction,
        value: +d.enforcementPercent
      });
    }
    if (d.fatalitiesPercent > 0) {
      graph.links.push({
        source: d.jurisdiction,
        target: "Driver Fatalities",
        value: +d.fatalitiesPercent
      });
    }
  });

  // Convert node names to unique array
  graph.nodes = Array.from(new Set(graph.nodes.map(d => d.name)));

  // Convert link references to indices
  graph.links.forEach((link, i) => {
    graph.links[i].source = graph.nodes.indexOf(link.source);
    graph.links[i].target = graph.nodes.indexOf(link.target);
  });

  // Convert nodes to objects
  graph.nodes = graph.nodes.map(name => ({ name }));

  // Create SVG
  var svg = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "svg"))
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("class", "sankey-svg");

  // Set the sankey diagram properties
  var sankey = createSankey()
    .nodeWidth(config.nodeWidth || 36)
    .nodePadding(config.nodePadding || 40)
    .size([width - marginLeft - marginRight, height - marginTop - marginBottom]);

  var path = sankey.link();

  sankey
    .nodes(graph.nodes)
    .links(graph.links)
    .layout(32);

  // Adjust Northern Territory node height to be shorter
  graph.nodes.forEach(node => {
    if (node.name === "Northern Territory") {
      const originalHeight = node.dy;
      node.dy = originalHeight * 0.5; // Make it 50% of original height
      
      // Adjust connected links
      node.sourceLinks.forEach(link => {
        link.sy = link.sy * 0.5;
        link.dy = link.dy * 0.5;
      });
      node.targetLinks.forEach(link => {
        link.ty = link.ty * 0.5;
        link.dy = link.dy * 0.5;
      });
    }
  });

  // Create gradients for links
  const defs = svg.append("defs");
  
  graph.links.forEach((link, i) => {
    const gradient = defs.append("linearGradient")
      .attr("id", `gradient-${i}`)
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", link.source.x + link.source.dx)
      .attr("x2", link.target.x);
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", color(link.source.name))
      .attr("stop-opacity", 0.4);
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", color(link.target.name))
      .attr("stop-opacity", 0.4);
  });

  // Add links
  const link = svg.append("g")
    .attr("transform", `translate(${marginLeft},${marginTop})`)
    .selectAll(".link")
    .data(graph.links)
    .enter().append("path")
    .attr("class", "link")
    .attr("d", path)
    .attr("stroke-width", d => Math.max(1, d.dy))
    .attr("stroke", (d, i) => `url(#gradient-${i})`)
    .sort((a, b) => b.dy - a.dy);

  // Add nodes
  const node = svg.append("g")
    .attr("transform", `translate(${marginLeft},${marginTop})`)
    .selectAll(".node")
    .data(graph.nodes)
    .enter().append("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  // Add node rectangles
  node.append("rect")
    .attr("height", d => d.dy)
    .attr("width", sankey.nodeWidth())
    .attr("rx", 3)
    .attr("ry", 3)
    .attr("fill", d => d.color = color(d.name))
    .attr("stroke", d => d3.rgb(d.color).darker(1.5));

  // Add node labels
  node.append("text")
    .attr("x", -6)
    .attr("y", d => d.dy / 2)
    .attr("dy", ".35em")
    .attr("text-anchor", "end")
    .attr("font-size", config.labelFontSize || "13px")
    .text(d => d.name)
    .filter(d => d.x < (width - marginLeft - marginRight) / 2)
    .attr("x", 6 + sankey.nodeWidth())
    .attr("text-anchor", "start");

  // Return the chart with scales and data
  const node_element = svg.node();
  node_element.scales = { color };
  node_element.chartElements = { graph, nodes: graph.nodes, links: graph.links };
  return node_element;
}

// Renders a Sankey chart into a container element
export function renderSankey(container, data, config) {
  // Clear any existing content in the container
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  if (!containerElement) {
    console.error('Container not found:', container);
    return null;
  }
  
  containerElement.innerHTML = '';

  // Create the Sankey chart with all data
  const chart = SankeyChart(data, config);

  // Append the chart to the container
  containerElement.appendChild(chart);

  // Get the SVG element for adding interactions
  const svg = d3.select(chart);

  // Add legend
  addSankeyLegend(svg, chart.scales, config);

  // Set up interactions
  setupSankeyInteractions(svg, data, config, chart);

  return chart;
}

// Adds a legend to the Sankey chart
function addSankeyLegend(svg, scales, config) {
  const legendConfig = config.legend;
  if (!legendConfig) return;
  
  const { x, y, title, swatchSize } = legendConfig;

  // Create legend group
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${x}, ${y})`);

  // Add legend title
  legend.append("text")
    .attr("x", 0)
    .attr("y", 0)
    .attr("fill", "currentColor")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .attr("font-size", config.legendTitleFontSize)
    .text(title);

  // Flow types legend
  const flowTypes = [
    { id: 'Enforcement Actions', label: 'Enforcement Actions', color: '#2c5f8d' },
    { id: 'Driver Fatalities', label: 'Driver Fatalities', color: '#c44e52' }
  ];
  const flowItems = legend.selectAll(".flow-legend")
    .data(flowTypes)
    .enter().append("g")
    .attr("class", "flow-legend")
    .attr("transform", (d, i) => `translate(0, ${i * 30 + 30})`);

  flowItems.append("rect")
    .attr("width", swatchSize)
    .attr("height", swatchSize)
    .attr("rx", 2)
    .attr("ry", 2)
    .attr("fill", d => d.color)
    .attr("stroke", d => d3.rgb(d.color).darker(1))
    .attr("stroke-width", 1.5);

  flowItems.append("text")
    .attr("x", swatchSize + 8)
    .attr("y", swatchSize / 2)
    .attr("dy", "0.35em")
    .attr("font-size", config.legendItemFontSize)
    .attr("font-weight", "600")
    .attr("fill", "#333")
    .text(d => d.label);
}
//Chart 4 End
