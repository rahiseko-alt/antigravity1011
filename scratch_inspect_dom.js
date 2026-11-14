const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

let pos = 0;
while ((pos = html.indexOf('home-featured-cta', pos)) !== -1) {
  console.log('Pos:', pos);
  console.log(html.slice(Math.max(0, pos - 150), pos + 300));
  console.log('-------------------------');
  pos += 17;
}

pos = 0;
while ((pos = html.indexOf('home-members', pos)) !== -1) {
  console.log('Members pos:', pos);
  console.log(html.slice(Math.max(0, pos - 150), pos + 300));
  console.log('-------------------------');
  pos += 12;
}
