const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const start = html.indexOf('<div class="project-list">');
const end = html.indexOf('</div> <a id="home-featured-cta"');
const listHtml = html.substring(start + '<div class="project-list">'.length, end);

const cards = [...listHtml.matchAll(/<a class="project-item[^"]*"[^>]*>.*?<\/a>/g)].map(m => m[0]);
console.log('Total cards:', cards.length);

cards.forEach((card, i) => {
  console.log(`\n=== CARD ${i+1} ===`);
  console.log(card);
});
