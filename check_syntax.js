const fs = require('fs');
const content = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');
const lines = content.split('\n');

console.log('Line 3737:', lines[3736].slice(0, 100));
console.log('Line 3738:', lines[3737].slice(0, 100));
console.log('Line 3739:', lines[3738].slice(0, 100));
console.log('Line 3740:', lines[3739].slice(0, 100));

for (let i = 3736; i <= 3740; i++) {
  const line = lines[i];
  if (!line) continue;
  const backticks = (line.match(/`/g) || []).length;
  console.log(`Line ${i+1}: length=${line.length}, backticks=${backticks}`);
}

// Let us check line 3740 around col 4482
const l3740 = lines[3739];
console.log('Around 4482 in line 3740:');
console.log(l3740.slice(4450, 4520));
