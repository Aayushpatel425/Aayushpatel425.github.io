let currentSlide = 0;
const slides = [
  function() { drawSlide1(); },
  function() { window.location.href = 'slide2.html'; },
  function() { drawSlide3(); } 
];

function updateSlide() {
  document.querySelectorAll('.slide-text').forEach((el, index) => {
    el.style.display = index === currentSlide ? 'block' : 'none';
  });
  
  slides[currentSlide](); 
  updateNavigation();
}

function updateNavigation() {
  document.getElementById('prev').disabled = currentSlide === 0;
  document.getElementById('next').disabled = currentSlide === slides.length - 1;
}

document.getElementById('prev').addEventListener('click', function() {
  if (currentSlide > 0) {
    currentSlide--;
    updateSlide();
  }
});

document.getElementById('next').addEventListener('click', function() {
  if (currentSlide < slides.length - 1) {
    currentSlide++;
    updateSlide();
  }
});

function drawSlide1() {
  drawChart();
}

function drawSlide3() {
  document.getElementById('chart').innerHTML = '<h1>Slide 3: Placeholder</h1>';
}
function drawChart() {
  d3.select("#chart").append("svg").attr("width", 500).attr("height", 300)
    .append("text").text("Real Estate Value Trends - United States")
    .attr("x", 250).attr("y", 150).attr("text-anchor", "middle");
    d3.csv("data/zhvi.csv").then(data => {
      const parseDate = d3.timeParse("%Y-%m-%d");
      const regions = data.map(d => d.RegionName);
      const uniqueRegions = Array.from(new Set(regions)).sort();
    
      const select = d3.select("#region-select");
      select.selectAll("option")
          .data(uniqueRegions)
          .enter()
          .append("option")
          .text(d => d)
          .attr("value", d => d);
    
      function updateChart(region) {
          const regionData = data.filter(d => d.RegionName === region).map(d => {
              return Object.keys(d).filter(key => key.includes('-')).map(date => {
                  return {
                      date: parseDate(date),
                      value: +d[date]
                  };
              });
          }).flat();
          const margin = {top: 40, right: 20, bottom: 70, left: 100};
                width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;
    
          d3.select("#chart").selectAll("*").remove();
          const svg = d3.select("#chart")
            .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);
    
          const x = d3.scaleTime()
            .domain(d3.extent(regionData, d => d.date))
            .range([0, width]);
          const xAxis = svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));
          xAxis.append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "#000")
            .text("Year")
            .style("font-size", "16px")
            .style("text-anchor", "middle");
    
          const y = d3.scaleLinear()
            .domain([0, d3.max(regionData, d => d.value)])
            .range([height, 0]);
          const yAxis = svg.append("g")
            .call(d3.axisLeft(y));
          yAxis.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -60)
            .attr("x", -height / 2)
            .attr("fill", "#000")
            .text("Property Value (USD)")
            .style("font-size", "16px")
            .style("text-anchor", "middle");
    
          const path = svg.append("path")
            .datum(regionData)
            .attr("fill", "none")
            .attr("stroke", "#007BFF")
            .attr("stroke-width", 2)
            .attr("d", d3.line()
              .x(d => x(d.date))
              .y(d => y(d.value))
              .curve(d3.curveMonotoneX));
    
          const totalLength = path.node().getTotalLength();
          path.attr("stroke-dasharray", totalLength + " " + totalLength)
              .attr("stroke-dashoffset", totalLength)
              .transition()
              .duration(2000)
              .attr("stroke-dashoffset", 0);
    
          svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .text(`Real Estate Value Trends - ${region}`);
          
            const crisisYear = new Date('2008-01-01');
            const xPosition = x(crisisYear);
            
            svg.append("line")
                .attr("x1", xPosition)
                .attr("x2", xPosition)
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke", "red")
                .attr("stroke-width", "2")
                .attr("stroke-dasharray", "5,5");
            
            svg.append("text")
                .attr("x", xPosition + 10)
                .attr("y", 20)
                .attr("fill", "red")
                .text("2008 Financial Crisis Start");
    
          const focus = svg.append("g")
              .attr("class", "focus")
              .style("display", "none");
    
          focus.append("circle")
              .attr("r", 5);
    
          focus.append("rect")
              .attr("x", 10)
              .attr("width", 90)
              .attr("height", 50)
              .attr("fill", "white")
              .style("opacity", 0.5);
    
          focus.append("text")
              .attr("x", 18)
              .attr("dy", "1.2em");
    
          svg.append("rect")
              .attr("class", "overlay")
              .attr("width", width)
              .attr("height", height)
              .style("opacity", 0)
              .on("mouseover", () => focus.style("display", null))
              .on("mouseout", () => focus.style("display", "none"))
              .on("mousemove", mousemove);
    
              function mousemove(event) {
                const x0 = x.invert(d3.pointer(event, this)[0]),
                    i = d3.bisector(d => d.date).left(regionData, x0, 1),
                    d0 = regionData[i - 1],
                    d1 = regionData[i],
                    d = x0 - d0.date > d1.date - x0 ? d1 : d0;
                focus.attr("transform", `translate(${x(d.date)},${y(Math.round(d.value))})`);
                focus.select("text").text(`Date: ${d3.timeFormat("%Y-%m-%d")(d.date)}, Value: ${Math.round(d.value).toLocaleString()}`);
            }
      }
    
      updateChart("United States");
      select.on("change", function() {
          updateChart(this.value);
      });
    }).catch(error => console.error('Error loading or parsing data:', error));
}

updateSlide();




