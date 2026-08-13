## Navbar

```html
    <div class="nav-wrapper">
        <a href="parties.html" class="nav-tab active">
        <i class="ti ti-users"></i>Parties
        </a>
        <a href="geography.html" class="nav-tab">
        <i class="ti ti-map"></i>Geography
        </a>
        <a href="demographics.html" class="nav-tab" >
        <i class="ti ti-chart-bar"></i>Demographics
        </a>
    </div>
```

```css
 * {
      margin: 0;
      padding: 0;
    }
 
    body {
      font-family: sans-serif;
      background: #f5f5f5;
    }
 
    .nav-wrapper {
      width: 100%;
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
    }
 
    .nav-tab {
        text-decoration: none;
        color: #888; /* or your existing color variable */
    }

    .nav-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px 8px;
      font-size: 15px;
      font-weight: 400;
      color: #888;
      cursor: pointer;
      border: none;
      background: transparent;
      border-bottom: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s, background 0.15s;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
 
    .nav-tab:hover {
      color: #111;
      background: #f0f0f0;
    }
 
    .nav-tab.active {
      color: #111;
      font-weight: 500;
      border-bottom: 2px solid #111;
    }
 
    .nav-tab i {
      font-size: 16px;
      margin-right: 6px;
      vertical-align: -2px;
    }
 
    .page-content {
      padding: 2rem 1.5rem;
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafafa;
    }
 
    .page-label {
      text-align: center;
      color: #666;
      font-size: 14px;
    }
 
    .page-label strong {
      display: block;
      font-size: 18px;
      font-weight: 500;
      color: #111;
      margin-bottom: 6px;
    }
```

### Explanation

#### HTML

- The <div> tag creates a container, with the class assignment "nav-wrapper". 
    - Everything inside the div tag is inside the container it creates
- The <a> tag creates a link. You need the href attribute, which is where the link will take you.
- The <i> tag is an icon
    - Be sure to include this code in the head part of the html:
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css">

#### CSS

- * (access every element)
    - setting the margin and padding to 0 because the browser has default padding and margins, and we want the navbar to extend across the whole page.
- body
    - `font:family` changes the font
        - this is going to change the font for everything within the body tag (the whole page) so this might not be the best choice as far as organization goes
    - `background` changes the background color
- nav-wrapper
    - this is the class of the <div>
    - `width`:100%; makes the div extend the width of the page
    - `background`: #fff; creates the background color of the div
    - `border-bottom`: 1px solid #e0e0e0; this makes the bottom of the div container 1px solid grey.
    - `display`:flex; arranges things in horizontal order
    - `position`:sticky: Keeps the navbar positioned where it is, regardless of scrolling
    - `top`:0: Positioned at the very top of the page
    - `z-index`:100: The higher a z index value, the higher it will appear in the hierarchy. This ensures that the navbar gets places above anything below it.
- nav-tab
    - this is the class of the <a> tags (aka our tabs)
    - `text-decoration`: none; by default, <a> tags have an underline. By setting `text-decoration` to none, it tells the browser not to do that
    - `color`: #888; Color of the text
    - `flex`: 1; This ensures that each tab gets an equal share of the navbar width
    - `display`: flex; `justify-content`: center; These three combine to ensure the horizontal and vertical centering of the text and icons within each tab. I am not totally sure how each works individually, but worth it to keep both in.
    - `padding`: 14px; 14px top and bottom padding. This is effectively what is creating the height of the tabs.
    - `font-size`: 15px; size of the font!
    - `font-weight`: 800; how bold something is. In this case, pretty bold!
- nav-tab:hover
    - The syntax here is: class nav-tab, and :hover is not a class but a native way to control the styling for when the user hovers over something, in this case the tab.
    - `color`: #111; Changing the text to black
    - `background`: #f0f0f0; Changing the background of the tab to grey
- nav-tab.active
    - The syntax here is: styling for nav-tab class, and within that, styling for the active class
    - `color`: #111; black text
    - `font-weight`: 800; bold!
    - `border-bottom`: 2px solid #111; Solid black line below the tab. This is the big visual cue that this is a navbar!
- nav-tab i
    - `font-size`: 16px; font size of the <i> tags in the class <nav-tab>
    - `margin-right`: 6px; this is changing how far away the icons appear from the start of the text
    - `vertical-align`: -2px; Shifting the icon down to be in line with the text. Apparently icons often sit 1-2px higher initially.


## Party page

### Global Setup

- Colorblind friendly palette
  - OKABE_ITO (8 hex colors): ['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#000000']
- Fixed Array: Use square brackets []
- Color scales
  - d3.scaleSequential()
    - For continuous values
  - d3.scaleOrdinal()
    - For discrete values

### Horziontal bar chart

- Getting the value of an attribute
  - object.attr("attribute name")
  - example: svg.attr("width")
- Setting margin
  - const margin = {top: 40, right: 160, bottom: 30, left: 110};
  - To get the top margin value, use margin.top
- Standard D3 plot convention
  - Have an SVG
  - Define margins
  - create a new <g> element that gets translated by the margin
    - example: const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
- How do you set the value of an attribute?
  - .attr("width", value)
- Loading data
  - Simple
    - d3.csv("file-path").then(function(data) {do stuff...} )
  - Complex (if have multiple datasets you are using)
    - Promise.all([d3.csv(file-path), d3.csv(file-path)]).then(function([data, codebookData]) {do stuff...} )
    - `data` and `codebookData` are just variable names, could be called anything
- Filter data
  - const filtereddata = data.filter(d => d.variable_name == "thing you want to filter to")
- Axis scales
  - For categorical (like bar chart)
    - use d3.scaleBand().domain(`categories`).range([bottom_height, top_height]).padding(0.2)
  - For continuous axis
    - use d3.scaleLinear().domain([bottom_range, top_range]).range([bottom_height, top_height])
  - Put them on the page
    - Append a new <g> to exisitng <g>
      - g.append("g").call(d3.axisLeft(y_axis_var_name))
      - For x axis, d3.axisBottom defaults to drawing a horizontal line at y=0 (the top of the chart)
        - Sinc we want the bottom of the chart, translate it
      - g.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(d3.format(".0%")));
- For stacked bar chart, use d3.stack().keys(categories)(data);

## Basics

- JS Array
  - var numbers = [1,2,3]
  - numbers[2] = 3
- JS Object
  - var car = {make: "Ford", model: "Mustang"}
  - car.make = "Ford"



