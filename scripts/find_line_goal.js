const fs = require('fs');

const code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');
let idx = 0;
while ((idx = code.indexOf('line_goal', idx)) !== -1) {
  console.log(code.substring(Math.max(0, idx - 100), Math.min(code.length, idx + 200)));
  idx += 9;
}
