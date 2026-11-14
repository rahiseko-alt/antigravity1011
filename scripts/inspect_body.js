const fs = require('fs');

const html = fs.readFileSync('dist/index.html', 'utf8');

// Find major wrapper divs in body
const bodyIdx = html.indexOf('<body');
console.log('Body children:', html.slice(bodyIdx, bodyIdx + 1500));
