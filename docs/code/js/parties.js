
//-----------------------------------------sub-navbar functionality

window.switchParty = function(event, id) {
    // hide all panels
    document.querySelectorAll('.party-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // remove active from all subnav tabs
    document.querySelectorAll('.subnav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // show the selected panel
    document.getElementById(id).classList.add('active');

    // mark the clicked tab as active
    event.target.classList.add('active');

    // reflect selection in the URL
    history.replaceState(null, '', `#${id}`);
}

// on page load, activate whichever party the URL hash specifies
window.addEventListener('DOMContentLoaded', () => {
    const id = location.hash.slice(1); // strip leading '#'
    if (id) {
        const tab = document.querySelector(`.tab-${id}`);
        if (tab) {
            switchParty({ target: tab }, id);
        }
    }
});

//-----------------------------------------chart carousel functionality

window.switchSlide = function(event, panelId, index) {
  const panel = document.getElementById(panelId);

  panel.querySelectorAll('.chart-slide').forEach((slide, i) => {
    slide.classList.toggle('active', i === index);
  });

  panel.querySelectorAll('.caption-slide').forEach((caption, i) => {
    caption.classList.toggle('active', i === index);
  });

  panel.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

//------------------------------------------import statements

const container = document.getElementById("tree_map");
// const margin = {top: 10, right: 10, bottom: 10, left: 10},
//   width = container.clientWidth - margin.left - margin.right,
//   height = container.clientHeight - margin.top - margin.bottom;
const width = container.clientWidth;
const height = container.clientHeight;
console.log(width)
console.log(height)

const svg = d3.select("#tree_map")
    .append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("display", "block")
        // .style("margin", "0 auto")
    .append("g")
        // .attr("transform", `translate(${margin.left}, ${margin.top})`);


d3.csv("../../data/treemap_data_manual.csv").then(function(data){

    // stratify the data: reformatting for d3.js
    console.log("read in the data!")
    const root = d3.stratify()
        .id(function(d) { return d.party; })   // Name of the entity (column name is name in csv)
        .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
        (data);
    root.sum(function(d) { return +d.percentage })
        .sort((a, b) => +a.data.order - +b.data.order) 

    console.log("made treemap!")

    d3.treemap()
        .size([width, height])
        .padding(4)
        (root)
    
    svg.selectAll("rect")
    .data(root.leaves())
    .join("rect")
      .attr('x', function (d) { return d.x0; })
      .attr('y', function (d) { return d.y0; })
      .attr('width', function (d) { return d.x1 - d.x0; })
      .attr('height', function (d) { return d.y1 - d.y0; })
      .style("stroke", "black")
      .style("fill", function(d) { return d.data.color; })

    svg.selectAll("foreignObject")
    .data(root.leaves())
    .join("foreignObject")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .append("xhtml:div")
        .style("width", "100%")
        .style("height", "100%")
        .style("display", "flex")
        .style("flex-direction", "column")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("text-align", "center")
        .style("padding", "4px")
        .style("box-sizing", "border-box")
        .style("color", "white")
        .style("font-size", "1vw")
        .style("overflow", "hidden")
        .html(d => `
        <div style="font-weight: bold; line-height: 1.2">${d.data.party}</div>
        <div style="font-size: .7vw; margin-top: 3px">${(d.data.percentage * 100).toFixed(1)}%</div>
    `);
})