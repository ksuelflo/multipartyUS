const container = d3.select("#us-map");
const margin = { top: 100, right: 20, bottom: 0, left: 20 };

const { width, height } = container.node().getBoundingClientRect();
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)

const g = svg.append('g')
    .attr("transform", `translate(${margin.left},${margin.top})`);

const projection = d3.geoAlbersUsa();
const path = d3.geoPath(projection);

const csvData = await d3.csv("../../data/map_data.csv", d => ({
    state: d.state_name,
    party: d.party,
    pct: +d.pct,
    total: +d.total,
    n: +d.n,
    fips: d.inputstate.padStart(2, "0"),
    majority: d.majority,
    moe: +d.moe
}));
const partyNames = Array.from(d3.union(csvData.map(d => d.party)));
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

const majorityByFips = new Map(
    csvData.filter(d => d.majority === "yes").map(d => [d.fips, d])
);

let dataByFips;
let statePaths;
let colorScale;
let currentParty = "majority";

const drawBaseMap = async function () {
    const data = await d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json");
    const states = topojson.feature(data, data.objects.states);

    projection.fitSize([innerWidth, innerHeight], states);

    statePaths = g.selectAll("path.state")
        .data(states.features)
        .join("path")
        .attr("class", "state")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 0.5);
    
    // TOOLTIP--------------------------------------------------------------
    const tooltip = d3.select("#tooltip");

    statePaths
        .on("mouseover", function (event, d) {
            tooltip.style("display", "block");
        })
        .on("mousemove", function (event, d) {
            const majorityMatch = majorityByFips.get(d.id);

            let extraInfo = "";
            if (currentParty !== "majority") {
                const match = dataByFips.get(d.id);
                if (match) {
                    const sorted = Array.from(dataByFips.values()).sort((a, b) => b.pct - a.pct);
                    const rank = sorted.findIndex(row => row.fips === d.id) + 1;

                    extraInfo = `<br>${currentParty}: ${d3.format(".1%")(match.pct)}
                                <br>Rank: ${rank} of ${sorted.length}
                                <br>MOE: ±${d3.format(".1%")(match.moe)}`;
                }
            }

            const miniProjection = d3.geoIdentity().reflectY(true).fitSize([80, 80], d);
            const miniPath = d3.geoPath(miniProjection);

            // same fill logic as the main map's statePaths
            let shapeFill = "#eee";
            if (currentParty === "majority") {
                const match = majorityByFips.get(d.id);
                shapeFill = match ? colorScale(match.party) : "#eee";
            } else {
                const match = dataByFips.get(d.id);
                shapeFill = match ? colorScale(match.pct) : "#eee";
            }

            const shapeSvg = `
                <svg width="80" height="80">
                    <path d="${miniPath(d)}" fill="${shapeFill}" stroke="black" stroke-width="1"/>
                </svg>
            `;

            tooltip
                .style("left", (event.pageX -150) + "px")
                .style("top", (event.pageY -150) + "px")
                .html(`
                    <div class="tooltip-content">
                        <div class="tooltip-text">
                            <strong>${d.properties.name}</strong><br>
                            Majority: ${majorityMatch ? majorityMatch.party : "N/A"}
                            ${extraInfo}
                        </div>
                        <div class="tooltip-shape">${shapeSvg}</div>
                    </div>
                `);
        })
        .on("mouseout", function () {
            tooltip.style("display", "none");
        })
        .on("click", function (event, d) {
            drawStateBar(d.properties.name);
        });

    const borders = topojson.mesh(data, data.objects.states, (a, b) => a !== b);
    g.append("path")
        .datum(borders)
        .attr("class", "state-borders")
        .attr("d", path)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("stroke-linejoin", "round");

    drawCategoricalLegend();
    updateMap("majority");
};

