const scaleFactor = 1.5;

let width = 1500 / scaleFactor;
let height = 1080 / scaleFactor;

const margin = {
    "top": (0 + 84) / scaleFactor,
    "left": (70 + 84) / scaleFactor,
    "bottom": (85 + 84) / scaleFactor,
    "right": (0 + 84) / scaleFactor
}

//prep / clean data

data = data.filter(d => d.Gain2020 !== "" && d.Emissions2019 !== "" && d.GDP2021 !== "")

data = data.map(d => {
    return {
        ...d,
        GDPMil: d.GDP2021 / 1000000
    }
})

data = data.sort((a, b) => {
    return d3.descending(a.Gain2020, b.Gain2020);
}); //in order to have the smallest circles in front


const legendData = [{ "income": "Low income", "color": "#fbb4b9" }, { "income": "Lower middle income", "color": "#f768a1" }, { "income": "Upper middle income", "color": "#c51b8a" }, { "income": "High income", "color": "#7a0177" }];

const income = legendData.map(d => d.income)
const colors = legendData.map(d => d.color)

//scales

const xScale = d3.scaleLog()
    .domain([200, d3.max(data, d => d.GDPMil)])
    .range([0, width])

const yScale = d3.scaleLog()
    .domain([0.03, 40]) //d3.extent(data, d => d.Emissions2019)
    .range([height, 0]);

const sizeScale = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Gain2020))
    .range([3, 30]);

const colorScale = d3.scaleOrdinal()
    .domain(income)
    .range(colors)


//create data to draw legends for circle
const circleData = [{ "size": 3, "gain": sizeScale.invert(3) }, { "size": 10, "gain": sizeScale.invert(10) }, { "size": 20, "gain": sizeScale.invert(20) }, { "size": 30, "gain": sizeScale.invert(30) }]

//axes

let xAxis = d3.axisBottom(xScale).ticks(10).tickFormat(xScale.tickFormat(10, ""))
let yAxis = d3.axisLeft(yScale).ticks(10).tickFormat(xScale.tickFormat(10, ""))

//svg & g
const svg = d3.select("#chart").append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom);
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

g.append("g")
    .attr("class", "y-axis")
    .call(yAxis);

g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

// create group then add circle and text
// add g to ensure text and circle of the same data point have the same drawing order
const circleG = g.selectAll("g.circleG")
    .data(data)
    .join("g")
    .attr("class", "circleG");

circleG.append("circle")
    .attr("class", "circle")
    .attr("cx", d => xScale(d.GDPMil))
    .attr("cy", d => yScale(d.Emissions2019))
    .attr("r", d => sizeScale(d.Gain2020))
    .attr("fill", d => colorScale(d.income))
    .attr("stroke", "#fff")
    .attr("opacity", 0.85);

circleG.append("text")
    .attr("class", "text")
    .attr("x", d => xScale(d.GDPMil))
    .attr("y", d => yScale(d.Emissions2019))
    .attr("fill", d => d.income === "High income" | d.income === "Upper middle income" ? "#fff" : "#000")
    .attr("font-size", 9)
    .attr("font-weight", 700)
    .attr("text-anchor", "middle")
    .attr("dy", 3)
    .text(d => d.CountryCode);


const simulation = d3.forceSimulation(data)

    .force('x', d3.forceX().x(d => xScale(d.GDPMil)))
    .force('y', d3.forceY().y(d => yScale(d.Emissions2019)))
    .force('collision', d3.forceCollide().radius(d=>sizeScale(d.Gain2020)+1))
        .on('tick', function() {
          svg.selectAll('.circle')
            .attr('cx', function(d) { return d.x; })
            .attr('cy', function(d) { return d.y; })

          svg.selectAll('.text')
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
        })

//axes labels

g.append("text")
    .attr("x", 20)
    .attr("y", height - 10)
    .attr("font-weight", 700)
    .text("GDP, in USD millions (log)");

g.append("text")
    .attr("x", -height + 30)
    .attr("y", 20)
    .attr("font-weight", 700)
    .attr("transform", "rotate(-90)") //if you rotate, you need to swap the x and y values and make the x negative
    .text("CO2 emissions, metric tons per capita (log)");
    

const legendWidth = 200;
const legendHeight = 200;
const legendG = g.append("g")
    .attr("class", "legendG")
    .attr("transform", `translate(${width - legendWidth}, ${height - legendHeight})`);

legendG.append("text")
    .attr("font-size", 14)
    .attr("x", -20)
    .attr("y", 0)
    .text("NG-Gain index*");

legendG.append("text")
    .attr("font-size", 14)
    .attr("x", legendWidth / 2)
    .attr("y", 0)
    .text("Income level");

legendG.append("text")
    .attr("font-size", 12)
    .attr("x", -20)
    .attr("y", legendHeight-10)
    .text("*Vulnerability to climate change, larger = less");

const gainG = legendG.selectAll("g.gainG")
    .data(circleData)
    .join("g")
    .attr("class", "gainG");

gainG.append("circle")
    .attr("class", "gainCircle")
    .attr("cx", 0)
    .attr("cy", (d, i) => 20 + (i + 1) * d.size)
    .attr("r", d => d.size)
    .attr("fill", "#fff")
    .attr("stroke", "#000")

gainG.append("text")
    .attr("class", "gainText")
    .attr("x", 35)
    .attr("y", (d, i) => 20 + (i + 1) * d.size)
    .attr("font-size", 12)
    .text(d => Math.round(d.gain * 10) / 10);

const incomeG = legendG.selectAll("g.incomeG")
    .data(legendData.reverse())
    .join("g")
    .attr("class", "incomeG");

incomeG.append("rect")
    .attr("class", "incomeRect")
    .attr("x", legendWidth / 2)
    .attr("y", (d, i) => 20 + i * 20)
    .attr("width", 15)
    .attr("height", 15)
    .attr("fill", d => d.color)

incomeG.append("text")
    .attr("class", "incomeText")
    .attr("x", legendWidth / 2 + 20)
    .attr("y", (d, i) => 30 + i * 20)
    .attr("font-size", 12)
    .text(d => d.income);
