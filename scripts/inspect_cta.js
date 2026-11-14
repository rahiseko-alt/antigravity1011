const fs = require('fs');
const js = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');
const p = js.indexOf('this.domHomeReelCta=document.getElementById("home-reel-cta")');
console.log('--- FOUND BUTTON INIT ---');
console.log(js.slice(p, p + 2500));
