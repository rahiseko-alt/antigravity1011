const fs = require('fs');

const html = fs.readFileSync('dist/index.html', 'utf8');
console.log('HTML files in dist:', fs.readdirSync('dist').filter(f => f.endsWith('.html')));

// Find sections and headings in index.html
const sectionRegex = /<section[^>]*class="([^"]*)"[^>]*>/g;
let m;
while ((m = sectionRegex.exec(html)) !== null) {
  console.log('Section class:', m[1]);
}

// Find Japanese text around Reel and Hero
const reelIdx = html.indexOf('場をつくる');
if (reelIdx !== -1) {
  console.log('Reel text context:\n', html.slice(reelIdx - 100, reelIdx + 800));
} else {
  console.log('場をつくる not found directly in HTML');
}
