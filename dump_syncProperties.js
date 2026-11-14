const fs = require('fs');
const content = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const start = 2090000;
const end = 2097500;
fs.writeFileSync('dump_syncProperties.txt', content.slice(start, end));
console.log('Dumped', end - start, 'bytes to dump_syncProperties.txt');
