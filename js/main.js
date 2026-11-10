/**
 * Main application entry point
 * Initializes and renders all visualizations
 */

import { createGlobe } from './globe.js';
import { loadGlobeData, loadFatalitiesByAgeRawData, loadSunburstData, loadCrashRiskData, loadRoadUserGenderData, filterChart5Data } from './load-data.js';
import { SUNBURST_CONFIG, SANKEY_CONFIG, MULTI_DONUT_CONFIG } from './shared-constants.js';
import { renderSankey } from './sankey.js';
import { renderSunburstChart } from './sunburst-chart.js';
import { renderMultiDonut } from './multi-donut.js';
import { createViolinChart } from './violin-chart.js';
import { setupSunburstInteractions, setupSankeyInteractions, setupViolinInteractions, setupChart5Filters, setupChart5YearSlider, setupChart3YearFilter, setupChart4YearFilter } from './interaction.js';


//Chart 1 - Globe Visualization
async function initGlobeVisualization() {
  try {
    // Show loading indicator
    const container = document.getElementById('chart1-container');
    if (!container) {
      console.error('Chart container not found');
      return;
    }
    
    container.innerHTML = '<p class="chart-loading">Loading globe data...</p>';
    
    // Load all globe data from load-data.js
    const { worldData, australiaData, fatalityData } = await loadGlobeData();
    
    // Clear loading message
    container.innerHTML = '';
    
    // Create the globe visualization
    await createGlobe('chart1-container', worldData, australiaData, fatalityData);
    
    console.log('Globe visualization rendered successfully');
  } catch (error) {
    console.error('Error initializing globe visualization:', error);
    const container = document.getElementById('chart1-container');
    if (container) {
      container.innerHTML = `
        <div class="chart-error">
          <p><strong>Error loading globe:</strong></p>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
}
//Chart 1 End



















//Chart 2
async function initSunburstChart() {
  try {
    const container = document.getElementById('chart2-container');
    if (!container) {
      console.error('Chart 2 container not found');
      return;
    }
    
    container.innerHTML = '<p class="chart-loading">Loading sunburst chart...</p>';
    
    // Load data
    const data = await loadFatalitiesByAgeRawData();
    
    // Render chart
    renderSunburstChart(container, data, SUNBURST_CONFIG);
    
    console.log('Sunburst chart rendered successfully');
  } catch (error) {
    console.error('Error initializing sunburst chart:', error);
    const container = document.getElementById('chart2-container');
    if (container) {
      container.innerHTML = `
        <div class="chart-error">
          <p><strong>Error loading chart:</strong></p>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
}
//Chart 2 End



















//Chart 3
async function initViolinChart() {
  try {
    // Show loading indicator
    const container = document.getElementById('chart3-container');
    if (!container) {
      console.error('Chart 3 container not found');
      return;
    }
    
    container.innerHTML = '<p class="chart-loading">Loading road user gender data...</p>';
    
    // Load road user & gender data
    const { data, roadUserTypes, years } = await loadRoadUserGenderData();
    
    // Function to update story with statistics
    function updateStoryStats(filteredData, selectedYears) {
      // Calculate statistics by road user type and gender
      const stats = {};
      
      roadUserTypes.forEach(roadUser => {
        const roadUserData = filteredData.filter(d => d['Road User'] === roadUser);
        const maleCount = roadUserData.filter(d => d.Gender === 'Male').length;
        const femaleCount = roadUserData.filter(d => d.Gender === 'Female').length;
        const total = maleCount + femaleCount;
        const malePercentage = total > 0 ? (maleCount / total * 100).toFixed(1) : 0;
        
        stats[roadUser] = {
          male: maleCount,
          female: femaleCount,
          total: total,
          malePercentage: malePercentage
        };
      });
      
      // Sort by total count to find top categories
      const sortedStats = Object.entries(stats)
        .sort((a, b) => b[1].total - a[1].total);
      
      // Update year range text
      const yearRangeEl = document.getElementById('chart3-year-range');
      if (yearRangeEl) {
        const yearText = selectedYears.length === 0 || selectedYears.length === years.length
          ? `${Math.min(...years)}-${Math.max(...years)}`
          : selectedYears.length === 1
            ? selectedYears[0]
            : `${Math.min(...selectedYears)}-${Math.max(...selectedYears)}`;
        yearRangeEl.innerHTML = `From <strong>${yearText}</strong>, the data reveals significant gender disparities:`;
      }
      
      // Update insights list
      const insightsList = document.getElementById('chart3-insights');
      if (insightsList && sortedStats.length > 0) {
        const insights = [];
        
        // Top category (highest total)
        const [topCategory, topStats] = sortedStats[0];
        insights.push(
          `<li><strong>${topCategory}:</strong> Highest fatality count with ${topStats.total.toLocaleString()} total (${topStats.malePercentage}% male)</li>`
        );
        
        // Find category with highest male percentage
        const highestMalePerc = sortedStats.reduce((max, curr) => 
          curr[1].total > 50 && parseFloat(curr[1].malePercentage) > parseFloat(max[1].malePercentage) ? curr : max
        );
        if (highestMalePerc[0] !== topCategory) {
          insights.push(
            `<li><strong>${highestMalePerc[0]}:</strong> Most pronounced gender gap at ${highestMalePerc[1].malePercentage}% male fatalities</li>`
          );
        }
        
        // Second and third highest if different
        if (sortedStats.length > 1 && sortedStats[1][0] !== highestMalePerc[0]) {
          const [secondCategory, secondStats] = sortedStats[1];
          insights.push(
            `<li><strong>${secondCategory}:</strong> ${secondStats.total.toLocaleString()} fatalities (${secondStats.malePercentage}% male)</li>`
          );
        }
        
        insightsList.innerHTML = insights.join('');
      }
    }
    
    // Render function - will be populated after setup
    let renderChart;
    
    // Setup year filter
    const filterUtils = setupChart3YearFilter('chart3-year-filter', years, () => {
      if (renderChart) renderChart();
    });
    
    if (!filterUtils) {
      console.warn('Year filter not initialized - element not found');
    }
    
    // Define the render function
    renderChart = function() {
      const selectedYears = filterUtils ? filterUtils.getSelectedYears() : years;
      
      // Filter data by selected years
      const filteredData = selectedYears.length === 0 
        ? data 
        : data.filter(d => selectedYears.includes(+d.Year));
      
      // Update story statistics
      updateStoryStats(filteredData, selectedYears);
      
      // Render violin chart with filtered data
      createViolinChart('chart3-container', filteredData, roadUserTypes);
    };
    
    // Initial render
    renderChart();
    
  } catch (error) {
    console.error('Error initializing violin chart:', error);
    const container = document.getElementById('chart3-container');
    if (container) {
      container.innerHTML = `
        <div class="chart-error">
          <p><strong>Error loading chart:</strong></p>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
}
//Chart 3 End



















//Chart 4
async function initSankeyChart() {
  try {
    // Show loading indicator
    const container = document.getElementById('chart4-container');
    if (!container) {
      console.error('Chart 4 container not found');
      return;
    }
    
    container.innerHTML = '<p class="chart-loading">Loading enforcement and fatality data...</p>';
    
    // Load percentage enforcement & fatality data
    const { data, years } = await loadSunburstData();
    
    // Function to update story with statistics
    function updateStoryStats(filteredData) {
      // Calculate gaps (difference between fatality % and enforcement %)
      const gaps = filteredData.map(d => ({
        jurisdiction: d.jurisdiction,
        enforcement: d.enforcementPercent,
        fatalities: d.fatalitiesPercent,
        gap: d.fatalitiesPercent - d.enforcementPercent,
        absGap: Math.abs(d.fatalitiesPercent - d.enforcementPercent)
      }));
      
      // Sort by absolute gap to find most significant mismatches
      const sortedByAbsGap = [...gaps].sort((a, b) => b.absGap - a.absGap);
      
      // Update insights list
      const insightsList = document.getElementById('chart4-insights');
      if (insightsList && gaps.length > 0) {
        const insights = [];
        
        // Top 3 most significant gaps
        const top3 = sortedByAbsGap.slice(0, 3);
        
        top3.forEach(item => {
          if (item.gap > 1) {
            // Under-resourced (more fatalities than enforcement)
            insights.push(
              `<li><strong>${item.jurisdiction}:</strong> ${item.enforcement.toFixed(1)}% enforcement for ${item.fatalities.toFixed(1)}% fatalities - under-resourced (${item.gap > 0 ? '+' : ''}${item.gap.toFixed(1)}%)</li>`
            );
          } else if (item.gap < -1) {
            // Over-resourced (more enforcement than fatalities)
            insights.push(
              `<li><strong>${item.jurisdiction}:</strong> ${item.enforcement.toFixed(1)}% enforcement for ${item.fatalities.toFixed(1)}% fatalities - over-resourced (${item.gap.toFixed(1)}%)</li>`
            );
          } else {
            // Balanced
            insights.push(
              `<li><strong>${item.jurisdiction}:</strong> ${item.enforcement.toFixed(1)}% enforcement, ${item.fatalities.toFixed(1)}% fatalities - proportional alignment</li>`
            );
          }
        });
        
        insightsList.innerHTML = insights.join('');
      }
    }
    
    // Render function - will be populated after setup
    let renderChart;
    
    // Setup year filter
    const filterUtils = setupChart4YearFilter('chart4-year-filter', years, () => {
      if (renderChart) renderChart();
    });
    
    if (!filterUtils) {
      console.warn('Year filter not initialized - element not found');
    }
    
    // Define the render function
    renderChart = function() {
      const selectedYears = filterUtils ? filterUtils.getSelectedYears() : years;
      
      // Filter data by selected years and aggregate
      const filteredData = selectedYears.length === 0 
        ? data 
        : data.filter(d => selectedYears.includes(d.year));
      
      // Aggregate data across selected years by jurisdiction
      const aggregatedData = {};
      filteredData.forEach(d => {
        if (!aggregatedData[d.jurisdiction]) {
          aggregatedData[d.jurisdiction] = {
            jurisdiction: d.jurisdiction,
            enforcementSum: 0,
            fatalitiesSum: 0,
            count: 0
          };
        }
        aggregatedData[d.jurisdiction].enforcementSum += d.enforcementPercent;
        aggregatedData[d.jurisdiction].fatalitiesSum += d.fatalitiesPercent;
        aggregatedData[d.jurisdiction].count += 1;
      });
      
      // Calculate averages
      const chartData = Object.values(aggregatedData).map(d => ({
        jurisdiction: d.jurisdiction,
        enforcementPercent: d.enforcementSum / d.count,
        fatalitiesPercent: d.fatalitiesSum / d.count
      }));
      
      // Update story statistics
      updateStoryStats(chartData);
      
      // Render the Sankey chart
      renderSankey(container, chartData, SANKEY_CONFIG);
    };
    
    // Initial render
    renderChart();
    
    console.log('Sankey chart rendered successfully');
  } catch (error) {
    console.error('Error initializing Sankey chart:', error);
    const container = document.getElementById('chart4-container');
    if (container) {
      container.innerHTML = `
        <div class="chart-error">
          <p><strong>Error loading chart:</strong></p>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
}
//Chart 4 End



















//Chart 5 - Multi-Donut
async function initRadialHeatmap() {
  try {
    // Show loading indicator
    const container = document.getElementById('chart5-container');
    if (!container) {
      console.error('Chart 5 (Multi-Donut) container not found');
      return;
    }
    
    container.innerHTML = '<p class="chart-loading">Loading crash risk data...</p>';
    
    // Load crash risk data
    const { data, days, roadTypes, ageGroups } = await loadCrashRiskData();
    const years = [...new Set(data.map(d => d.Year))].sort();
    
    // Get filter containers
    const filterContainers = {
      dayFilterContainer: document.getElementById('chart5-day-filter'),
      roadTypeFilterContainer: document.getElementById('chart5-roadtype-filter'),
      ageFilterContainer: document.getElementById('chart5-age-filter')
    };
    
    // Render function - will be populated after setup
    let renderChart;
    
    // Setup slider first (without callback to avoid circular dependency)
    const sliderUtils = setupChart5YearSlider('chart5-year-slider', years, () => {
      if (renderChart) renderChart();
    });
    
    if (!sliderUtils) {
      throw new Error('Failed to initialize year slider - element not found');
    }
    
    // Setup filters (without callback initially)
    const filterUtils = setupChart5Filters(filterContainers, { days, roadTypes, ageGroups }, () => {
      if (renderChart) renderChart();
    });
    
    // Now define the render function with all utilities available
    renderChart = function() {
      const yearRange = sliderUtils.getYearRange();
      const selectedDays = filterUtils.getSelectedValues(filterContainers.dayFilterContainer);
      const selectedRoadTypes = filterUtils.getSelectedValues(filterContainers.roadTypeFilterContainer);
      const selectedAges = filterUtils.getSelectedValues(filterContainers.ageFilterContainer);
      
      const filteredData = filterChart5Data(data, yearRange, selectedDays, selectedRoadTypes, selectedAges);
      renderMultiDonut(container, filteredData, MULTI_DONUT_CONFIG, selectedDays);
    };
    
    // Initial render
    renderChart();
    
    console.log('Multi-Donut chart rendered successfully');
  } catch (error) {
    console.error('Error initializing Multi-Donut chart:', error);
    const container = document.getElementById('chart5-container');
    if (container) {
      container.innerHTML = `
        <div class="chart-error">
          <p><strong>Error loading chart:</strong></p>
          <p>${error.message}</p>
        </div>
      `;
    }
  }
}
//Chart 5 End





















// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {

  
  // Mobile banner functionality
  const mobileBanner = document.getElementById('mobile-banner');
  const mobileBannerClose = document.getElementById('mobile-banner-close');
  
  
  // Handle banner close button
  if (mobileBannerClose) {
    mobileBannerClose.addEventListener('click', () => {
      if (mobileBanner) {
        mobileBanner.style.animation = 'slideUpToTop 0.4s ease-out';
        setTimeout(() => {
          mobileBanner.style.display = 'none';
        }, 400);
      }
    });
  }
  
  // Hamburger menu toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinksContainer = document.querySelector('.nav-links');
  
  if (hamburger && navLinksContainer) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinksContainer.classList.toggle('active');
      
      // Update aria-expanded attribute
      const isExpanded = hamburger.classList.contains('active');
      hamburger.setAttribute('aria-expanded', isExpanded);
      
      // Move banner down when menu is open
      if (mobileBanner) {
        if (isExpanded) {
          mobileBanner.classList.add('menu-open');
        } else {
          mobileBanner.classList.remove('menu-open');
        }
      }
    });
    
    // Close menu when clicking on a nav link
    const navLinkItems = document.querySelectorAll('.nav-link');
    navLinkItems.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinksContainer.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        // Move banner back up
        if (mobileBanner) {
          mobileBanner.classList.remove('menu-open');
        }
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !navLinksContainer.contains(e.target)) {
        hamburger.classList.remove('active');
        navLinksContainer.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        // Move banner back up
        if (mobileBanner) {
          mobileBanner.classList.remove('menu-open');
        }
      }
    });
  }

  // Set up scroll animations for chart sections
  const chartSections = document.querySelectorAll('.chart-section');
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);
  
  chartSections.forEach(section => observer.observe(section));
  




  // Active nav link tracking
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.chart-section');
  
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.5 });
  
  sections.forEach(section => navObserver.observe(section));
  
  
  // Custom scroll for all navigation links to prevent URL hash from showing
  const allNavLinks = document.querySelectorAll('a.nav-link[href^="#"], a.nav-logo[href^="#"]');
  allNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
        // Custom offsets: Chart 5 needs more, #main goes to top, others need standard offset for navbar
        let offset;
        if (targetId === '#main') {
          offset = 0; // Scroll to top
        } else if (targetId === '#chart5') {
          offset = -84;
        } else {
          offset = -36;
        }
        const offsetPosition = targetPosition + offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
  

  
  // Initialize all charts
  initGlobeVisualization();
  initSunburstChart();
  initSankeyChart();
  initViolinChart();
  initRadialHeatmap();
});