const updateMap = function (party) {
    let dat_filt;
    if (party === "majority"){
        dat_filt = csvData.filter(d => d.majority === "yes")
        dataByFips = new Map(dat_filt.map(d => [d.fips, d]));
        colorScale = d3.scaleOrdinal()
            .domain(partyOrder)
            .range(partyOrder.map(p => partyColors[p]));
        statePaths
            .attr("fill", d => {
                const match = dataByFips.get(d.id);
                return match ? colorScale(match.party) : "#eee";
            });
    }
    else{
        dat_filt = csvData.filter(d => d.party === party);
        dataByFips = new Map(dat_filt.map(d => [d.fips, d]));
        colorScale = d3.scaleSequential()
            // .domain(d3.extent(dat_filt, d => d.pct))
            .domain([0, d3.max(dat_filt, d => d.pct)])
            .interpolator(d3.interpolateRgb("#f5f5f5", partyColors[party]));
        statePaths
            .attr("fill", d => {
                const match = dataByFips.get(d.id);
                return match ? colorScale(match.pct) : "#eee";
            });
        drawLegend(colorScale, party);
    }
    drawTable(party)
};

const legendG = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${250}, ${100})`);

const drawLegend = function (colorScale, party) {
    svg.select("defs").remove();

    const defs = svg.append("defs");
    const [min, max] = colorScale.domain();
    const legendWidth = 450
    const legendHeight = 15

    const gradient = defs.append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%").attr("x2", "100%")
        .attr("y1", "0%").attr("y2", "0%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", colorScale(min));
    gradient.append("stop").attr("offset", "100%").attr("stop-color", colorScale(max));

    // title, above the bar, left-aligned
    legendG.selectAll("text.legend-title")
        .data([party])
        .join("text")
        .attr("class", "legend-title")
        .attr("x", 0)
        .attr("y", -8) // sits above the bar, which starts at y=0
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(d => `% ${d}`);

    legendG.selectAll("rect")
        .data([null])
        .join("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .attr("fill", "url(#legend-gradient)");

    const legendScale = d3.scaleLinear()
        .domain([min, max])
        .range([0, legendWidth]);

    const tickValues = legendScale.ticks(5);

    // tick marks - small vertical lines, sitting right below the bar
    legendG.selectAll("line.legend-tick")
        .data(tickValues)
        .join("line")
        .attr("class", "legend-tick")
        .attr("x1", d => legendScale(d))
        .attr("x2", d => legendScale(d))
        .attr("y1", 0) // bottom of the bar
        .attr("y2", 20) // 5px tick length
        .attr("stroke", "black")
        .attr("stroke-width", .75);

    // tick labels, below the tick marks
    legendG.selectAll("text.legend-tick")
        .data(tickValues)
        .join("text")
        .attr("class", "legend-tick")
        .attr("x", d => legendScale(d))
        .attr("y", 32) // below the tick marks now, was 28
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .text(d => d3.format(".0%")(d));
};

const barContainer = d3.select("#state_bar");
const barMargin = { top: 30, right: 60, bottom: 50, left: 20 };

const { width: barWidth, height: barHeight } = barContainer.node().getBoundingClientRect();
const barInnerWidth = barWidth - barMargin.left - barMargin.right;
const barInnerHeight = barHeight - barMargin.top - barMargin.bottom;
const chartHeight = 300;

const barSvg = barContainer.append("svg")
    .attr("viewBox", `0 0 ${barWidth} ${barHeight}`);

const barG = barSvg.append("g")
    .attr("transform", `translate(${barMargin.left},${barMargin.top})`);

const barTitle = barSvg.append("text")
    .attr("class", "bar-title")
    .attr("x", barMargin.left)
    .attr("y", chartHeight)
    .attr("font-size", "14px")
    .attr("font-weight", "bold");

const barSubtitle = barSvg.append("text")
    .attr("x", barMargin.left)
    .attr("y", chartHeight+20)
    .attr("font-size", "11px")
    .attr("fill", "#666")
    .text("Click a state on the map to change the selection");

const categoricalLegendG = barSvg.append("g")
    .attr("class", "legend-categorical")
    .attr("transform", `translate(${10}, ${40})`); // top-left of the bar panel, tune as needed

const drawStateBar = function (stateName) {
    const stateData = csvData.filter(d => d.state === stateName);
    barTitle.text(stateName);
    
    const yScale = d3.scaleBand()
        .domain(partyOrder)
        .range([chartHeight, barInnerHeight])
        .padding(0.2);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(stateData, d => d.pct)])
        .range([0, barInnerWidth]);

    // --- gridlines (draw first, so bars render on top of them) ---
    barG.selectAll("line.gridline")
        .data(xScale.ticks(5))
        .join("line")
        .attr("class", "gridline")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", chartHeight)
        .attr("y2", barInnerHeight)
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "3,3") // dashed
        .attr("stroke-width", 1);

    // --- bars ---
    barG.selectAll("rect.bar")
        .data(stateData, d => d.party)
        .join("rect")
        .attr("class", "bar")
        .attr("y", d => yScale(d.party))
        .attr("height", yScale.bandwidth())
        .attr("x", 0)
        .attr("width", d => xScale(d.pct))
        .attr("fill", d => partyColors[d.party]);

    // --- bar value labels ---
    barG.selectAll("text.bar-label")
        .data(stateData, d => d.party)
        .join("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d.pct) + 4) // just right of the bar's end
        .attr("y", d => yScale(d.party) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em") // vertical centering trick, explained below
        .attr("font-size", "11px")
        .text(d => d3.format(".1%")(d.pct));

    // --- y axis: ticks only, no text labels ---
    barG.selectAll("g.y-axis")
        .data([null])
        .join("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale).tickFormat("").tickSize(6));

    // --- x axis: percentage labels ---
    barG.selectAll("g.x-axis")
        .data([null])
        .join("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${barInnerHeight})`) // move to bottom
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".0%")));
};

