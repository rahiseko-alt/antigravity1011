const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const startIdx = html.indexOf('id="home-featured"');
const cardIdx = html.indexOf('data-id="atlas_motion"');
console.log('--- CARD SNIPPET ---');
console.log(html.substring(cardIdx - 120, cardIdx + 600));
