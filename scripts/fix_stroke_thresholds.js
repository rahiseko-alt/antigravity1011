const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Correct threshold boundaries for the 5 strokes:
// 1st stroke (Reel): cd < 0.08 -> Royal Blue
// 2nd stroke (Initiatives Cards 1&2): cd < 0.28 -> Vibrant Solid Yellow
// 3rd stroke (Mid Avenue): cd < 0.48 -> Emerald Green
// 4th stroke (Lower Cards): cd < 0.68 -> Purple
// 5th stroke (Members / Goal): cd >= 0.68 -> Orange

const oldFragNeedle = `if(v_cd<0.20){color=vec3(0.0,0.45,1.0);}else if(v_cd<0.40){color=vec3(1.0,0.78,0.0);}else if(v_cd<0.60){color=vec3(0.0,0.82,0.45);}else if(v_cd<0.80){color=vec3(0.58,0.15,0.95);}else{color=vec3(1.0,0.55,0.0);}`;
const newFragPalette = `if(v_cd<0.08){color=vec3(0.0,0.45,1.0);}else if(v_cd<0.28){color=vec3(1.0,0.80,0.0);}else if(v_cd<0.48){color=vec3(0.0,0.82,0.45);}else if(v_cd<0.68){color=vec3(0.58,0.15,0.95);}else{color=vec3(1.0,0.55,0.0);}`;

if (!code.includes(oldFragNeedle)) {
  console.error('oldFragNeedle not found!');
  process.exit(1);
}
code = code.replace(oldFragNeedle, newFragPalette);
console.log('1. Updated frag$m with precise stroke thresholds (2nd stroke = pure Yellow)');

const oldEndFragNeedle = `if(u_cd<0.20){color=vec3(0.0,0.45,1.0);}else if(u_cd<0.40){color=vec3(1.0,0.78,0.0);}else if(u_cd<0.60){color=vec3(0.0,0.82,0.45);}else if(u_cd<0.80){color=vec3(0.58,0.15,0.95);}else{color=vec3(1.0,0.55,0.0);}`;
const newEndFragPalette = `if(u_cd<0.08){color=vec3(0.0,0.45,1.0);}else if(u_cd<0.28){color=vec3(1.0,0.80,0.0);}else if(u_cd<0.48){color=vec3(0.0,0.82,0.45);}else if(u_cd<0.68){color=vec3(0.58,0.15,0.95);}else{color=vec3(1.0,0.55,0.0);}`;

if (!code.includes(oldEndFragNeedle)) {
  console.error('oldEndFragNeedle not found!');
  process.exit(1);
}
code = code.replace(oldEndFragNeedle, newEndFragPalette);
console.log('2. Updated lineEndFrag with precise stroke thresholds (2nd stroke round cap = pure Yellow)');

// Validate syntax
try {
  esbuild.transformSync(code, { minify: false });
  console.log('3. Syntax validation PASSED!');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully written to _astro/hoisted.CUO_IjfL.js');
} catch (err) {
  console.error('Syntax validation FAILED:', err);
  process.exit(1);
}
