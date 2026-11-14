const fs = require('fs');

const code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

// Find where line data or points are defined
console.log('Searching for spline points or buffer loading...');

// Look for Float32Array or createBuffer or curve points
const re = /new Float32Array\(\[([\s\S]*?)\]\)/g;
let m;
let count = 0;
while ((m = re.exec(code)) !== null) {
  count++;
  if (m[1].length > 100) {
    console.log(`Float32Array #${count} length: ${m[1].length}`);
    console.log(`Sample: ${m[1].slice(0, 100)}`);
  }
}
