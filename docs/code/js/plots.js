// Party tab order, left to right, as shown in the subnav
const PARTY_ORDER = [
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

// Colorblind-friendly categorical palette (Okabe & Ito, 2008)
const OKABE_ITO = ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#000000'];

// Variables whose response categories run along a left-right political spectrum,
// where a blue (liberal/Democratic) -> red (conservative/Republican) scale reads better
// than an arbitrary categorical palette
const POLITICAL_VARIABLES = ['CC24_330a', 'pid7', 'pid3'];

// A diverging blue -> red scale, ordered by each subgroup's numeric response value
const politicalColorScale = subgroups => {
  const numericValues = subgroups.map(key => +key.replace('pct_', ''));
  const diverging = d3.scaleSequential(t => d3.interpolateRdBu(1 - t))
      .domain(d3.extent(numericValues));
  return key => diverging(+key.replace('pct_', ''));
};

const horzbar = function(variable, data, svg, colors, codebook = "data/codebook.csv"){

  // Read the outer svg dimensions (set via .attr in your setup code)
  const totalWidth = +svg.attr("width");
  const totalHeight = +svg.attr("height");

  // Define margins here since this function owns the inner drawing area
  // (extra top for the question title, extra right for the legend)
  const margin = {top: 40, right: 160, bottom: 30, left: 110};
  const width = totalWidth - margin.left - margin.right;
  const height = totalHeight - margin.top - margin.bottom;

  // Only label a stacked segment with its percent if it's wide enough to read
  const labelThreshold = 24;

  // Append a <g> for the actual chart content, offset by margins
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  Promise.all([d3.csv(data), d3.csv(codebook)]).then(function([data, codebookData]) {

    // Filter to the variable of interest, and to the party tab we're on
    const dat_filt = data.filter(d => d.variable == variable);

    // Response categories used by at least one party for this variable (the aggregate
    // pct_NA bucket isn't a real response option, so it's never shown as its own bar)
    const pctKeys = Object.keys(dat_filt[0]).filter(key => key.startsWith("pct_") && key !== "pct_NA");
    const subgroups = pctKeys.filter(key => dat_filt.some(row => row[key] !== "NA"));

    // A party with nobody in a given category has that pct recorded as "NA" - that's a
    // true zero, not missing data, so it shouldn't cause the whole column to be dropped
    const filteredData = dat_filt.map(row => {
      const newRow = { party: row.party };
      subgroups.forEach(key => {
        newRow[key] = row[key] === "NA" ? 0 : +row[key];
      });
      return newRow;
    });

    // Groups = parties, shown on the Y axis - ordered to match the subnav tabs left to right
    const presentParties = new Set(filteredData.map(d => d.party));
    const groups = PARTY_ORDER.filter(p => presentParties.has(p));

    // Codebook rows for this variable - gives us the question text and
    // the human-readable label for each response value
    const codebookRows = codebookData.filter(d => d.variable === variable);
    const question = codebookRows.length ? codebookRows[0].question : variable;
    const labelFor = key => {
      const value = key.replace("pct_", "");
      const match = codebookRows.find(d => d.value === value);
      return match ? match.value_label : value;
    };

    // Title - the survey question, above the chart
    svg.append("text")
      .attr("x", totalWidth / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(question);

    // Y axis - categorical (party), so use scaleBand
    const y = d3.scaleBand()
        .domain(groups)
        .range([0, height])
        .padding(0.2);

    g.append("g")
      .call(d3.axisLeft(y));

    // X axis - percentage from 0 to 100%, placed at the bottom
    const x = d3.scaleLinear()
        .domain([0, 1])
        .range([0, width]);

    g.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(d3.format(".0%")));

    // Color scale - one color per subgroup. An explicit `colors` argument wins; otherwise
    // political variables get a blue-red spectrum and everything else falls back to Okabe-Ito.
    let color;
    if (typeof colors === "function") {
      color = colors;
    } else if (Array.isArray(colors)) {
      color = d3.scaleOrdinal().domain(subgroups).range(colors);
    } else if (POLITICAL_VARIABLES.includes(variable)) {
      color = politicalColorScale(subgroups);
    } else {
      color = d3.scaleOrdinal().domain(subgroups).range(OKABE_ITO);
    }

    // Stack the cleaned, numeric data
    const stackedData = d3.stack()
        .keys(subgroups)
        (filteredData);

    // Draw the bars
    const barGroups = g.append("g")
      .selectAll("g")
      .data(stackedData)
      .join("g")
        .attr("fill", d => color(d.key));

    barGroups.selectAll("rect")
        .data(d => d)
        .join("rect")
          .attr("x", d => x(d[0]))
          .attr("y", d => y(d.data.party))
          .attr("width", d => x(d[1]) - x(d[0]))
          .attr("height", y.bandwidth());

    // Percent labels - only on segments wide enough to hold text
    barGroups.selectAll("text")
        .data(d => d.filter(seg => x(seg[1]) - x(seg[0]) >= labelThreshold))
        .join("text")
          .attr("x", d => x(d[0]) + (x(d[1]) - x(d[0])) / 2)
          .attr("y", d => y(d.data.party) + y.bandwidth() / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("fill", "#fff")
          .text(d => d3.format(".0%")(d[1] - d[0]));

    // Legend - one swatch + label per response category
    const legend = g.append("g")
      .attr("transform", `translate(${width + 20}, 0)`);

    const legendItems = legend.selectAll("g")
      .data(subgroups)
      .join("g")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    legendItems.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", d => color(d));

    legendItems.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .style("font-size", "11px")
        .text(d => labelFor(d));
  });
};

const partyplot = function(data, svg, party, codebook = "data/codebook.csv"){

  const variable = "pid7";

  const totalWidth = +svg.attr("width");
  const totalHeight = +svg.attr("height");

  // Extra top for the question title, extra right for the dem/rep summary + legend
  const margin = {top: 40, right: 220, bottom: 10, left: 40};
  const width = totalWidth - margin.left - margin.right;
  const height = totalHeight - margin.top - margin.bottom;

  // Only label a stacked segment with its percent if it's tall enough to read
  const labelThreshold = 14;

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  Promise.all([d3.csv(data), d3.csv(codebook)]).then(function([longData, codebookData]) {

    // Keep only the 7 substantive categories (drop 8 = not sure, 9 = don't know),
    // and only the party tab we're on
    const dat_filt = longData.filter(d => d.variable === variable && d.party === party && +d.value >= 1 && +d.value <= 7);

    // Aggregate weighted respondent counts for this party, by response value
    const totalsByValue = d3.rollup(
      dat_filt,
      v => d3.sum(v, d => +d.people),
      d => +d.value
    );

    const grandTotal = d3.sum(totalsByValue.values());
    const values = [...totalsByValue.keys()].sort(d3.ascending);

    // A single row holding the share for each response value, for the stack layout
    const stackRow = {};
    values.forEach(v => stackRow[`${variable}_${v}`] = totalsByValue.get(v) / grandTotal);
    const subgroups = values.map(v => `${variable}_${v}`);

    const codebookRows = codebookData.filter(d => d.variable === variable);
    const question = codebookRows.length ? codebookRows[0].question : variable;
    const labelFor = v => {
      const match = codebookRows.find(d => +d.value === v);
      return match ? match.value_label : v;
    };

    // Title - the survey question, above the chart
    svg.append("text")
      .attr("x", totalWidth / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text(question);

    // Y axis - percent of respondents, 0 to 100%
    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);

    g.append("g")
      .call(d3.axisLeft(y).tickFormat(d3.format(".0%")));

    // X axis - a single band, since this is one stacked bar (no label needed)
    const x = d3.scaleBand()
        .domain(["All Respondents"])
        .range([0, width])
        .padding(0.4);

    // Blue (Strong Democrat) -> red (Strong Republican) diverging color scale,
    // with Independent pulled out to a neutral dark grey instead of the scale's white midpoint
    const diverging = d3.scaleSequential(t => d3.interpolateRdBu(1 - t))
        .domain([1, 7]);
    const color = v => v === 4 ? "#555555" : diverging(v);

    const stackedData = d3.stack()
        .keys(subgroups)
        ([stackRow]);

    // Draw the single stacked bar
    const barGroups = g.append("g")
      .selectAll("g")
      .data(stackedData)
      .join("g")
        .attr("fill", (d, i) => color(values[i]));

    barGroups.selectAll("rect")
        .data(d => d)
        .join("rect")
          .attr("x", x("All Respondents"))
          .attr("y", d => y(d[1]))
          .attr("width", x.bandwidth())
          .attr("height", d => y(d[0]) - y(d[1]));

    // Percent labels - only on segments tall enough to hold text
    barGroups.selectAll("text")
        .data(d => d.filter(seg => y(seg[0]) - y(seg[1]) >= labelThreshold))
        .join("text")
          .attr("x", x("All Respondents") + x.bandwidth() / 2)
          .attr("y", d => (y(d[0]) + y(d[1])) / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("fill", "#fff")
          .text(d => d3.format(".0%")(d[1] - d[0]));

    // Dem (values 1-3) and Rep (values 5-7) summary, shown between the bar and the legend
    const demShare = d3.sum([1, 2, 3], v => stackRow[`${variable}_${v}`] || 0);
    const repShare = d3.sum([5, 6, 7], v => stackRow[`${variable}_${v}`] || 0);

    const summary = g.append("g")
      .attr("transform", `translate(${width - 40}, 0)`);

    summary.append("rect")
        .attr("x", 0)
        .attr("y", y(demShare))
        .attr("width", 8)
        .attr("height", y(0) - y(demShare))
        .attr("fill", color(1));

    summary.append("text")
        .attr("x", 14)
        .attr("y", (y(0) + y(demShare)) / 2)
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(`${d3.format(".0%")(demShare)} Dem`);

    summary.append("rect")
        .attr("x", 0)
        .attr("y", y(1))
        .attr("width", 8)
        .attr("height", y(1 - repShare) - y(1))
        .attr("fill", color(7));

    summary.append("text")
        .attr("x", 14)
        .attr("y", (y(1) + y(1 - repShare)) / 2)
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text(`${d3.format(".0%")(repShare)} Rep`);

    // Legend
    const legend = g.append("g")
      .attr("transform", `translate(${width + 40}, 0)`);

    const legendItems = legend.selectAll("g")
      .data(values)
      .join("g")
        .attr("transform", (v, i) => `translate(0, ${i * 20})`);

    legendItems.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", v => color(v));

    legendItems.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .style("font-size", "11px")
        .text(v => labelFor(v));
  });
};

// KPI grid: one tile per topic, showing this party's headline percentage on that
// question and its rank among all 9 parties. `container` is a CSS selector string
// for the element the tiles get appended into (e.g. "#progressive-left-kpi").
const kpiGrid = function(data, container, party){
  d3.csv(data).then(function(rows){
    const partyRows = rows.filter(d => d.party === party);

    const tiles = d3.select(container)
      .selectAll(".kpi-tile")
      .data(partyRows)
      .join("div")
        .attr("class", "kpi-tile");

    tiles.append("div")
        .attr("class", "kpi-topic")
        .text(d => d.topic);

    tiles.append("div")
        .attr("class", "kpi-question")
        .text(d => d["question.y"]);

    const valueRows = tiles.append("div")
        .attr("class", "kpi-value-row");

    valueRows.append("span")
        .attr("class", "kpi-value")
        .text(d => d3.format(".0%")(+d.pct));

    valueRows.append("span")
        .attr("class", "kpi-value-label")
        .text(d => d.value_label);

    tiles.append("div")
        .attr("class", "kpi-rank")
        .text(d => `Rank #${d.rank} of 9`);
  });
};

//------------------------------------------per-party carousels

// All slides share one canvas size so the caption/dots don't jump around when flipping between them.
// The width/height attributes just define the internal drawing coordinate system (and its aspect
// ratio) that horzbar/partyplot use for their margin math - the actual on-screen size is controlled
// entirely by the viewport-relative CSS below, so the chart scales with the window instead of being
// pinned to a pixel size.
const makeChartSvg = function(containerId, width = 640, height = 400){
  return d3.select(containerId)
    .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "44vw")
      .style("height", "63vh");
};

// Each party tab's carousel is chart-0 (partyplot, this party's own pid7 breakdown)
// followed by chart-1/2/3 (horzbar, comparing this party to all others on each variable)
const PARTY_TAB_VARIABLES = {
  "progressive-left":          { party: "Progressive Left",          variables: ["CC24_330a", "pew_churatd", "CC24_440b"] },
  "religious-moderates":       { party: "Religious Moderates",       variables: ["pew_churatd", "CC24_421_1", "CC24_423"] },
  "moderate-left":             { party: "Moderate Left",             variables: ["CC24_330a", "CC24_441b", "newsint"] },
  "disillusioned-left":        { party: "Disillusioned Left",        variables: ["CC24_423", "CC24_330a", "CC24_421_1"] },
  "secular-moderates":         { party: "Secular Moderates",         variables: ["CC24_330a", "pew_churatd", "CC24_421_1"] },
  "maga-right":                { party: "MAGA Right",                variables: ["CC24_423", "CC24_421_1", "CC24_330a"] },
  "traditional-right":         { party: "Traditional Right",         variables: ["CC24_423", "CC24_330a", "pew_churatd"] },
  "faith-based-conservatives": { party: "Faith-Based Conservatives", variables: ["pew_churatd", "pew_bornagain", "pew_religimp"] },
  "nationalist-right":         { party: "Nationalist Right",         variables: ["CC24_330a", "CC24_440a", "pew_churatd"] }
};

Object.entries(PARTY_TAB_VARIABLES).forEach(([panelId, { party, variables }]) => {
  partyplot("data/long_clustered.csv", makeChartSvg(`#${panelId}-chart-0`), party);
  variables.forEach((variable, i) => {
    horzbar(variable, "data/clustered_parties_qs.csv", makeChartSvg(`#${panelId}-chart-${i + 1}`));
  });
});

//------------------------------------------per-party KPI grids

Object.entries(PARTY_TAB_VARIABLES).forEach(([panelId, { party }]) => {
  kpiGrid("data/kpi_style_data.csv", `#${panelId}-kpi`, party);
});