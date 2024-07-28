document.getElementById('prev').addEventListener('click', function() {
    window.location.href = 'slide2.html'; 
});

document.getElementById('next').addEventListener('click', function() {
    window.location.href = 'slide4.html';
});

function drawScatterPlot() {
    const margin = {top: 40, right: 100, bottom: 70, left: 100},
        width = 1200 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    d3.select("#chart").selectAll("*").remove();
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("data/real_estate_data_corrected.csv").then(data => {
        console.log("CSV Data Loaded:", data);

        data.forEach(d => {
            d["5-Year Appreciation"] = +d["5-Year Appreciation"].replace('%', '');
            d["Peak-to-Current"] = +d["Peak-to-Current"].replace('%', '');
            d["Peak-to-Trough"] = +d["Peak-to-Trough"].replace('%', '');
        });

        console.log("Processed Data:", data);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d["5-Year Appreciation"]) + 10]) 
            .range([0, width])
            .nice();


        const y = d3.scaleLinear()
            .domain([d3.min(data, d => d["Peak-to-Current"]) - 10, d3.max(data, d => d["Peak-to-Current"]) + 10]) 
            .range([height, 0])
            .nice();

        const size = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d["Peak-to-Trough"])])
            .range([2, 8]); 

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .call(d3.axisLeft(y));

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        svg.append('g')
            .selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d["5-Year Appreciation"]))
            .attr("cy", d => y(d["Peak-to-Current"]))
            .attr("r", d => size(d["Peak-to-Trough"]))
            .attr("fill", d => color(d.State))
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`State: ${d.State}<br/>5-Year Appreciation: ${d["5-Year Appreciation"]}%<br/>Peak-to-Current: ${d["Peak-to-Current"]}%<br/>Peak-to-Trough: ${d["Peak-to-Trough"]}%`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width / 2 + margin.left)
            .attr("y", height + margin.top + 20)
            .text("5-Year Appreciation (%)");

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 40)
            .attr("x", -height / 2)
            .text("Peak-to-Current (%)");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text("State Housing Market Recovery and Appreciation (2012-2017)");
    }).catch(error => {
        console.error('Error loading or parsing data:', error);
    });
}

drawScatterPlot();
