const fs = require('fs');
const h1 = fs.readFileSync('index.html', 'utf8');
const h2 = fs.readFileSync('dist/index.html', 'utf8');
console.log('index.html contains $2:', h1.includes('$2'));
console.log('dist/index.html contains $2:', h2.includes('$2'));
if (h1.includes('$2')) {
  const p = h1.indexOf('$2');
  console.log('h1 snippet:', h1.slice(p - 40, p + 60));
}
if (h2.includes('$2')) {
  const p = h2.indexOf('$2');
  console.log('h2 snippet:', h2.slice(p - 40, p + 60));
}
