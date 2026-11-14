const fs = require('fs');
const content = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const sIdx = content.indexOf('syncProperties(e){if(properties.isIntroWarp){');
const endPos = content.indexOf('120);}}', sIdx);
console.log('Start pos:', sIdx);
console.log('End pos:', endPos);
console.log('Snippet before end:');
console.log(content.slice(endPos - 100, endPos + 20));
console.log('Snippet after end:');
console.log(content.slice(endPos + 7, endPos + 150));
