// Import d3 for CSV parsing and other data operations
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

//Chart 1
// Load globe visualization data (world map, Australia states, and fatality data)
export async function loadGlobeData() {
  try {
    // Load world data (globeCoordinates.json)
    const worldResponse = await fetch('./data/globeCoordinates.json');
    if (!worldResponse.ok) {
      throw new Error(`Failed to load world data: ${worldResponse.status}`);
    }
    const worldData = await worldResponse.json();
    
    // Load Australia states data
    const australiaResponse = await fetch('./data/australia-states.json');
    if (!australiaResponse.ok) {
      throw new Error(`Failed to load Australia states data: ${australiaResponse.status}`);
    }
    const australiaData = await australiaResponse.json();
    
    // Load fatality data for Australia states
    const fatalityResponse = await fetch('./data/FatalitiesByJurisdiction.csv');
    if (!fatalityResponse.ok) {
      throw new Error(`Failed to load fatality data: ${fatalityResponse.status}`);
    }
    const fatalityText = await fatalityResponse.text();
    const fatalityData = d3.csvParse(fatalityText, d => ({
      jurisdiction: d.Jurisdiction,
      year: +d.Year || 0,
      fatalities_per_100k: +d.Fatalities_per_100k || 0,
      total_fatalities: +d.Total_Fatalities || 0
    }));
    
    return { worldData, australiaData, fatalityData };
  } catch (error) {
    console.error('Error loading globe data:', error);
    throw error;
  }
}
//Chart 1 End















//Chart 2
// Load fatalities data for sunburst chart
export async function loadFatalitiesByAgeRawData() {
  try {
    const response = await fetch('./data/FatalitiesByAgeGroup.csv');
    if (!response.ok) {
      throw new Error(`Failed to load fatalities by age data: ${response.statusText}`);
    }
    const csvText = await response.text();
    
    // Parse CSV data
    const rawData = d3.csvParse(csvText, d => ({
      Year: +d.Year,
      State: d.State,
      Age: d.Age,
      'Count*(Crash ID)': +d['Count*(Crash ID)']
    }));
    
    console.log('Fatalities by age data loaded:', rawData.length, 'records');
    
    return rawData;
  } catch (error) {
    console.error('Error loading fatalities by age data:', error);
    throw error;
  }
}
//Chart 2 End









//Chart 3
// Load Road User & Gender data for Violin Chart
export async function loadRoadUserGenderData() {
  try {
    const response = await fetch('./data/RoadUser&Gender.csv');
    if (!response.ok) {
      throw new Error(`Failed to load road user gender data: ${response.statusText}`);
    }
    const csvText = await response.text();
    
    // Parse CSV data
    const rawData = d3.csvParse(csvText);
    
    // Filter out Unknown gender and Unknown road users
    const filteredData = rawData.filter(d => 
      d.Gender !== 'Unknown' && 
      d['Road User'] !== 'Unknown'
    );
    
    // Get unique road user types and years
    const roadUserTypes = [...new Set(filteredData.map(d => d['Road User']))].sort();
    const years = [...new Set(filteredData.map(d => +d.Year))].sort((a, b) => a - b);
    
    console.log('Road User & Gender data loaded:', filteredData.length, 'records');
    console.log('Road User Types:', roadUserTypes);
    console.log('Years:', years);
    
    return {
      data: filteredData,
      roadUserTypes: roadUserTypes,
      years: years
    };
  } catch (error) {
    console.error('Error loading road user gender data:', error);
    throw error;
  }
}
//Chart 3 End














//Chart 4
// Load Percentage Enforcement & Fatality data for Sankey chart
export async function loadSunburstData() {
  try {
    const response = await fetch('./data/Percentage Enforcement&Fatality.csv');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    
    // Parse CSV
    const rows = d3.csvParse(text);
    
    // Process data
    const data = rows.map(d => ({
      year: +d.Year,
      jurisdiction: d.Jurisdiction,
      enforcementPercent: +d['Enforcement%'],
      fatalitiesPercent: +d['Fatalities%']
    }));
    
    // Get unique years and jurisdictions
    const years = [...new Set(data.map(d => d.year))].sort();
    const jurisdictions = [...new Set(data.map(d => d.jurisdiction))].sort();
    
    // Get latest year data
    const latestYear = years[years.length - 1];
    const latestData = data.filter(d => d.year === latestYear);
    
    console.log(`Percentage Enforcement & Fatality data loaded: ${data.length} records`);
    console.log(`Years: ${years.join(', ')}`);
    console.log(`Jurisdictions: ${jurisdictions.length}`);
    console.log(`Latest year: ${latestYear}`);
    
    return {
      data: data,
      latestData: latestData,
      years: years,
      jurisdictions: jurisdictions
    };
  } catch (error) {
    console.error('Error loading Percentage Enforcement & Fatality data:', error);
    throw error;
  }
}
//Chart 4 End





//Chart 5 - Multi-Donut
// Load crash risk data from Time&Location_Fatalities.csv
export async function loadCrashRiskData() {
  try {
    const response = await fetch('./data/Time&Location_Fatalities.csv');
    if (!response.ok) {
      throw new Error(`Failed to load crash risk data: ${response.statusText}`);
    }
    const csvText = await response.text();
    
    // Parse CSV data with auto type conversion
    const rawData = d3.csvParse(csvText, d3.autoType);
    
    // Filter for Driver only and remove Unknown road types
    const filteredData = rawData.filter(d => 
      d['Road User'] === 'Driver' && 
      d['National Road Type'] !== 'Unknown' &&
      d['National Road Type'] !== null
    );
    
    console.log('Crash risk data loaded:', filteredData.length, 'records');
    
    // Extract unique values for filters
    // Ensure days are always ordered Monday -> Sunday for the UI filter
    const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const uniqueDays = [...new Set(filteredData.map(d => d.Dayweek))];
    const days = weekdayOrder.filter(day => uniqueDays.includes(day));
    const roadTypes = [...new Set(filteredData.map(d => d['National Road Type']))].sort();
    const ageGroups = [...new Set(filteredData.map(d => d.Age))].sort();
    
    return {
      data: filteredData,
      years: [...new Set(filteredData.map(d => d.Year))].sort(),
      days: days,
      roadTypes: roadTypes,
      ageGroups: ageGroups,
      timeBins: [...new Set(filteredData.map(d => d.Time))].sort()
    };
  } catch (error) {
    console.error('Error loading crash risk data:', error);
    throw error;
  }
}

// Chart 5 - Data Filtering Utility
export function filterChart5Data(data, yearRange, selectedDays, selectedRoadTypes, selectedAges) {
  const [startYear, endYear] = yearRange;
  
  return data.filter(d => {
    const yearMatch = d.Year >= startYear && d.Year <= endYear;
    const dayMatch = selectedDays.length === 0 || selectedDays.includes(d.Dayweek);
    const roadTypeMatch = selectedRoadTypes.length === 0 || selectedRoadTypes.includes(d['National Road Type']);
    const ageMatch = selectedAges.length === 0 || selectedAges.includes(d.Age);
    
    return yearMatch && dayMatch && roadTypeMatch && ageMatch;
  });
}
//Chart 5 End
