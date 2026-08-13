
// LEFT PANEL FUNCTIONS-------------------------------------------------------------------

const csvData = await d3.csv("../../data/dem_data_by_party.csv", d => ({
    party: d.party,
    variable: d.variable,
    value: d.value,
    value_label: d.value_label,
    respondents: +d.respondents,
    total: +d.total,
    pct: +d.pct
}));

const densityData = await d3.csv("../../data/age_density.csv", d => ({
    party: d.party,
    density: +d.density,
    age: +d.age
}));

const create_bar = function(party, cat, g, width, height) {
    const margin = { top: 10, right: 10, bottom: 60, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const filtData = csvData.filter(d => d.party === party).filter(d => d.variable === cat);

    const categories = filtData.map(d => d.value_label);

    const xScale = d3.scaleBand()
        .domain(categories)
        .range([0, innerWidth])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(csvData.filter(d => d.variable === cat), d => d.pct)])
        .nice()
        .range([innerHeight, 0]);

    let plotG = g.select('g.plot-area');
    if (plotG.empty()) {
        plotG = g.append('g')
            .attr('class', 'plot-area')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);
    }

    plotG.selectAll('rect')
        .data(filtData, d => d.value_label) // key function — matches bars by label across redraws
        .join('rect')
        .attr('fill', 'steelblue')
        .attr('x', d => xScale(d.value_label))
        .attr('width', xScale.bandwidth())
        .transition()
        .duration(500)
        .attr('y', d => yScale(d.pct))
        .attr('height', d => innerHeight - yScale(d.pct));

    // x-axis
    let xAxisG = plotG.select('g.x-axis');
    if (xAxisG.empty()) {
        xAxisG = plotG.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${innerHeight})`);
    }
    xAxisG.call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-35)')
        .style('text-anchor', 'end');

    // y-axis
    let yAxisG = plotG.select('g.y-axis');
    if (yAxisG.empty()) {
        yAxisG = plotG.append('g')
            .attr('class', 'y-axis');
    }

    const yTicks = yScale.ticks(5);
    const maxTick = yTicks[yTicks.length - 1];

    yAxisG.call(
        d3.axisLeft(yScale)
            .tickValues(yTicks)
            .tickFormat(d => {
                const pctValue = Math.round(d * 100);
                return d === maxTick ? `${pctValue}%` : `${pctValue}`;
            })
    );

    // x-axis label
    let xLabel = plotG.select('text.x-axis-label');
    if (xLabel.empty()) {
        xLabel = plotG.append('text')
            .attr('class', 'x-axis-label')
            .attr('text-anchor', 'middle')
            .attr('fill', 'currentColor');
    }
    xLabel
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + margin.bottom - 5)
        .text(filterLabels[cat]);
};

const create_density = function(party, g, width, height) {
    const margin = { top: 10, right: 10, bottom: 45, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const filtData = densityData.filter(d => d.party === party)
        .sort((a, b) => a.age - b.age);

    const xScale = d3.scaleLinear()
        .domain(d3.extent(densityData, d => d.age))
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(densityData, d => d.density)])
        .range([innerHeight, 0]);

    const area = d3.area()
        .x(d => xScale(d.age))
        .y0(innerHeight)
        .y1(d => yScale(d.density))
        .curve(d3.curveBasis);

    const line = d3.line()
        .x(d => xScale(d.age))
        .y(d => yScale(d.density))
        .curve(d3.curveBasis);

    let plotG = g.select('g.plot-area');
    if (plotG.empty()) {
        plotG = g.append('g')
            .attr('class', 'plot-area')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);
    }

    plotG.selectAll('path.density-area')
        .data([filtData])
        .join('path')
        .attr('class', 'density-area')
        .attr('fill', 'steelblue')
        .attr('fill-opacity', 0.3)
        .transition()
        .duration(500)
        .attr('d', area);

    plotG.selectAll('path.density-line')
        .data([filtData])
        .join('path')
        .attr('class', 'density-line')
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .transition()
        .duration(500)
        .attr('d', line);

    let xAxisG = plotG.select('g.x-axis');
    if (xAxisG.empty()) {
        xAxisG = plotG.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${innerHeight})`);
    }
    xAxisG.call(
        d3.axisBottom(xScale)
            .ticks(6)
            .tickSize(6)
            .tickSizeOuter(0)
    );

    let xLabel = plotG.select('text.x-axis-label');
    if (xLabel.empty()) {
        xLabel = plotG.append('text')
            .attr('class', 'x-axis-label')
            .attr('text-anchor', 'middle')
            .attr('fill', 'currentColor');
    }
    xLabel
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 35)
        .text('Age');
};

