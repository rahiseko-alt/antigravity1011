const fs = require('fs');

const content = fs.readFileSync('dist/_astro/hoisted.CUO_IjfL.js', 'utf8');

// Find all occurrences of GLSLIFY
let idx = 0;
while ((idx = content.indexOf('GLSLIFY', idx)) !== -1) {
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + 400);
  console.log('--- FOUND GLSLIFY at', idx, '---');
  console.log(content.slice(start, end));
  console.log('---------------------------------');
  idx += 7;
}
