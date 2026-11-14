const fs = require('fs');
const code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const searchTerms = ['vert$j', 'LINES_DATA_LIST', 'cpx', 'u_aspect', 'u_margin', 'aoThreshold', 'line_reel'];
for (const term of searchTerms) {
  const idx = code.indexOf(term);
  console.log(`${term}: index = ${idx}`);
  if (idx !== -1) {
    console.log(`--- [${term}] snippet ---`);
    console.log(code.slice(Math.max(0, idx - 100), Math.min(code.length, idx + 400)));
    console.log('---------------------------');
  }
}
