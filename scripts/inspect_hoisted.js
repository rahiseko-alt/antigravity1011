const fs = require('fs');
const code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

let lIdx = code.indexOf('class Line{');
let uIdx = code.indexOf('update(', lIdx);
console.log('--- Line.update at', uIdx, '---');
console.log(code.substring(uIdx, uIdx + 2000));
