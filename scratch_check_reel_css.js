const fs = require('fs');
const css = fs.readFileSync('_astro/about.CNa9RfUh.css', 'utf8');

const selectors = ['#home-reel', '#home-reel-container', '#home-reel-video', '#home-reel-thumb'];
selectors.forEach(s => {
  let idx = 0;
  while ((idx = css.indexOf(s, idx)) !== -1) {
    console.log(css.slice(idx, idx + 200));
    idx += s.length;
  }
});
