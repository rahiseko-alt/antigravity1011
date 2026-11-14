const fs = require('fs');

const html = fs.readFileSync('dist/index.html', 'utf8');
const links = [];
const regex = /href="([^"]*)"/g;
let m;
while ((m = regex.exec(html)) !== null) {
  links.push(m[1]);
}
console.log('Links:', [...new Set(links)]);

// Check if there is an About page or players page in src or dist
const srcDir = fs.existsSync('src') ? fs.readdirSync('src') : [];
console.log('src files:', srcDir);

// Check pages in src/pages
if (fs.existsSync('src/pages')) {
  console.log('src/pages:', fs.readdirSync('src/pages'));
}
