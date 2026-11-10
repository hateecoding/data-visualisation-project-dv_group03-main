# The Fatal Blind Spot: Uncovering Enforcement Inefficiency in Australia's Road Safety System

A comprehensive data visualization project analyzing road safety enforcement effectiveness across Australian states and territories from 2020-2024.

---

## Project Documentation

**Team 3**

**Team members:**
- Chen Jian Xi (Leader) 106214506
- Felicia Yong Yin Shi 106214519
- Shik Jia Qi 106214027

### 1. Project Title & Overview

**Title:** The Fatal Blind Spot: Uncovering Enforcement Inefficiency in Australia's Road Safety System

**Overview:**
A comprehensive data visualization project analyzing road safety enforcement effectiveness across Australian states and territories from 2020-2024. The project presents an in-depth analysis of Australia's road safety system through interactive data visualizations, examining the relationship between enforcement efforts and road fatalities to expose critical gaps in resource allocation and reveal where enforcement is failing to prevent deaths.

### 2. Project Folder and File Structure

```
Data_Dashboard/
├── css/
│   └── styles.css              # All styling (Chart 1-5 sections)
├── js/
│   ├── main.js                 # Application entry point
│   ├── shared-constants.js     # Configuration for all charts
│   ├── load-data.js            # Data loading functions
│   ├── interaction.js          # All interactive features
│   ├── globe.js                # Chart 1: Interactive globe
│   ├── sunburst-chart.js       # Chart 2: Sunburst chart
│   ├── violin-chart.js         # Chart 3: Violin chart
│   ├── sankey.js               # Chart 4: Sankey diagram
│   └── multi-donut.js          # Chart 5: Multi-ring donut chart
├── data/
│   ├── FatalitiesByJurisdiction.csv     # Fatalities per 100k by state
│   ├── FatalitiesByAgeGroup.csv         # Age-based fatality data
│   ├── Percentage Enforcement&Fatality.csv  # Enforcement vs fatality %
│   ├── RoadUser&Gender.csv              # Road user type and gender data
│   ├── Time&Location_Fatalities.csv     # Crash risk by time/road type
│   ├── australia-states.json            # GeoJSON for map visualization
│   └── globeCoordinates.json            # 3D globe coordinate data
├── image/
│   └── Favicon.ico             # Website favicon
├── Knime Workflow/             # Data processing workflows
├── Process Book/               # Project documentation
├── Standup PPT/                # Presentation materials
├── index.html                  # Single-page application
└── README.md                   # Project documentation
```

### 3. List of Finalized and Selected Datasets

#### Dataset 1: FatalitiesByJurisdiction.csv
- **Description:** Road fatalities per 100,000 population by state/territory (2020-2024)
- **Fields:** `State`, `Year`, `Fatalities per 100k`
- **Purpose:** Geographic distribution of road safety outcomes
- **Used in:** Chart 1 (Interactive Globe)

#### Dataset 2: FatalitiesByAgeGroup.csv
- **Description:** Annual fatality counts segmented by age groups
- **Fields:** `Year`, `0-16`, `17-25`, `26-39`, `40-64`, `65 and over`
- **Purpose:** Age-based vulnerability analysis
- **Used in:** Chart 2 (Sunburst Chart)

#### Dataset 3: Percentage Enforcement&Fatality.csv
- **Description:** Proportional comparison of enforcement actions vs. fatalities
- **Fields:** `Jurisdiction`, `Year`, `Enforcement%`, `Fatalities%`
- **Purpose:** Resource allocation efficiency analysis
- **Used in:** Chart 4 (Sankey Diagram)

#### Dataset 4: RoadUser&Gender.csv
- **Description:** Road user type and gender distribution data
- **Fields:** Road user type, gender, fatality counts
- **Purpose:** Gender distribution analysis by road user category
- **Used in:** Chart 3 (Violin Chart)

#### Dataset 5: Time&Location_Fatalities.csv
- **Description:** Detailed crash records with temporal and spatial attributes (4,000+ records)
- **Fields:** `Year`, `Dayweek`, `Road User`, `Age`, `National Road Type`, `Time`
- **Purpose:** Risk pattern identification by time and location
- **Used in:** Chart 5 (Multi-Ring Donut Chart)

