document.getElementById('prev').addEventListener('click', function() {
    window.location.href = 'index.html'; 
});

document.getElementById('next').addEventListener('click', function() {
    window.location.href = 'slide3.html';
});

function drawBarChart() {
    const margin = {top: 40, right: 100, bottom: 70, left: 100},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    d3.select("#chart").selectAll("*").remove();
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const files = ["region/MSPS.csv", "region/MSPMW.csv", "region/MSPW.csv", "region/MSPNE.csv"];
    const promises = files.map(file => d3.csv(file));

    Promise.all(promises).then(data => {
        const parseDate = d3.timeParse("%Y-%m-%d");
        const mergedData = data.flatMap((d, i) => {
            const regionName = files[i].split('/')[1].replace('.csv', '');
            return d.map(row => ({
                date: parseDate(row.DATE),
                value: +row[regionName],
                region: regionName
            }));
        });

        const regions = ["MSPS", "MSPMW", "MSPW", "MSPNE"];
        const values = regions.map(region => {
            const regionData = mergedData.filter(d => d.region === region);
            const beforeData = regionData.filter(d => d.date < new Date('2008-01-01'));
            const afterData = regionData.filter(d => d.date >= new Date('2009-01-01'));

            const beforeAvg = d3.mean(beforeData, d => d.value);
            const afterAvg = d3.mean(afterData, d => d.value);

            return {
                region: region,
                before: beforeAvg,
                after: afterAvg
            };
        });

        const x0 = d3.scaleBand()
            .domain(regions)
            .range([0, width])
            .padding(0.2);

        const x1 = d3.scaleBand()
            .domain(["before", "after"])
            .range([0, x0.bandwidth()])
            .padding(0.05);

        const y = d3.scaleLinear()
            .domain([0, d3.max(values, d => Math.max(d.before, d.after))])
            .nice()
            .range([height, 0]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x0));

        svg.append("g")
            .call(d3.axisLeft(y));

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        const regionGroups = svg.selectAll(".region-group")
            .data(values)
            .enter()
            .append("g")
            .attr("class", "region-group")
            .attr("transform", d => `translate(${x0(d.region)},0)`);

        regionGroups.selectAll("rect")
            .data(d => ["before", "after"].map(key => ({key: key, value: d[key], region: d.region})))
            .enter()
            .append("rect")
            .attr("x", d => x1(d.key))
            .attr("y", d => y(d.value))
            .attr("width", x1.bandwidth())
            .attr("height", d => height - y(d.value))
            .attr("fill", d => d.key === "before" ? "#007BFF" : "#FF5733")
            .on("mouseover", function(event, d) {
                d3.select(this).transition()
                    .duration(100)
                    .attr("fill", d.key === "before" ? "#0056b3" : "#e04b2f");
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`Region: ${d.region}<br/>Period: ${d.key.charAt(0).toUpperCase() + d.key.slice(1)}<br/>Value: ${Math.round(d.value).toLocaleString()}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this).transition()
                    .duration(100)
                    .attr("fill", d.key === "before" ? "#007BFF" : "#FF5733");
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", function(event, d) {
                console.log(d);
                d3.selectAll("rect").classed("selected", false);
                d3.select(this).classed("selected", true);
                showDetails(d);
            });

        const legend = svg.selectAll(".legend")
            .data(["Before", "After"])
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(0,${i * 20})`);

        legend.append("rect")
            .attr("x", width + 30)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", d => d === "Before" ? "#007BFF" : "#FF5733");

        legend.append("text")
            .attr("x", width + 55)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(d => d);

        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width / 2 + margin.left)
            .attr("y", height + margin.top + 20)
            .text("Region");

        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 40)
            .attr("x", -height / 2)
            .text("Average Property Value (USD)");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text("Regional Impact and Recovery Differences");

        function showDetails(data) {
            let detailsPanel = d3.select("#details-panel");
            if (detailsPanel.empty()) {
                detailsPanel = d3.select("body").append("div")
                    .attr("id", "details-panel")
                    .attr("class", "details-panel")
                    .style("position", "absolute")
                    .style("right", "10px")
                    .style("top", "10px")
                    .style("width", "200px")
                    .style("padding", "10px")
                    .style("background-color", "#f9f9fb")
                    .style("border", "1px solid #ccc")
                    .style("border-radius", "5px")
                    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.2)");
            }

            const beforeValue = data.key === "before" ? data.value : values.find(v => v.region === data.region).before;
            const afterValue = data.key === "after" ? data.value : values.find(v => v.region === data.region).after;
            const difference = afterValue - beforeValue;
            const percentageChange = ((difference / beforeValue) * 100).toFixed(2);

            detailsPanel.html(`
                <h3>Region: ${data.region}</h3>
                <p>Period: ${data.key.charAt(0).toUpperCase() + data.key.slice(1)}</p>
                <p>Value: ${Math.round(data.value).toLocaleString()}</p>
                <h4>Difference Analysis</h4>
                <p>Before: ${Math.round(beforeValue).toLocaleString()}</p>
                <p>After: ${Math.round(afterValue).toLocaleString()}</p>
                <p>Difference: ${Math.round(difference).toLocaleString()}</p>
                <p>Percentage Change: ${percentageChange}%</p>
            `);
        }
    });
}

drawBarChart();