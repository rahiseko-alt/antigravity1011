const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const startIdx = html.indexOf('<div id="home-reel"');
const endIdx = html.indexOf('<div id="home-featured"', startIdx);

console.log('--- #home-reel HTML ---');
console.log(html.slice(startIdx, endIdx));
