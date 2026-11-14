const fs = require('fs');

const content = fs.readFileSync('dist/_astro/hoisted.CUO_IjfL.js', 'utf8');

function findOccurrences(str) {
  let idx = 0;
  const results = [];
  while ((idx = content.indexOf(str, idx)) !== -1) {
    results.push(idx);
    idx += str.length;
  }
  return results;
}

console.log('Occurrences of frag$m:', findOccurrences('frag$m'));
console.log('Occurrences of vert$j:', findOccurrences('vert$j'));

for (const idx of findOccurrences('vert$j')) {
  console.log(`\n--- vert$j at ${idx} ---`);
  console.log(content.slice(Math.max(0, idx - 100), Math.min(content.length, idx + 200)));
}

for (const idx of findOccurrences('frag$m')) {
  console.log(`\n--- frag$m at ${idx} ---`);
  console.log(content.slice(Math.max(0, idx - 100), Math.min(content.length, idx + 200)));
}
