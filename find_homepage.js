const fs = require('fs');
const content = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const kw = 'homePage';
let idx = 0;
let count = 0;
console.log(`Matches for: ${kw}`);
while ((idx = content.indexOf(kw, idx)) !== -1) {
  count++;
  const start = Math.max(0, idx - 100);
  const end = Math.min(content.length, idx + 150);
  console.log(`--- Match ${count} at ${idx} ---`);
  console.log(content.slice(start, end));
  idx += kw.length;
}
