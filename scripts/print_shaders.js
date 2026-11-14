const fs = require('fs');

const content = fs.readFileSync('dist/_astro/hoisted.CUO_IjfL.js', 'utf8');

const vertStart = content.indexOf('vert$j=`#define GLSLIFY 1');
const vertEnd = content.indexOf('`', vertStart + 15);
console.log('=== VERT$J ===');
console.log(content.slice(vertStart, vertEnd + 1));

const fragStart = content.indexOf('frag$m=`#define GLSLIFY 1');
const fragEnd = content.indexOf('`', fragStart + 15);
console.log('\n=== FRAG$M ===');
console.log(content.slice(fragStart, fragEnd + 1));
