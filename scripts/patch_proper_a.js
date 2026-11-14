const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

// Current a calc with 0.7*:
const currentACalc = `if(this.lineId===0){const s=scrollManager.scrollPixel;if(s<=750||s<(properties.viewportWidth<768?650:800))a=0;else if(s>=5300){const t=Math.min(1.0,(s-5300)/1200);a=0.7+0.3*t*t*(3.0-2.0*t)}else if(s<1400){const d=s-750;a=0.7*d*d*(1.354669642405376e-6-9.552951257761362e-10*d)}else if(s<2500){const d=s-1400;a=0.7*(0.31+d*(5.502339632057363e-4+d*(-5.08155852858089e-7+1.8002345787526508e-10*d)))}else if(s<3800){const d=s-2500;a=0.7*(0.54+d*(8.577623900515268e-5+d*(8.592155813028578e-8-1.671212742234021e-11*d)))}else{const d=s-3800;a=0.7*(0.76+d*(2.2444180411263078e-4+d*(2.0744261183158925e-8-4.2470309283275194e-11*d)))}}`;

// Proper a calc reaching Stroke 4 (Green) and Stroke 5 (Purple) across player cards:
// Let's use the natural progression where a reaches 1.0 at 5300 (or smooth curve)
const properACalc = `if(this.lineId===0){const s=scrollManager.scrollPixel;if(s<=750||s<(properties.viewportWidth<768?650:800))a=0;else if(s>=5300)a=1;else if(s<1400){const d=s-750;a=d*d*(1.354669642405376e-6-9.552951257761362e-10*d)}else if(s<2500){const d=s-1400;a=0.31+d*(5.502339632057363e-4+d*(-5.08155852858089e-7+1.8002345787526508e-10*d))}else if(s<3800){const d=s-2500;a=0.54+d*(8.577623900515268e-5+d*(8.592155813028578e-8-1.671212742234021e-11*d))}else{const d=s-3800;a=0.76+d*(2.2444180411263078e-4+d*(2.0744261183158925e-8-4.2470309283275194e-11*d))}}`;

if (!code.includes(currentACalc)) {
  console.error('currentACalc not found!');
  process.exit(1);
}

code = code.replace(currentACalc, properACalc);
esbuild.transformSync(code, { minify: false });
fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated a progression in hoisted.CUO_IjfL.js');

const distJsPath = path.resolve('dist/_astro/hoisted.CUO_IjfL.js');
if (fs.existsSync(distJsPath)) {
  fs.writeFileSync(distJsPath, code, 'utf8');
  console.log('Successfully updated dist JS');
}
