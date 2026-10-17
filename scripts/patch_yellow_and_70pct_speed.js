const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Change 2nd stroke color to pure vibrant solid Yellow: vec3(1.0, 0.78, 0.0)
const oldFragRed = `else if(v_cd<0.40){color=vec3(1.0,0.15,0.25);}`;
const newFragYellow = `else if(v_cd<0.40){color=vec3(1.0,0.78,0.0);}`;

if (!code.includes(oldFragRed)) {
  console.error('oldFragRed not found!');
  process.exit(1);
}
code = code.replace(oldFragRed, newFragYellow);
console.log('1. Replaced frag$m 2nd stroke with solid Yellow');

const oldEndFragRed = `else if(u_cd<0.40){color=vec3(1.0,0.15,0.25);}`;
const newEndFragYellow = `else if(u_cd<0.40){color=vec3(1.0,0.78,0.0);}`;

if (!code.includes(oldEndFragRed)) {
  console.error('oldEndFragRed not found!');
  process.exit(1);
}
code = code.replace(oldEndFragRed, newEndFragYellow);
console.log('2. Replaced lineEndFrag 2nd stroke round cap with solid Yellow');

// 2. Reduce tube travel distance to 70% of current
const oldACalc = `if(this.lineId===0){const s=scrollManager.scrollPixel;if(s<=750||s<(properties.viewportWidth<768?650:800))a=0;else if(s>=5300)a=1;else if(s<1400){const d=s-750;a=d*d*(1.354669642405376e-6-9.552951257761362e-10*d)}else if(s<2500){const d=s-1400;a=0.31+d*(5.502339632057363e-4+d*(-5.08155852858089e-7+1.8002345787526508e-10*d))}else if(s<3800){const d=s-2500;a=0.54+d*(8.577623900515268e-5+d*(8.592155813028578e-8-1.671212742234021e-11*d))}else{const d=s-3800;a=0.76+d*(2.2444180411263078e-4+d*(2.0744261183158925e-8-4.2470309283275194e-11*d))}}`;

const newACalc = `if(this.lineId===0){const s=scrollManager.scrollPixel;if(s<=750||s<(properties.viewportWidth<768?650:800))a=0;else if(s>=5300){const t=Math.min(1.0,(s-5300)/1200);a=0.7+0.3*t*t*(3.0-2.0*t)}else if(s<1400){const d=s-750;a=0.7*d*d*(1.354669642405376e-6-9.552951257761362e-10*d)}else if(s<2500){const d=s-1400;a=0.7*(0.31+d*(5.502339632057363e-4+d*(-5.08155852858089e-7+1.8002345787526508e-10*d)))}else if(s<3800){const d=s-2500;a=0.7*(0.54+d*(8.577623900515268e-5+d*(8.592155813028578e-8-1.671212742234021e-11*d)))}else{const d=s-3800;a=0.7*(0.76+d*(2.2444180411263078e-4+d*(2.0744261183158925e-8-4.2470309283275194e-11*d)))}}`;

if (!code.includes(oldACalc)) {
  console.error('oldACalc not found!');
  process.exit(1);
}
code = code.replace(oldACalc, newACalc);
console.log('3. Reduced tube progress distance to exactly 70% of current across all scroll segments');

// 3. Syntax test with esbuild BEFORE saving
try {
  esbuild.transformSync(code, { minify: false });
  console.log('4. Syntax validation PASSED!');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully written to _astro/hoisted.CUO_IjfL.js');
} catch (err) {
  console.error('Syntax validation FAILED:', err);
  process.exit(1);
}