#### Dataset 6: australia-states.json
- **Description:** GeoJSON file containing Australian state/territory boundaries
- **Purpose:** Geographic visualization for globe and state mapping
- **Used in:** Chart 1 (Interactive Globe)

#### Dataset 7: globeCoordinates.json
- **Description:** 3D coordinate data for globe visualization
- **Purpose:** Rendering 3D globe with geographic accuracy
- **Used in:** Chart 1 (Interactive Globe)

**Data Sources:**
- [Australian Road Deaths Database (ARDD)](https://catalogue.data.infrastructure.gov.au/dataset/australian-road-deaths-database)
- [Australian Bureau of Statistics - National, state and territory population](https://www.abs.gov.au/statistics/people/population/national-state-and-territory-population/latest-release#data-downloads)
- [Road Safety Enforcement Data](http://catalogue.data.infrastructure.gov.au/dataset/road-safety-enforcement-data)

### 4. GenAI Usage Statements

#### Data Processing
- **GenAI Tool Used:** ChatGPT
- **Usage:** Assisted in data cleaning, transformation, and aggregation workflows
- **Specific Tasks:**
  - Helped structure CSV data formats for optimal D3.js consumption
  - Assisted in calculating fatality rates per 100,000 population
  - Guided data normalization and percentage calculations for enforcement vs. fatality comparisons
  - Helped aggregate temporal data into time period buckets for Chart 5

#### Code Development
- **GenAI Tool Used:** ChatGPT
- **Usage:** Assisted in JavaScript/D3.js implementation
- **Specific Tasks:**
  - Generated initial D3.js visualization code for all 5 charts (Globe, Sunburst, Violin, Sankey, Multi-Donut)
  - Implemented interactive features (tooltips, filters, animations, zoom functionality)
  - Created modular architecture with separation of concerns (main.js, interaction.js, load-data.js, etc.)
  - Debugged complex D3.js rendering issues and data binding problems
  - Implemented responsive design and accessibility features
  - Created filter systems (year sliders, checkbox filters, collapsible sections)
  - Developed day filter transparency feature for Chart 5

#### Website Development
- **GenAI Tool Used:** ChatGPT
- **Usage:** Assisted in Full-stack web development
- **Specific Tasks:**
  - Structured HTML5 semantic markup with ARIA attributes for accessibility
  - Designed CSS styling with responsive layouts and modern UI/UX patterns
  - Integrated third-party libraries (D3.js, Vanta.js, Three.js, noUiSlider)
  - Implemented mobile-responsive design with desktop recommendation banner
  - Created navigation system with smooth scrolling and active state management
  - Developed split-layout sections combining data stories with visualizations
  - Implemented WCAG-compliant accessibility features

#### Documentation
- **GenAI Tool Used:** ChatGPT
- **Usage:** Documentation and README creation
- **Specific Tasks:**
  - Generated comprehensive README.md with project structure and usage instructions
  - Created inline code comments following strict formatting standards
  - Documented data sources and attribution

#### Overall GenAI Contribution
**Estimated Percentage:** ~90-95% of code implementation with significant human oversight, refinement, and domain expertise for data analysis insights and storytelling.

---

## Overview

This project presents an in-depth analysis of Australia's road safety system through interactive data visualizations. By examining the relationship between enforcement efforts and road fatalities, we expose critical gaps in resource allocation and reveal where enforcement is failing to prevent deaths. The dashboard combines multiple visualization types to tell a compelling story about systemic inefficiencies in road safety enforcement.

## Features

### Five Interactive Visualizations

1. **Interactive Globe**: 3D globe visualization showing road fatalities across Australian states (2020-2024)
2. **Stacked Bar Chart**: Age-based fatality distribution over time with animated transitions
3. **Sankey Diagram**: Proportional comparison of enforcement vs. fatality distribution
4. **Multi-Ring Donut Chart**: Temporal and spatial crash risk patterns with year filtering
5. **Interactive Tooltips**: Detailed data exploration with hover and click interactions

### Key Features

- **Dynamic Filtering**: Year-based filtering with configurable slider controls
- **Animated Transitions**: Smooth, engaging animations for data presentation
- **Data-Driven Storytelling**: Compelling narratives accompanying each visualization
- **Responsive Design**: Optimized for desktop and mobile devices
- **Accessibility**: WCAG-compliant with semantic HTML and ARIA attributes

## Technologies Used

- **HTML5, CSS3, JavaScript (ES6+)** - Core web technologies
- **[D3.js v7](https://d3js.org/)** - Advanced data visualization library
- **[Vanta.js](https://www.vantajs.com/)** - Animated background effects
- **[Three.js](https://threejs.org/)** - 3D graphics library (for Vanta effects)
- **Modular Architecture** - Separation of concerns with dedicated modules

## Project Structure

```
Data_Dashboard/
├── css/
│   └── styles.css              # All styling (Chart 1-5 sections)
├── js/
│   ├── main.js                 # Application entry point
│   ├── shared-constants.js     # Configuration for all charts
│   ├── load-data.js            # Data loading functions
│   ├── interaction.js          # All interactive features
│   ├── globe.js               # Chart 1: Interactive globe
│   ├── stacked-bar.js          # Chart 2: Stacked bar chart
│   ├── sankey-chart.js         # Chart 3: Sankey diagram
│   └── multi-donut.js          # Chart 5: Multi-ring donut chart
├── data/
│   ├── FatalitiesByJurisdiction.csv     # Fatalities per 100k by state
│   ├── FatalitiesByAgeGroup.csv         # Age-based fatality data
│   ├── Percentage Enforcement&Fatality.csv  # Enforcement vs fatality %
│   ├── Time&Location_Fatalities.csv     # Crash risk by time/road type
│   └── australia-states.json            # GeoJSON for map visualization
└── index.html                  # Single-page application
```

## Datasets

### 1. FatalitiesByJurisdiction.csv
Road fatalities per 100,000 population by state/territory (2020-2024)
- **Fields**: `State`, `Year`, `Fatalities per 100k`
- **Purpose**: Geographic distribution of road safety outcomes

### 2. FatalitiesByAgeGroup.csv
Annual fatality counts segmented by age groups
- **Fields**: `Year`, `0-16`, `17-25`, `26-39`, `40-64`, `65 and over`
- **Purpose**: Age-based vulnerability analysis

### 3. Percentage Enforcement&Fatality.csv
Proportional comparison of enforcement actions vs. fatalities
- **Fields**: `Jurisdiction`, `Year`, `Enforcement%`, `Fatalities%`
- **Purpose**: Resource allocation efficiency analysis

### 4. Time&Location_Fatalities.csv
Detailed crash records with temporal and spatial attributes (4,000+ records)
- **Fields**: `Year`, `Dayweek`, `Road User`, `Age`, `National Road Type`, `Time`
- **Purpose**: Risk pattern identification by time and location

### 5. australia-states.json
GeoJSON file containing Australian state/territory boundaries
- **Purpose**: Geographic visualization for globe and state mapping

## Usage

1. **Open** `index.html` in a modern web browser
2. **Scroll** through the single-page application to explore each visualization
3. **Interact** with charts:
   - Hover over elements for detailed tooltips
   - Click on cells in the multi donut chart for risk zone details
   - Use the year slider to filter Chart 5 data
   - Hover over legend items to highlight specific data series
4. **Read** the accompanying stories to understand the insights

## Code Architecture

### Strict Separation of Concerns

- **All CSS** → `styles.css` (organized by chart sections)
- **All Interactions** → `interaction.js` (event handlers, tooltips)
- **All Constants** → `shared-constants.js` (configuration objects)
- **All Data Loading** → `load-data.js` (CSV/JSON parsing)
- **Chart Rendering** → Individual chart files (pure rendering logic)

## Accessibility

This project includes:
- Semantic HTML5 markup
- ARIA attributes for screen readers
- Keyboard navigation support
- WCAG-compliant color contrast
- Descriptive alt text and labels
- Focus indicators for interactive elements

## Contributors

COS30045 Data Visualization Project - Group 03
Swinburne University of Technology (Inti Subang Campus)
