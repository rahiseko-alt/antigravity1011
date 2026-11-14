const fs = require('fs');
const content = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const target1 = 'vert' + '$' + 'j';
const target2 = 'frag' + '$' + 'm';

const p1 = content.indexOf(target1);
console.log(target1, 'offset:', p1);
if (p1 !== -1) {
  console.log(content.slice(Math.max(0, p1 - 50), Math.min(content.length, p1 + 500)));
}

const p2 = content.indexOf(target2);
console.log(target2, 'offset:', p2);
if (p2 !== -1) {
  console.log(content.slice(Math.max(0, p2 - 50), Math.min(content.length, p2 + 1000)));
}