const drawCategoricalLegend = function () {
    legendG.selectAll("*").remove();
    categoricalLegendG.selectAll("rect.legend-swatch")
        .data(partyOrder)
        .join("rect")
        .attr("class", "legend-swatch")
        .attr("x", 0)
        .attr("y", (d, i) => i * 22)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => partyColors[d]);

    categoricalLegendG.selectAll("text.legend-label")
        .data(partyOrder)
        .join("text")
        .attr("class", "legend-label")
        .attr("x", 22) // just right of the 12px swatch, small gap
        .attr("y", (d, i) => i * 22 + 12) // vertically centered on the swatch (swatch height 12, so +10 roughly centers an 11px font)
        .attr("text-anchor", "start")
        .attr("font-size", "13px")
        .text(d => d);
};

const tableContainer = d3.select("#table");
const table = tableContainer.append("table");
const thead = table.append("thead");
const tbody = table.append("tbody");

const drawTable = function (party) {
    thead.selectAll("*").remove();
    tbody.selectAll("*").remove();

    if (party === "majority") {
        const majorityRows = Array.from(majorityByFips.values())
            .sort((a, b) => d3.ascending(a.state, b.state)); // alphabetical by state

        thead.append("tr")
            .selectAll("th")
            .data(["State", "Majority Party"])
            .join("th")
            .text(d => d);

        const rows = tbody.selectAll("tr")
            .data(majorityRows, d => d.fips)
            .join("tr");

        rows.selectAll("td")
            .data(d => [d.state, d.party])
            .join("td")
            .text(d => d);
    } else {
        const partyRows = csvData.filter(d => d.party === party);

        // for the rank column, we need each state's full 9-party breakdown,
        // ranked internally, then pull out just this party's rank per state
        const rankByState = new Map();
        for (const state of new Set(csvData.map(d => d.state))) {
            const withinState = csvData
                .filter(d => d.state === state)
                .sort((a, b) => b.pct - a.pct); // descending by pct

            const rank = withinState.findIndex(d => d.party === party) + 1;
            rankByState.set(state, rank);
        }

        const sortedPartyRows = partyRows.sort((a, b) => d3.ascending(a.state, b.state));

        thead.append("tr")
            .selectAll("th")
            .data(["State", `% ${party}`, "Rank (of 9)"])
            .join("th")
            .text(d => d);

        const rows = tbody.selectAll("tr")
            .data(sortedPartyRows, d => d.fips)
            .join("tr");

        rows.selectAll("td")
            .data(d => [
                d.state,
                d3.format(".1%")(d.pct),
                `${rankByState.get(d.state)}`
            ])
            .join("td")
            .text(d => d);
    }
            
};

drawStateBar("California");
drawBaseMap();
drawTable("majority");

d3.select("#party-select").on("change", function () {
    currentParty = this.value;
    updateMap(currentParty);
});