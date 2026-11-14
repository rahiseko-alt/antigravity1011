const fs = require('fs');
const code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const matches = [];
let idx = 0;
while ((idx = code.indexOf('.buf', idx)) !== -1) {
  matches.push(code.substring(Math.max(0, idx - 100), Math.min(code.length, idx + 100)));
  idx += 4;
}
console.log('Found .buf count:', matches.length);
matches.forEach((m, i) => console.log(`--- ${i} ---\n${m}`));
