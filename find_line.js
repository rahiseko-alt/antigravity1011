const fs = require('fs');
const content = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');
const p = content.indexOf('vert');
console.log('vert offset:', p);
if (p !== -1) {
  console.log(content.slice(Math.max(0, p - 50), Math.min(content.length, p + 200)));
}
const pFrag = content.indexOf('frag');
console.log('frag offset:', pFrag);
if (pFrag !== -1) {
  console.log(content.slice(Math.max(0, pFrag - 50), Math.min(content.length, pFrag + 200)));
}
