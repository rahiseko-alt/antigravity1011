const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

// revert git changes first to ensure clean baseline
const { execSync } = require('child_process');
execSync('git checkout _astro/hoisted.CUO_IjfL.js');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Vert stroke thickness
const oldStrokeLogic = `float strokeThick=1.15;if(Cd<0.10)strokeThick=1.15;else if(Cd<0.30)strokeThick=1.65;else if(Cd<0.50)strokeThick=1.35;else if(Cd<0.70)strokeThick=1.85;else if(Cd<0.90)strokeThick=1.45;else strokeThick=1.25;`;
const newStrokeLogic = `float strokeThick=1.3;`;

if (!code.includes(oldStrokeLogic)) {
  console.error('oldStrokeLogic not found!');
  process.exit(1);
}
code = code.replace(oldStrokeLogic, newStrokeLogic);
console.log('1. Vert stroke thickness set to uniform 1.3');

// 2. Pure Solid Color frag$m
const vertEnd = code.indexOf('v_s=CP.z;}');
const fragAssign = code.indexOf('frag', vertEnd);
const backtick1 = code.indexOf('`', fragAssign);
const backtick2 = code.indexOf('`', backtick1 + 1);

console.log('frag string from backtick1 to backtick2:', backtick1, backtick2);

const solidFragBody = `#define GLSLIFY 1\nvarying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform vec3 u_color0;void main(){if(step(u_showRatio,v_lineRatio)>0.5)discard;gl_FragColor.rgb=u_color0;float dist=abs(v_s-0.5)*2.0;float alpha=1.0-smoothstep(1.0-fwidth(dist),1.0,dist);gl_FragColor.a=alpha;}`;

code = code.slice(0, backtick1 + 1) + solidFragBody + code.slice(backtick2);
console.log('2. Replaced frag$m with pure solid color');

// 3. Pure Solid Color lineEndFrag
const lineEndFragAssign = code.indexOf('lineEndFrag=');
const endBacktick1 = code.indexOf('`', lineEndFragAssign);
const endBacktick2 = code.indexOf('`', endBacktick1 + 1);

console.log('lineEndFrag string from endBacktick1 to endBacktick2:', endBacktick1, endBacktick2);

const solidEndFragBody = `#define GLSLIFY 1\nuniform vec3 u_color0;varying vec2 v_uv;void main(){float d=length(v_uv-0.5)*2.0;if(d>1.0)discard;gl_FragColor.rgb=u_color0;float alpha=1.0-smoothstep(1.0-fwidth(d),1.0,d);gl_FragColor.a=alpha;}`;

code = code.slice(0, endBacktick1 + 1) + solidEndFragBody + code.slice(endBacktick2);
console.log('3. Replaced lineEndFrag with pure solid color round cap');

// 4. Update circle scale
const oldCircleScale = `this.circle.scale.set(n*strokeThick,n*strokeThick,1)`;
const newCircleScale = `this.circle.scale.set(n*1.3,n*1.3,1)`;
if (code.includes(oldCircleScale)) {
  code = code.replace(oldCircleScale, newCircleScale);
  console.log('4. Updated circle scale to uniform 1.3');
}

// 5. Test syntax with esbuild BEFORE saving
try {
  esbuild.transformSync(code, { minify: false });
  console.log('5. Syntax validation PASSED!');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully written to _astro/hoisted.CUO_IjfL.js');
} catch (err) {
  console.error('Syntax validation FAILED:', err);
  process.exit(1);
}
