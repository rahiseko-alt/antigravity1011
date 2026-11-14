const fs = require('fs');
const path = '_astro/hoisted.CUO_IjfL.js';
let code = fs.readFileSync(path, 'utf8');

const target = 'window.addEventListener("wheel",()=>{if(goalTunnels.introElapsed>1.2)skipIntro()},{passive:!0});window.addEventListener("touchstart",()=>{if(goalTunnels.introElapsed>1.2)skipIntro()},{passive:!0});window.addEventListener("keydown",()=>skipIntro(),{passive:!0});window.addEventListener("click",()=>{if(goalTunnels.introElapsed>1.2)skipIntro()},{passive:!0});';

const replacement = 'window.addEventListener("keydown",e=>{if(e.key==="Escape")skipIntro()},{passive:!0});window.__skipIntro=skipIntro;';

if (!code.includes(target)) {
  console.error('Target not found!');
  process.exit(1);
}

code = code.replace(target, replacement);
fs.writeFileSync(path, code, 'utf8');
console.log('Successfully patched _astro/hoisted.CUO_IjfL.js!');