// LEFT PANEL CALLING FUNCS AND SETTING UP GRID--------------------------------------------

const leftPanel = d3.select("#left-panel");
const rightPanel = d3.select("#right-panel");
const filterLabels = {
    faminc_new: "Income",
    race: "Race",
    educ: "Education",
    gender4: "Gender",
    age: "Age"
};

function partyToSlug(party) {
    return party.toLowerCase().replace(/\s+/g, '-');
}

function updatePartyLink(party) {
    d3.select('#party-page-link')
        .attr('href', `index.html#${partyToSlug(party)}`)
        .text(`View ${party} →`);
}

// build the grid container inside the left panel
const chartGrid = leftPanel.append('div')
    .attr('class', 'chart-grid');

const categories = ["faminc_new", "age", "race", "educ", "gender4"];
const topRowCats = ["faminc_new", "age"]; // the 2 wide charts

const chartGroups = categories.map(cat => {
    const rowClass = topRowCats.includes(cat) ? 'top-row' : 'bottom-row';

    const slot = chartGrid.append('div')
        .attr('class', `chart-slot ${rowClass}`)
        .attr('id', `chart-${cat}`);

    const { width, height } = slot.node().getBoundingClientRect();

    const svg = slot.append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`);

    return { cat, g: svg, width, height };
});

// Draw charts intially
chartGroups.forEach(({ cat, g, width, height }) => {
        if (cat === "age") {
            create_density("Progressive Left", g, width, height);
        } else {
            create_bar("Progressive Left", cat, g, width, height);
        }
    });
updatePartyLink("Progressive Left"); // NEW — matches initial default party

d3.select("#party-select").on("change", function() {
    const selectedParty = this.value;
    chartGroups.forEach(({ cat, g, width, height }) => {
        if (cat === "age") {
            create_density(selectedParty, g, width, height);
        } else {
            create_bar(selectedParty, cat, g, width, height);
        }
    });
    updatePartyLink(selectedParty); // NEW — keeps link in sync with dropdown
});


// RIGHT PANEL FUNCS----------------------------------------------------------------------

function bucketAge(age) {
    if (age < 30) return "18-29";
    if (age < 45) return "30-44";
    if (age < 60) return "45-59";
    if (age < 75) return "60-74";
    return "75+";
}

const rawData = await d3.csv("../../data/raw_dem_data.csv", d => ({
    party: d.party,
    commonweight: +d.commonweight,
    age: bucketAge(+d.age),
    gender4: d.gender4,
    educ: d.educ,
    race: d.race,
    faminc_new: d.faminc_new
}));

const filterVariables = ["faminc_new", "race", "educ", "gender4"];
const filterState = {
    age: null,
    faminc_new: null,
    race: null,
    educ: null,
    gender4: null
};
const partyColors = {
    "Progressive Left": "#0a3d6b",
    "Religious Moderates": "#1a5fa0",
    "Moderate Left": "#2e86c1",
    "Disillusioned Left": "#7ab8e8",
    "Secular Moderates": "#e8d44d",
    "MAGA Right": "#f4a043",
    "Traditional Right": "#e05c2a",
    "Faith-Based Conservatives": "#c02020",
    "Nationalist Right": "#6b0000"
};
const partyOrder = [
    "Progressive Left",
    "Religious Moderates",
    "Moderate Left",
    "Disillusioned Left",
    "Secular Moderates",
    "MAGA Right",
    "Traditional Right",
    "Faith-Based Conservatives",
    "Nationalist Right"
];

function getFilteredData() {
    return rawData.filter(d => {
        return Object.entries(filterState).every(([variable, value]) => {
            if (value === null) return true; // no filter active on this variable
            return d[variable] === value;
        });
    });
}

function aggregateByParty(filteredData) {
    const grouped = d3.rollup(
        filteredData,
        v => d3.sum(v, d => d.commonweight), // swap to v.length if you want raw unweighted counts
        d => d.party
    );

    // ensure all 9 parties appear even if a filter zeroes one out
    return partyOrder.map(party => ({
        party,
        value: grouped.get(party) ?? 0
    }));
}

function create_party_bar(g, width, height) {
    const margin = { top: 15, right: 10, bottom: 90, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const filtered = getFilteredData();
    const partyData = aggregateByParty(filtered);

    const xScale = d3.scaleBand()
        .domain(partyOrder)
        .range([0, innerWidth])
        .padding(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(partyData, d => d.value)])
        .nice()
        .range([innerHeight, 0]);

    let plotG = g.select('g.plot-area');
    if (plotG.empty()) {
        plotG = g.append('g')
            .attr('class', 'plot-area')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);
    }

    plotG.selectAll('rect')
        .data(partyData, d => d.party)
        .join('rect')
        .attr('fill', d => partyColors[d.party]) // your existing party -> hex lookup
        .attr('x', d => xScale(d.party))
        .attr('width', xScale.bandwidth())
        .transition()
        .duration(400)
        .attr('y', d => yScale(d.value))
        .attr('height', d => innerHeight - yScale(d.value));

    // x-axis, y-axis — same pattern as create_bar
    let xAxisG = plotG.select('g.x-axis');
    if (xAxisG.empty()) {
        xAxisG = plotG.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${innerHeight})`);
    }
    xAxisG.call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'rotate(-35)')
        .style('text-anchor', 'end');

    let yAxisG = plotG.select('g.y-axis');
    if (yAxisG.empty()) {
        yAxisG = plotG.append('g').attr('class', 'y-axis');
    }
    yAxisG.call(d3.axisLeft(yScale).ticks(5));
}

