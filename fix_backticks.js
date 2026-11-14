const fs = require('fs');
const lines = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8').split('\n');
const l3740 = lines[3739];
let p = 0;
while ((p = l3740.indexOf('`', p)) !== -1) {
  console.log('backtick at:', p, JSON.stringify(l3740.slice(Math.max(0, p - 30), Math.min(l3740.length, p + 30))));
  p++;
}
