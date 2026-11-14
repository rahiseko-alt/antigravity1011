const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Shaders: Primary Colors (Blue -> Red -> Yellow -> Green -> Purple -> Orange)
const oldFragNeedle = `vec3 color;if(v_cd<0.08){color=vec3(0.0,0.45,1.0);}else if(v_cd<0.28){color=vec3(1.0,0.80,0.0);}else if(v_cd<0.48){color=vec3(0.0,0.82,0.45);}else if(v_cd<0.68){color=vec3(0.58,0.15,0.95);}else{color=vec3(1.0,0.55,0.0);}`;
const newFragPalette = `vec3 color;if(v_cd<0.10){color=vec3(0.00,0.45,1.00);}else if(v_cd<0.30){color=vec3(0.96,0.12,0.20);}else if(v_cd<0.50){color=vec3(1.00,0.82,0.00);}else if(v_cd<0.70){color=vec3(0.00,0.82,0.35);}else if(v_cd<0.90){color=vec3(0.62,0.15,0.95);}else{color=vec3(1.00,0.48,0.05);}`;

if (!code.includes(oldFragNeedle)) {
  console.error('ERROR: oldFragNeedle not found!');
  process.exit(1);
}
code = code.replace(oldFragNeedle, newFragPalette);
console.log('1. Replaced frag$m colors with vibrant primary colors (Blue -> Red -> Yellow -> Green -> Purple -> Orange)');

const oldEndFragNeedle = `vec3 color;if(u_cd<0.08){color=vec3(0.0,0.45,1.0);}else if(u_cd<0.28){color=vec3(1.0,0.80,0.0);}else if(u_cd<0.48){color=vec3(0.0,0.82,0.45);}else if(u_cd<0.68){color=vec3(0.58,0.15,0.95);}else{color=vec3(1.0,0.55,0.0);}`;
const newEndFragPalette = `vec3 color;if(u_cd<0.10){color=vec3(0.00,0.45,1.00);}else if(u_cd<0.30){color=vec3(0.96,0.12,0.20);}else if(u_cd<0.50){color=vec3(1.00,0.82,0.00);}else if(u_cd<0.70){color=vec3(0.00,0.82,0.35);}else if(u_cd<0.90){color=vec3(0.62,0.15,0.95);}else{color=vec3(1.00,0.48,0.05);}`;

if (!code.includes(oldEndFragNeedle)) {
  console.error('ERROR: oldEndFragNeedle not found!');
  process.exit(1);
}
code = code.replace(oldEndFragNeedle, newEndFragPalette);
console.log('2. Replaced lineEndFrag round dome colors');

// 2. Progression calculation: smooth cubic spline spanning all sections from Reel to Members (0 to 6800+)
const oldACalc = `if(this.lineId===0){const s=scrollManager.scrollPixel;if(s<=750||s<(properties.viewportWidth<768?650:800))a=0;else if(s>=5300){const t=Math.min(1.0,(s-5300)/1200);a=0.7+0.3*t*t*(3.0-2.0*t)}else if(s<1400){const d=s-750;a=0.7*d*d*(1.354669642405376e-6-9.552951257761362e-10*d)}else if(s<2500){const d=s-1400;a=0.7*(0.31+d*(5.502339632057363e-4+d*(-5.08155852858089e-7+1.8002345787526508e-10*d)))}else if(s<3800){const d=s-2500;a=0.7*(0.54+d*(8.577623900515268e-5+d*(8.592155813028578e-8-1.671212742234021e-11*d)))}else{const d=s-3800;a=0.7*(0.76+d*(2.2444180411263078e-4+d*(2.0744261183158925e-8-4.2470309283275194e-11*d)))}}`;
const newACalc = `if(this.lineId===0){const s=scrollManager.scrollPixel,isMob=properties.viewportWidth<768,s0=isMob?550:750,s1=isMob?1300:1600,s2=isMob?2200:2600,s3=isMob?3200:4000,s4=isMob?4300:5400,s5=isMob?6500:6800;if(s<=s0)a=0;else if(s<s1){const t=(s-s0)/(s1-s0);a=0.32*t*t*(3.0-2.0*t)}else if(s<s2){const t=(s-s1)/(s2-s1);a=0.32+0.18*t*t*(3.0-2.0*t)}else if(s<s3){const t=(s-s2)/(s3-s2);a=0.50+0.18*t*t*(3.0-2.0*t)}else if(s<s4){const t=(s-s3)/(s4-s3);a=0.68+0.16*t*t*(3.0-2.0*t)}else if(s<s5){const t=(s-s4)/(s5-s4);a=0.84+0.16*t*t*(3.0-2.0*t)}else a=1.0}`;

if (!code.includes(oldACalc)) {
  console.error('ERROR: oldACalc not found!');
  process.exit(1);
}
code = code.replace(oldACalc, newACalc);
console.log('3. Replaced tube progression curve with smooth full-span trajectory');

// 3. Container visibility: extend from 5800 to 7200 so it covers all member cards
const oldVis = `this.container.visible=this.lineId===0?(scrollManager.scrollPixel>=(properties.viewportWidth<768?650:800)&&scrollManager.scrollPixel<5800):(_box.max.y>-properties.viewportHeight&&_box.min.y<0)`;
const newVis = `this.container.visible=this.lineId===0?(scrollManager.scrollPixel>=(properties.viewportWidth<768?550:700)&&scrollManager.scrollPixel<7200):(_box.max.y>-properties.viewportHeight&&_box.min.y<0)`;

if (!code.includes(oldVis)) {
  console.error('ERROR: oldVis not found!');
  process.exit(1);
}
code = code.replace(oldVis, newVis);
console.log('4. Extended tube visibility lifespan to scrollPixel 7200');

// 4. Circle visibility start
const oldCircleVis = `this.circle.visible=(this.lineId===0?(scrollManager.scrollPixel>=(properties.viewportWidth<768?650:800)&&a>0.001&&a<0.999):(a>0.001&&a<0.999))`;
const newCircleVis = `this.circle.visible=(this.lineId===0?(scrollManager.scrollPixel>=(properties.viewportWidth<768?550:700)&&a>0.001&&a<0.999):(a>0.001&&a<0.999))`;

if (!code.includes(oldCircleVis)) {
  console.error('ERROR: oldCircleVis not found!');
  process.exit(1);
}
code = code.replace(oldCircleVis, newCircleVis);
console.log('5. Synchronized circle tip visibility trigger');

// 5. Esbuild validation
try {
  esbuild.transformSync(code, { minify: false });
  console.log('6. ESBuild syntax validation PASSED!');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully written to _astro/hoisted.CUO_IjfL.js');
} catch (err) {
  console.error('Syntax validation FAILED:', err);
  process.exit(1);
}
