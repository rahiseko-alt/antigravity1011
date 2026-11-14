const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('=== RESTORING 2D FLAT TUBE & CLEAN TRAJECTORY ===');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Restore vert$j: remove getDynamicThick, uniform strokeThick = 1.3
const cpIdx = code.indexOf('attribute vec3 CP;');
if (cpIdx === -1) {
  console.error('attribute vec3 CP; not found!');
  process.exit(1);
}
// Find beginning of vert assignment before cpIdx
const vertAssignStart = code.lastIndexOf('`', cpIdx);
const vertEndIdx = code.indexOf('}`,frag$m=', cpIdx);
if (vertAssignStart === -1 || vertEndIdx === -1) {
  console.error('vert bounds not found!');
  process.exit(1);
}

const newVertBody = `#define GLSLIFY 1\nattribute vec3 CP;attribute float Cd;varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_scrollY;uniform vec2 u_viewportResolution;uniform vec2 u_aspect;uniform vec2 u_margin;uniform float u_radius;uniform float u_showRatio;void main(){float strokeThick=1.3;vec3 pos=vec3(CP.xy+position.xy*(u_radius*strokeThick),0.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_cd=Cd;v_lineRatio=position.z;v_s=CP.z;}`;

code = code.slice(0, vertAssignStart + 1) + newVertBody + code.slice(vertEndIdx);
console.log('1. vert$j restored to uniform strokeThick 1.3 (no getDynamicThick)');

// 2. Restore frag$m: pure 2D flat solid color (no normal, no diffuse, no specular, no rim)
const fragAssignStart = code.indexOf('frag$m=`');
if (fragAssignStart === -1) {
  console.error('frag$m=` not found!');
  process.exit(1);
}
const fragBodyStart = fragAssignStart + 'frag$m=`'.length;
const fragEndIdx = code.indexOf('}`,lineEndVert=', fragBodyStart);
if (fragEndIdx === -1) {
  console.error('lineEndVert not found!');
  process.exit(1);
}

const newFragBody = `#define GLSLIFY 1\nvarying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform vec3 u_color0;vec3 getTubeColor(float t){t=clamp(t,0.0,1.0);vec3 c_cyan=vec3(0.00,0.92,1.00);vec3 c_blue=vec3(0.06,0.38,1.00);vec3 c_red=vec3(1.00,0.12,0.24);vec3 c_yellow=vec3(1.00,0.85,0.00);vec3 c_green=vec3(0.00,0.88,0.36);vec3 c_purple=vec3(0.68,0.12,1.00);vec3 c_orange=vec3(1.00,0.48,0.04);if(t<0.18){return mix(c_cyan,c_blue,t/0.18);}else if(t<0.36){return mix(c_red,c_orange,(t-0.18)/0.18);}else if(t<0.54){return mix(c_yellow,c_green,(t-0.36)/0.18);}else if(t<0.72){return mix(c_green,c_purple,(t-0.54)/0.18);}else{return mix(c_purple,c_cyan,(t-0.72)/0.28);}}void main(){if(step(u_showRatio,v_lineRatio)>0.5)discard;vec3 color=getTubeColor(v_lineRatio);float dist=abs(v_s-0.5)*2.0;float alpha=1.0-smoothstep(1.0-fwidth(dist),1.0,dist);gl_FragColor=vec4(color,alpha);}`;

code = code.slice(0, fragBodyStart) + newFragBody + code.slice(fragEndIdx);
console.log('2. frag$m restored to pure 2D flat solid color (no 3D lighting)');

// 3. Restore lineEndFrag: pure 2D flat round cap
const endFragAssignStart = code.indexOf('lineEndFrag=`');
if (endFragAssignStart === -1) {
  console.error('lineEndFrag=` not found!');
  process.exit(1);
}
const endFragBodyStart = endFragAssignStart + 'lineEndFrag=`'.length;
const endFragEndIdx = code.indexOf('}`,_v0$2=', endFragBodyStart);
if (endFragEndIdx === -1) {
  console.error('endFragEndIdx not found!');
  process.exit(1);
}

