const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Replace frag$m with 100% pure Solid Color Step Palette (Betanuri, changing per section)
const fragAssign = code.indexOf('frag$m=`#define GLSLIFY 1\n');
if (fragAssign === -1) {
  console.error('frag$m not found!');
  process.exit(1);
}
const fragBacktick1 = code.indexOf('`', fragAssign);
const fragBacktick2 = code.indexOf('`', fragBacktick1 + 1);

const solidStepFrag = `#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform vec3 u_color0;void main(){if(step(u_showRatio,v_lineRatio)>0.5)discard;vec3 color;if(v_cd<0.20){color=vec3(0.0,0.45,1.0);}else if(v_cd<0.40){color=vec3(1.0,0.15,0.25);}else if(v_cd<0.60){color=vec3(0.0,0.82,0.45);}else if(v_cd<0.80){color=vec3(0.58,0.15,0.95);}else{color=vec3(1.0,0.55,0.0);}gl_FragColor.rgb=color;float dist=abs(v_s-0.5)*2.0;float alpha=1.0-smoothstep(1.0-fwidth(dist),1.0,dist);gl_FragColor.a=alpha;}`;

code = code.slice(0, fragBacktick1 + 1) + solidStepFrag + code.slice(fragBacktick2);
console.log('1. Replaced frag$m with pure Solid Color step palette (changing colors per section)');

// 2. Replace lineEndFrag with identical Solid Color Step Palette Round Cap
const endFragAssign = code.indexOf('lineEndFrag=`#define GLSLIFY 1\n');
if (endFragAssign === -1) {
  console.error('lineEndFrag not found!');
  process.exit(1);
}
const endBacktick1 = code.indexOf('`', endFragAssign);
const endBacktick2 = code.indexOf('`', endBacktick1 + 1);

const solidStepEndFrag = `#define GLSLIFY 1
uniform float u_cd;varying vec2 v_uv;void main(){float d=length(v_uv-0.5)*2.0;if(d>1.0)discard;vec3 color;if(u_cd<0.20){color=vec3(0.0,0.45,1.0);}else if(u_cd<0.40){color=vec3(1.0,0.15,0.25);}else if(u_cd<0.60){color=vec3(0.0,0.82,0.45);}else if(u_cd<0.80){color=vec3(0.58,0.15,0.95);}else{color=vec3(1.0,0.55,0.0);}gl_FragColor.rgb=color;float alpha=1.0-smoothstep(1.0-fwidth(d),1.0,d);gl_FragColor.a=alpha;}`;

code = code.slice(0, endBacktick1 + 1) + solidStepEndFrag + code.slice(endBacktick2);
console.log('2. Replaced lineEndFrag with pure Solid Color round cap matching section palette');

// 3. Check syntax with esbuild BEFORE saving
try {
  esbuild.transformSync(code, { minify: false });
  console.log('3. Syntax validation PASSED!');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully written to _astro/hoisted.CUO_IjfL.js');
} catch (err) {
  console.error('Syntax validation FAILED:', err);
  process.exit(1);
}
