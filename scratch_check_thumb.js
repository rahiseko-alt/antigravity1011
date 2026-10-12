const fs = require('fs');
const code = fs.readFileSync('home_reel_section_dump.txt', 'utf8');

let idx = 0;
while ((idx = code.indexOf('domThumb', idx)) !== -1) {
  console.log('domThumb at:', idx, code.slice(Math.max(0, idx - 40), idx + 80));
  idx += 8;
}
