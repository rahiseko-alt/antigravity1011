const fs = require('fs');

let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

// 1. In intro initialization, set is-black-bg on html and black background on body
const targetInit = 'document.body.style.overflow="hidden";const o=document.getElementById("page-container");o&&(o.style.opacity="0");const t=document.getElementById("header");t&&(t.style.opacity="0");';
const replInit = 'document.body.style.overflow="hidden";document.documentElement.classList.add("is-black-bg");document.body.style.backgroundColor="#000000";const o=document.getElementById("page-container");o&&(o.style.opacity="0");const t=document.getElementById("header");t&&(t.style.opacity="0",t.style.pointerEvents="none");';

if (code.includes(targetInit)) {
  code = code.replace(targetInit, replInit);
  console.log('Successfully patched intro initialization with is-black-bg and body background');
} else {
  console.log('targetInit not found or already replaced');
}

// 2. While r < 2.4, keep header and page-container hidden
const targetR24 = 'if(r<2.4){this.currentStage3D=goalTunnels,goalTunnels.isActive=!0,homeBalloons.isActive=!1;';
const replR24 = 'if(r<2.4){this.currentStage3D=goalTunnels,goalTunnels.isActive=!0,homeBalloons.isActive=!1;const _h=document.getElementById("header");_h&&(_h.style.opacity="0");const _p=document.getElementById("page-container");_p&&(_p.style.opacity="0");';

if (code.includes(targetR24)) {
  code = code.replace(targetR24, replR24);
  console.log('Successfully patched header/page-container hide during intro');
} else {
  console.log('targetR24 not found or already replaced');
}

fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
if (fs.existsSync('dist/_astro/hoisted.CUO_IjfL.js')) {
  fs.writeFileSync('dist/_astro/hoisted.CUO_IjfL.js', code, 'utf8');
}
console.log('Finished updating hoisted.CUO_IjfL.js!');
