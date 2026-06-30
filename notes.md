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


## 