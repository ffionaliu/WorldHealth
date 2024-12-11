// add your JavaScript/D3 to this file
// Global variables
let processedData, svg, barSvg, x, y, color, allCountries = new Set();
let tooltip;

// Set dimensions and margins
const margin = { top: 50, right: 150, bottom: 70, left: 70 };
const barMargin = { top: 50, right: 50, bottom: 50, left: 150 };
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const barWidth = 800 - barMargin.left - barMargin.right;
const barHeight = 500 - barMargin.top - barMargin.bottom;

// Create SVG container for line chart
svg = d3.select("#plot")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Create SVG container for bar chart
barSvg = d3.select("#barplot")
  .append("svg")
  .attr("width", barWidth + barMargin.left + barMargin.right)
  .attr("height", barHeight + barMargin.top + barMargin.bottom)
  .append("g")
  .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

// Create a tooltip div
tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("visibility", "hidden")
  .style("background", "rgba(0, 0, 0, 0.8)")
  .style("color", "#fff")
  .style("padding", "5px")
  .style("border-radius", "4px")
  .style("font-size", "12px");

// Add X-axis label for line chart
svg.append("text")
  .attr("class", "x-label")
  .attr("text-anchor", "middle")
  .attr("x", width / 2)
  .attr("y", height + margin.bottom - 30)
  .text("Year");

// Add Y-axis label for line chart
svg.append("text")
  .attr("class", "y-label")
  .attr("text-anchor", "middle")
  .attr("transform", `translate(${-margin.left + 20}, ${height / 2}) rotate(-90)`)
  .text("Life Expectancy");

// Add title for line chart
svg.append("text")
  .attr("class", "chart-title")
  .attr("text-anchor", "middle")
  .attr("x", width / 2)
  .attr("y", -20)
  .style("font-size", "16px")
  .style("font-weight", "bold")
  .text("Life Expectancy Over Time by Country and Gender");
  
