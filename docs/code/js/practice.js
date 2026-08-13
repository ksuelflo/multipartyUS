
const container = d3.select("#barplot");
const { width, height } = container.node().getBoundingClientRect();
const margin = { top: 20, right: 20, bottom: 40, left: 100 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);
const g = svg.append('g')
    .attr("transform", `translate(${margin.left},${margin.top})`)

const xScale = d3.scaleLinear()
    .domain([0,1])
    .range([0, innerWidth])

d3.csv("../../data/clustered_parties_qs.csv").then(function(data){
    const dat_filt = data.filter(function(d) {return d.variable == "CC24_321a"});
    console.log(dat_filt);
    const categories = d3.union(dat_filt.map(d => d.party));
    console.log(categories);
    const yScale = d3.scaleBand().domain(categories).range([innerHeight, 0]).padding(0.2)
    const stackedData = d3.stack()
    .keys(["pct_1", "pct_2"])
    (dat_filt);
    
    g.append('g')
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale));
        
    g.append('g').call(d3.axisLeft(yScale));

    g.selectAll('rect')
        .data(stackedData)
        .enter()
        .append('rect')
        .attr('fill', function(d){return })

    g.selectAll('rect')
    .data(dat_filt)
    .enter()
    .append('rect')
    .attr('x', xScale(0))
    .attr(`y`, d => yScale(d.party))
    .attr(`width`, function(d) {return xScale(d.pct_1)})
    .attr(`height`, yScale.bandwidth())
})

