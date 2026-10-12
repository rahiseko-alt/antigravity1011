const fs = require('fs');
const code = fs.readFileSync('home_reel_section_dump.txt', 'utf8');

const initIdx = code.indexOf('init(');
console.log(code.slice(initIdx, initIdx + 1500));
