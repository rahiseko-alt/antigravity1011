const fs = require('fs');
const js = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

let idx = 0;
while ((idx = js.indexOf('domReelContainer', idx)) !== -1) {
  console.log(`domReelContainer at ${idx}:`);
  console.log(js.slice(Math.max(0, idx - 40), idx + 200));
  idx += 'domReelContainer'.length;
}
