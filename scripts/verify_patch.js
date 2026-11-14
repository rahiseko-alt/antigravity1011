const fs = require('fs');

const content = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const reelIdx = content.indexOf('fileName:"line_reel"');
console.log('line_reel config:');
console.log(content.slice(reelIdx, reelIdx + 250));

const aIdx = content.indexOf('this.lineId===0?math.saturate((scrollManager.scrollPixel');
console.log('\naIdx found:', aIdx !== -1);
if (aIdx !== -1) {
  console.log(content.slice(aIdx - 30, aIdx + 260));
}

const vertIdx = content.indexOf('vert$j=`#define GLSLIFY 1');
console.log('\nvert$j found:', vertIdx !== -1);

const fragIdx = content.indexOf('frag$m=`#define GLSLIFY 1');
console.log('frag$m found:', fragIdx !== -1);

console.log('\nAll checks passed!');
