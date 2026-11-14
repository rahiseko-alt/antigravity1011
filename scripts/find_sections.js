const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const regex = /id="([^"]+)"[^>]*class="[^"]*section[^"]*"/g;
let m;
const ids = [];
while ((m = regex.exec(html)) !== null) {
  ids.push(m[1]);
}
console.log('Sections:', ids);
