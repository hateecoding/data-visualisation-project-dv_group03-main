//Here is all the Chart Configurations

// Import d3 for color interpolation
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

//Chart 1
// Globe visualization configuration
export const GLOBE_CONFIG = {
  // Dimensions
  width: null, // Auto-calculated from container
  height: 500,
  sensitivity: 75,
  
  // Projection settings
  projection: {
    scale: 750,
    center: [0, 0],
    rotate: [-135, 27], // Rotate to show Australia in center
    initialScale: 750
  },
  
  // Australia view projection
  australiaProjection: {
    center: [133, -27],
    scale: 1200
  },
  
  // Color scale configuration
  colorInterpolator: d3.interpolateRgb("#ffd4d4", "#800000"),
  
  // Globe styling
  globe: {
    fill: "#e6f3ff",
    stroke: "#333",
    strokeWidth: "0.5"
  },
  
  // State styling
  states: {
    stroke: "#ffffff",
    strokeWidth: 0.5,
    opacity: 0.9,
    hoverOpacity: 1
  },
  
  // Legend configuration
  legend: {
    width: 200,
    height: 20,
    x: -220, // Relative to right edge
    y: 20,
    title: "Fatalities per 100k",
    tickInterval: 5
  },
  
  // Year filter configuration
  yearFilter: {
    marginBottom: "10px",
    textAlign: "left",
    label: {
      marginRight: "10px",
      fontWeight: "bold",
      text: "Year:"
    },
    select: {
      padding: "5px",
      border: "1px solid #ccc",
      borderRadius: "4px",
      fontSize: "14px"
    }
  },
  
  // Back button configuration
  backButton: {
    x: 20,
    y: 20,
    width: 80,
    height: 30,
    rx: 5,
    fill: "#007bff",
    stroke: "#0056b3",
    strokeWidth: 1,
    textColor: "white",
    fontSize: "12px",
    fontWeight: "bold"
  },
  
  // Instructions styling
  instructions: {
    textAlign: "center",
    marginTop: "10px",
    fontSize: "14px",
    color: "#666"
  }
};

//Chart 1 End












//Chart 2
// Sunburst Chart configuration
export const SUNBURST_CONFIG = {
  // Dimensions
  width: 700,
  height: 700,
  
  // Color scheme for years
  colorScheme: ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6']
};
//Chart 2 End
















//Chart 3
// Violin Chart configuration
export const VIOLIN_CONFIG = {
  // Dimensions
  margin: { 
    top: 40, 
    right: 50, 
    bottom: window.innerWidth < 1024 ? 120 : 80,  // Extra bottom margin for mobile/tablet legend
    left: 60 
  },
  width: 1000,
  height: 700,
  
  // Violin styling
  violin: {
    maleFill: '#4e79a7',
    femaleFill: '#e15759',
    stroke: '#333',
    strokeWidth: 1,
    opacity: 0.7,
    hoverOpacity: 0.9
  },
  
  // Axis styling
  axis: {
    fontSize: '12px',
    color: '#333',
    tickColor: '#666'
  },
  
  // Legend
  legend: {
    x: 300,
    y: 620,
    spacing: 60,
    fontSize: '14px',
    rectSize: 15
  },
  
  // Bins for histogram
  binCount: 25,
  
  // Curve type for violin shape
  curve: 'curveCatmullRom', // Options: curveCatmullRom, curveStep, curveLinear
  
  // Padding between violins
  padding: 0.2,
  
  // Zoom configuration
  zoom: {
    enabled: true,
    transitionDuration: 750
  }
};
//Chart 3 End



















//Chart 4
// Sankey Chart configuration
export const SANKEY_CONFIG = {
  // Dimensions
  width: 1800,
  height: 1300,
  marginTop: 80,
  marginRight: 350,
  marginBottom: 30,
  marginLeft: 50,
  
  // Sankey specific settings
  nodeWidth: 80,
  nodePadding: 60,
  linkWidthScale: 0.5, // Scale factor for link widths (higher = thicker links)
  
  // Animation settings
  animationDuration: 3000,
  particleCount: 5, // particles per 50k enforcement actions
  
  // Styling constants
  nodeStroke: '#000',
  nodeStrokeWidth: 2,
  linkOpacity: 0.5,
  labelOffset: 14,
  labelFontSize: '26px',
  particleRadius: 5,
  
  // Legend font sizes
  legendTitleFontSize: '30px',
  legendItemFontSize: '28px',
  
  // Chart 4 Legend configuration
  legend: {
    x: 650, // position outside chart area (chart width + margin)
    y: -70, // top position
    title: 'Flow Types',
    swatchSize: 24,
    swatchWidth: 24,
    swatchHeight: 24,
    marginLeft: 0,
    overflow: 'visible'
  }
};
//Chart 4 End







 








//Chart 5 - Multi-Donut
// Multi-Donut responsive dimensions helper
function getResponsiveChart5Dimensions() {
  const screenWidth = window.innerWidth;
  
  if (screenWidth <= 480) {
    // Small phones - legend below chart
    const chartSize = Math.min(screenWidth - 40, 350);
    return {
      width: chartSize,
      height: chartSize,
      totalHeight: chartSize + 100,  // Extra space for legend below
      innerRadius: 40,
      outerRadius: 140,
      legendX: 75,  // Centered horizontally
      legendY: chartSize + 30  // Below the chart with 30px margin
    };
  } else if (screenWidth <= 768) {
    // Tablets and larger phones - legend below chart
    const chartSize = Math.min(screenWidth - 60, 500);
    return {
      width: chartSize,
      height: chartSize,
      totalHeight: chartSize + 110,  // Extra space for legend below
      innerRadius: 50,
      outerRadius: 200,
      legendX: chartSize / 2 - 100,  // Centered horizontally
      legendY: chartSize + 40  // Below the chart with 40px margin
    };
  } else {
    // Desktop - legend on the right side
    return {
      width: 700,
      height: 700,
      totalHeight: 700,  // No extra height needed (legend on side)
      innerRadius: 60,
      outerRadius: 270,
      legendX: 600,
      legendY: 60
    };
  }
}

// Multi-Donut configuration
export const MULTI_DONUT_CONFIG = {
  // Dimensions - responsive
  ...getResponsiveChart5Dimensions(),
  
  // Cell styling
  cellStroke: '#fff',
  cellStrokeWidth: 1,
  
  // Label styling
  timeLabelOffset: 30,
  timeLabelFontSize: '13px',
  timeLabelColor: '#333',
  
  // Time bins (8 periods of 3 hours each)
  timeBins: ['0–3', '3–6', '6–9', '9–12', '12–15', '15–18', '18–21', '21–24'],
  
  // Center title styling
  centerTitleFontSize: '18px',
  centerSubtitleFontSize: '14px',
  centerTitleColor: '#333',
  
  // Legend configuration
  get legend() {
    return {
      x: this.legendX,
      y: this.legendY,
      width: window.innerWidth <= 768 ? 200 : 250,
      height: 20,
      title: 'Fatality Count'
    };
  },
  
  // Weekday labels configuration (All 7 days, displayed in 0-3 time slot)
  weekdayLabels: {
    fontSize: '9px',
    color: '#444',
    items: [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday'
    ]
  },

  // Legend font sizes
  legendTitleFontSize: '14px',
  legendLabelFontSize: '12px'
};
//Chart 5 End
