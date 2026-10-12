const fs = require('fs');
const js = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const startIdx = js.indexOf('class HomeReelSection');
const nextClass = js.indexOf('class HomeFeaturedSection', startIdx);
console.log('HomeReelSection length:', nextClass - startIdx);
fs.writeFileSync('home_reel_section_dump.txt', js.slice(startIdx, nextClass));
console.log('Saved home_reel_section_dump.txt');
