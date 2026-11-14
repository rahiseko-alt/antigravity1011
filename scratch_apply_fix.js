const fs = require('fs');
const path = require('path');

// 1. Fix _astro/hoisted.CUO_IjfL.js
const jsPath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(jsPath, 'utf8');

// Replace innerContainer positions and circle position in Line.update
// Old:
// this.innerContainer.position.x=this.lineId===0?(properties.viewportWidth*0.5):(this.lineData.margin.x*c);this.innerContainer.position.y=this.lineId===0?s:(this.lineData.margin.y*u-l);this.innerContainer.scale.x=c;this.innerContainer.scale.y=u;
const oldPos = 'this.innerContainer.position.x=this.lineId===0?(properties.viewportWidth*0.5):(this.lineData.margin.x*c);this.innerContainer.position.y=this.lineId===0?s:(this.lineData.margin.y*u-l);this.innerContainer.scale.x=c;this.innerContainer.scale.y=u;';
const newPos = 'this.innerContainer.position.x=this.lineData.margin.x*c;this.innerContainer.position.y=this.lineData.margin.y*u-l;this.innerContainer.scale.x=c;this.innerContainer.scale.y=u;';

if (code.includes(oldPos)) {
  code = code.replace(oldPos, newPos);
  console.log('1. Replaced innerContainer position with natural normalized world coordinates!');
} else {
  console.log('oldPos not found directly, checking variations...');
}

// Replace aspectX, aspectY and circle position setting
// Old:
// const aspectX=properties.viewportWidth>=1400?1.45:(properties.viewportWidth<=540?1.0:1.0+0.45*(properties.viewportWidth-540)/(1400-540));const aspectY=properties.viewportWidth>=1400?0.44:(properties.viewportWidth<=540?1.0:1.0-0.56*(properties.viewportWidth-540)/(1400-540));this.circle.position.set(_v0$2.x*aspectX,_v0$2.y*aspectY,_v0$2.z);this.circle.scale.set(n,n,1);
const circlePattern = /const aspectX=properties\.viewportWidth>=1400\?1\.45[\s\S]*?this\.circle\.position\.set\(_v0\$2\.x\*aspectX,_v0\$2\.y\*aspectY,_v0\$2\.z\);this\.circle\.scale\.set\(n,n,1\);/;
if (circlePattern.test(code)) {
  code = code.replace(circlePattern, 'this.circle.position.copy(_v0$2);this.circle.scale.set(n,n,1);');
  console.log('2. Removed artificial aspectX/aspectY distortion on circle tip!');
} else {
  console.log('circlePattern not found directly, checking...');
}

fs.writeFileSync(jsPath, code, 'utf8');
console.log('Updated _astro/hoisted.CUO_IjfL.js');

// 2. Fix index.html header styling & margin
const htmlPath = path.resolve('index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Add header backdrop protection CSS
const headerStyleTag = `<style id="header-protection-styles">
  #header {
    background: linear-gradient(180deg, rgba(4, 5, 8, 0.92) 0%, rgba(4, 5, 8, 0.65) 60%, rgba(4, 5, 8, 0) 100%) !important;
    backdrop-filter: blur(14px) !important;
    -webkit-backdrop-filter: blur(14px) !important;
    padding-bottom: 24px !important;
    pointer-events: none !important;
  }
  #header-container {
    pointer-events: auto !important;
  }
  /* Remove abnormal 5em margin-top on 2nd project item that cuts text */
  .project-item:nth-child(2) {
    margin-top: 0 !important;
  }
</style>`;

if (!html.includes('id="header-protection-styles"')) {
  html = html.replace('</head>', `${headerStyleTag}\n</head>`);
  console.log('3. Added header protection styles and normalized card spacing in index.html');
} else {
  html = html.replace(/<style id="header-protection-styles">[\s\S]*?<\/style>/, headerStyleTag);
  console.log('3. Updated header protection styles');
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Updated index.html');
