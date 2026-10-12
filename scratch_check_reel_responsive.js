const fs = require('fs');
const css = fs.readFileSync('_astro/about.CNa9RfUh.css', 'utf8');

let idx = 0;
while ((idx = css.indexOf('#home-reel', idx)) !== -1) {
  const chunk = css.slice(idx, idx + 300);
  if (chunk.includes('812px') || chunk.includes('display') || chunk.includes('none')) {
    console.log(chunk);
  }
  idx += '#home-reel'.length;
}
