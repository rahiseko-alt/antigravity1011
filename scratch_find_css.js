const fs = require('fs');
const css = fs.readFileSync('_astro/about.CNa9RfUh.css', 'utf8');

let idx = css.indexOf('#home-reel-container');
while (idx !== -1) {
  console.log('CSS match at:', idx);
  console.log(css.slice(Math.max(0, idx - 40), idx + 160));
  idx = css.indexOf('#home-reel-container', idx + 1);
}
