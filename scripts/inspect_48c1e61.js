const fs = require('fs');
const s = fs.readFileSync('temp_48c1e61_hoisted.js', 'utf8');
const lIdx = s.indexOf('LINES_DATA_LIST');
console.log('48c1e61 LINES_DATA_LIST:', s.slice(lIdx, lIdx + 300));
const vIdx = s.indexOf('vert$j');
console.log('48c1e61 vert$j:', s.slice(vIdx, s.indexOf('`', vIdx + 15) + 1));
const fIdx = s.indexOf('frag$m');
console.log('48c1e61 frag$m:', s.slice(fIdx, s.indexOf('`', fIdx + 15) + 1));
