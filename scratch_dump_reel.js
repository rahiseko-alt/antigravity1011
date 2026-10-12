const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('<div id="home-reel"');
const end = html.indexOf('<div id="home-featured"', start);
const reelHtml = html.slice(start, end);

// Format it nicely
console.log('REEL HTML:\n', reelHtml);