// Function to update the bar chart
function updateBarChart() {
  // Check if there are selected countries
  if (allCountries.size === 0) {
    console.warn("No countries selected for the bar chart.");
    barSvg.selectAll("*").remove(); // Clear the bar chart if no countries are selected
    return;
  }

  // Compute average life expectancy for selected countries
  const avgLifeExpectancy = Array.from(allCountries).map(country => {
    const countryData = processedData.filter(d => d.country === country && d.sex === selectedGender);
    const avg = d3.mean(countryData, d => d.life_expectancy);
    return { country, avg };
  });

  // Debugging: Log bar chart data
  console.log("Bar Chart Data:", avgLifeExpectancy);

  // Sort countries by average life expectancy
  avgLifeExpectancy.sort((a, b) => b.avg - a.avg);

  // Update scales for the vertical bar chart
  const xBar = d3.scaleBand()
    .domain(avgLifeExpectancy.map(d => d.country))
    .range([0, barWidth])
    .padding(0.1);

  const yBar = d3.scaleLinear()
    .domain([0, d3.max(avgLifeExpectancy, d => d.avg)])
    .range([barHeight, 0]);

  // Remove old axes
  barSvg.select(".x-axis").remove();
  barSvg.select(".y-axis").remove();

  // Add X-axis
  barSvg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${barHeight})`)
    .call(d3.axisBottom(xBar))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  // Add Y-axis
  barSvg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yBar));

  // Bind data to bars
  const bars = barSvg.selectAll(".bar")
    .data(avgLifeExpectancy);

  // Update existing bars
  bars
    .transition()
    .duration(1000)
    .attr("x", d => xBar(d.country))
    .attr("y", d => yBar(d.avg))
    .attr("width", xBar.bandwidth())
    .attr("height", d => barHeight - yBar(d.avg))
    .attr("fill", d => color(d.country));

  // Enter new bars
  bars.enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => xBar(d.country))
    .attr("y", d => yBar(d.avg))
    .attr("width", xBar.bandwidth())
    .attr("height", d => barHeight - yBar(d.avg))
    .attr("fill", d => color(d.country))
    .on("mouseover", function (event, d) {
      tooltip.style("visibility", "visible")
        .html(`<strong>${d.country}</strong><br/>Average Life Expectancy: ${d.avg.toFixed(2)}`);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("top", `${event.pageY - 10}px`)
        .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });

  // Remove old bars
  bars.exit().remove();
}

// Add legend
    function updateLegend() {
      const legend = svg.selectAll(".legend")
        .data(Array.from(allCountries), d => d);

      const legendEnter = legend.enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (_, i) => `translate(${width + 20}, ${i * 20})`);

      legendEnter.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => color(d));

      legendEnter.append("text")
        .attr("x", 15)
        .attr("y", 10)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .text(d => `${d} (${selectedGender})`);

      legend.exit().remove();
    }

// Call `updateBarChart` after updating the line chart
function updateChart() {
  console.log(`Updating chart for: ${selectedGender}`);
  console.log("Selected Countries:", Array.from(allCountries));

  // Filter data based on selected gender and countries
  const filteredData = processedData.filter(d => d.sex === selectedGender && allCountries.has(d.country));
  console.log("Filtered Data:", filteredData);

  if (!filteredData.length) {
    console.warn("No data available for the current selection.");
  }

  // Group data by country
  const dataByCountry = d3.group(filteredData, d => d.country);

  // Update scales
  x.domain(d3.extent(processedData, d => d.year));
  y.domain([
    d3.min(filteredData, d => d.life_expectancy) - 2,
    d3.max(filteredData, d => d.life_expectancy) + 2,
  ]);

  // Update axes
  svg.select(".x-axis")
    .transition()
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));
  
  svg.select(".y-axis")
    .transition()
    .call(d3.axisLeft(y));

  // Bind data and draw lines
  const lines = svg.selectAll(".line")
    .data(Array.from(dataByCountry), ([key]) => key);

  // Update existing lines
  lines
    .transition()
    .duration(1000)
    .attr("d", ([key, values]) => d3.line()
      .x(d => x(d.year))
      .y(d => y(d.life_expectancy))(values))
    .attr("stroke", ([key]) => color(key));

  // Enter new lines
  lines.enter()
    .append("path")
    .attr("class", "line")
    .attr("d", ([key, values]) => d3.line()
      .x(d => x(d.year))
      .y(d => y(d.life_expectancy))(values))
    .attr("stroke", ([key]) => color(key))
    .attr("fill", "none");

  // Remove old lines
  lines.exit().remove();

  // Add circles for each data point
  const points = svg.selectAll(".point")
    .data(filteredData);

  // Update existing points
  points
    .transition()
    .duration(1000)
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.life_expectancy))
    .attr("r", 4)
    .attr("fill", d => color(d.country));

  // Enter new points
  points.enter()
    .append("circle")
    .attr("class", "point")
    .attr("cx", d => x(d.year))
    .attr("cy", d => y(d.life_expectancy))
    .attr("r", 4)
    .attr("fill", d => color(d.country))
    .on("mouseover", function (event, d) {
      tooltip.style("visibility", "visible")
        .html(`
          <strong>${d.country}</strong><br/>
          Year: ${d.year}<br/>
          Life Expectancy: ${d.life_expectancy.toFixed(2)}
        `);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("top", `${event.pageY - 10}px`)
        .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", () => {
      tooltip.style("visibility", "hidden");
    });

  // Remove old points
  points.exit().remove();

  // Update the bar chart
  updateBarChart();
  
  updateLegend();
}


// Load the CSV file and process the data
d3.csv("life_expectancy_data.csv").then(rawData => {
  console.log("Raw Data:", rawData);

  // Filter and process the data
  processedData = rawData.map(d => ({
    country: d.setting,
    year: +d.date, // Convert year to numeric
    sex: d.subgroup,
    life_expectancy: +d.estimate // Convert life expectancy to numeric
  }));
  console.log("Processed Data:", processedData);

  // Initialize scales and color
  x = d3.scaleLinear().range([0, width]);
  y = d3.scaleLinear().range([height, 0]);
  color = d3.scaleOrdinal()
  .domain(Array.from(new Set(processedData.map(d => d.country)))) // Unique list of countries
  .range(d3.schemeCategory10);

  // Add axes for line chart
  svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .attr("class", "x-axis");
  
  svg.append("g")
    .attr("class", "y-axis");

  // Add gender toggle buttons
  const genders = ["Male", "Female"];
  d3.select("body")
    .append("div")
    .attr("class", "gender-buttons")
    .selectAll("button")
    .data(genders)
    .enter()
    .append("button")
    .text(d => d)
    .on("click", function (_, gender) {
      selectedGender = gender;
      updateChart();
    });

  // Add buttons for each country
  const countries = Array.from(new Set(processedData.map(d => d.country)));
  const buttonContainer = d3.select("body")
    .append("div")
    .attr("class", "country-buttons");

  buttonContainer.selectAll("button")
    .data(countries)
    .enter()
    .append("button")
    .text(d => d)
    .on("click", function (_, country) {
      if (!allCountries.has(country)) {
        allCountries.add(country);
      } else {
        allCountries.delete(country);
      }
      updateChart();
    });

  // Draw the initial empty chart
  updateChart();
}).catch(error => {
  console.error("Error loading or processing the CSV file:", error);
});