// RIGHT PANEL CALLING FUNCS AND SETTING UP-----------------------------------------------

const filterPanel = rightPanel.append('div')
    .attr('class', 'filter-panel');

filterVariables.forEach(variable => {
    const labels = [...new Set(csvData.filter(d => d.variable === variable).map(d => d.value_label))];

    const group = filterPanel.append('div')
        .attr('class', 'filter-group');

    group.append('label')
        .attr('for', `filter-${variable}`)
        .text(filterLabels[variable]);

    const select = group.append('select')
        .attr('id', `filter-${variable}`)
        .attr('class', 'filter-select')
        .attr('data-variable', variable);

    select.selectAll('option')
        .data(['All', ...labels])
        .join('option')
        .text(d => d);
});

// age — separate block, same visual group styling
const ageLabels = ["18-29", "30-44", "45-59", "60-74", "75+"];

const ageGroup = filterPanel.append('div')
    .attr('class', 'filter-group');

ageGroup.append('label')
    .attr('for', 'filter-age')
    .text(filterLabels.age);

ageGroup.append('select')
    .attr('id', 'filter-age')
    .attr('class', 'filter-select')
    .attr('data-variable', 'age')
    .selectAll('option')
    .data(['All', ...ageLabels])
    .join('option')
    .text(d => d);

// party chart
const partyChartWrapper = rightPanel.append('div')
    .attr('class', 'party-chart-wrapper');

const { width: partyChartWidth, height: partyChartHeight } = partyChartWrapper.node().getBoundingClientRect();

const partyChartG = partyChartWrapper.append('svg')
    .attr('viewBox', `0 0 ${partyChartWidth} ${partyChartHeight}`);

create_party_bar(partyChartG, partyChartWidth, partyChartHeight);

d3.selectAll('.filter-select').on('change', function() {
    const variable = this.dataset.variable;
    filterState[variable] = this.value === 'All' ? null : this.value;
    create_party_bar(partyChartG, partyChartWidth, partyChartHeight);
});