document.getElementById('prev').addEventListener('click', function() {
    window.location.href = 'slide3.html'; 
});

document.getElementById('next').addEventListener('click', function() {
    window.location.href = 'index.html';
});

const interestRateSlider = document.getElementById('interestRate');
const economicGrowthSlider = document.getElementById('economicGrowth');
const interestRateValue = document.getElementById('interestRateValue');
const economicGrowthValue = document.getElementById('economicGrowthValue');

interestRateSlider.addEventListener('input', updateChart);
economicGrowthSlider.addEventListener('input', updateChart);

function updateChart() {
    interestRateValue.textContent = interestRateSlider.value + '%';
    economicGrowthValue.textContent = economicGrowthSlider.value + '%';

    drawProjectionChart(interestRateSlider.value, economicGrowthSlider.value);
}

function drawProjectionChart(interestRate, economicGrowth) {
    const margin = { top: 40, right: 100, bottom: 70, left: 100 },
        width = 1200 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    d3.select("#chart").selectAll("*").remove();
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("data/MSPUS.csv").then(data => {
        const parseDate = d3.timeParse("%Y-%m-%d");

        const regionData = data.map(d => {
            const date = parseDate(d["DATE"]);
            const price = +d["MSPUS"];
            return { date, price };
        }).filter(d => d.date && d.price);

        if (regionData.length === 0) {
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "20px")
                .style("fill", "red")
                .text("No data available for the selected region");
            return;
        }

        const historicalData = regionData.map(d => ({
            year: d.date.getFullYear(),
            price: d.price
        }));

        const futureYears = d3.range(2023, 2033);
        const lastYearData = historicalData[historicalData.length - 1];
        const projections = futureYears.map(year => {
            const factor = (1 + (economicGrowth / 100)) / (1 + (interestRate / 100));
            const yearsDiff = year - lastYearData.year;
            const projectedPrice = lastYearData.price * Math.pow(factor, yearsDiff);
            return {
                year: year,
                price: projectedPrice
            };
        });

        const x = d3.scaleLinear()
            .domain([1960, 2040])
            .range([0, width])
            .nice();

        const y = d3.scaleLinear()
            .domain([0, d3.max(historicalData.concat(projections), d => d.price)])
            .range([height, 0])
            .nice();

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")));

        svg.append("g")
            .call(d3.axisLeft(y));

        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.price));

        svg.append("path")
            .datum(historicalData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", line);

        svg.append("path")
            .datum(projections)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "5,5")
            .attr("d", line);

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        svg.append("g")
            .selectAll("circle")
            .data(historicalData)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.price))
            .attr("r", 3)
            .attr("fill", "blue")
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`Year: ${d.year}<br/>Price: $${d.price.toFixed(2)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        svg.append("g")
            .selectAll("circle")
            .data(projections)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.year))
            .attr("cy", d => y(d.price))
            .attr("r", 3)
            .attr("fill", "red")
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`Year: ${d.year}<br/>Price: $${d.price.toFixed(2)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width / 2 + margin.left)
            .attr("y", height + margin.top + 20)
            .text("Year");

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 40)
            .attr("x", -height / 2)
            .text("Projected Price (USD)");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Future Market Predictions and Influencing Factors");

        svg.append("text")
            .attr("x", x(2026))
            .attr("y", y(projections.find(d => d.year === 2026).price) - 10)
            .attr("text-anchor", "start")
            .style("font-size", "12px")
            .style("fill", "red")
            .text("Projected increase due to economic growth");

        svg.append("text")
            .attr("x", x(2030))
            .attr("y", y(projections.find(d => d.year === 2030).price) + 15)
            .attr("text-anchor", "start")
            .style("font-size", "12px")
            .style("fill", "red")
            .text("Impact of higher interest rates");

    }).catch(error => console.error('Error loading or parsing data:', error));
}

updateChart();