const newLineEndFragBody = `#define GLSLIFY 1\nuniform float u_cd;uniform float u_lineRatio;varying vec2 v_uv;vec3 getTubeColor(float t){t=clamp(t,0.0,1.0);vec3 c_cyan=vec3(0.00,0.92,1.00);vec3 c_blue=vec3(0.06,0.38,1.00);vec3 c_red=vec3(1.00,0.12,0.24);vec3 c_yellow=vec3(1.00,0.85,0.00);vec3 c_green=vec3(0.00,0.88,0.36);vec3 c_purple=vec3(0.68,0.12,1.00);vec3 c_orange=vec3(1.00,0.48,0.04);if(t<0.18){return mix(c_cyan,c_blue,t/0.18);}else if(t<0.36){return mix(c_red,c_orange,(t-0.18)/0.18);}else if(t<0.54){return mix(c_yellow,c_green,(t-0.36)/0.18);}else if(t<0.72){return mix(c_green,c_purple,(t-0.54)/0.18);}else{return mix(c_purple,c_cyan,(t-0.72)/0.28);}}void main(){float d=length(v_uv-0.5)*2.0;if(d>1.0)discard;vec3 color=getTubeColor(u_lineRatio);float alpha=1.0-smoothstep(1.0-fwidth(d),1.0,d);gl_FragColor=vec4(color,alpha);}`;

code = code.slice(0, endFragBodyStart) + newLineEndFragBody + code.slice(endFragEndIdx);
console.log('3. lineEndFrag restored to pure 2D flat round cap');

// 4. Remove lerp container slide hack in Line.prototype.update
const badTransform = 'if(this.lineId===0&&isMob){const rF=math.clamp((1200-s)/600,0,1);const mX=properties.viewportWidth*0.52;const mY=u*1.62-l*0.75;this.innerContainer.position.x=math.lerp(this.lineData.margin.x*c,mX,rF);this.innerContainer.position.y=math.lerp(this.lineData.margin.y*u-l,mY,rF);}else{this.innerContainer.position.x=this.lineData.margin.x*c;this.innerContainer.position.y=this.lineData.margin.y*u-l;}';

// Clean static positioning: completely rigid scroll lock (zero container distortion)
const cleanTransform = 'this.innerContainer.position.x=this.lineId===0&&isMob?properties.viewportWidth*0.48:this.lineData.margin.x*c;this.innerContainer.position.y=this.lineData.margin.y*u-l+(this.lineId===0&&isMob?u*1.15:0);';

if (!code.includes(badTransform)) {
  console.error('badTransform not found!');
  process.exit(1);
}
code = code.replace(badTransform, cleanTransform);
console.log('4. Removed dynamic lerp container distortion hack; restored rigid scroll-locked transform');

// 5. Update mK smooth progression on mobile (eliminate abrupt stall)
const oldMK = 'const mK=[[150,0.0],[420,0.09],[720,0.22],[1400,0.36],[2200,0.48],[3000,0.62],[3650,0.72],[4300,0.82],[5200,0.95],[6200,1.0]];';
const newMK = 'const mK=[[150,0.0],[400,0.08],[680,0.20],[1200,0.34],[2000,0.48],[2900,0.62],[3700,0.74],[4500,0.84],[5400,0.94],[6300,1.0]];';
if (code.includes(oldMK)) {
  code = code.replace(oldMK, newMK);
  console.log('5. Smooth monotonic pacing updated for mK');
}

// 6. Validate syntax with esbuild
console.log('Validating with esbuild.transformSync...');
esbuild.transformSync(code, { loader: 'js' });
console.log('Validation PASSED: 0 errors!');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully saved to _astro/hoisted.CUO_IjfL.js');
