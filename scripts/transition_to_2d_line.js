const fs = require('fs');
const path = require('path');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Replace frag$m with clean 2D flat shader
const fragMarkerStart = 'frag$m=`#define GLSLIFY 1\nvarying float v_cd;varying float v_lineRatio;varying float v_s;';
const fragIdx = code.indexOf(fragMarkerStart);
if (fragIdx === -1) {
  console.error('frag$m start marker not found!');
  process.exit(1);
}
const fragEndIdx = code.indexOf('}`,lineEndVert=', fragIdx);
if (fragEndIdx === -1) {
  console.error('frag$m end marker not found!');
  process.exit(1);
}

const newFrag = `frag$m=\`#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform float u_hideRatio;uniform vec3 u_colorBg;uniform vec3 u_color0;uniform vec3 u_color1;uniform float u_aoThreshold;uniform float u_radius;void main(){if(step(u_showRatio,v_lineRatio)>0.5)discard;vec3 color;if(v_cd<0.10){color=mix(vec3(0.0,0.941,1.0),vec3(0.071,0.522,0.863),clamp(v_lineRatio/0.16,0.0,1.0));}else if(v_cd<0.30){color=mix(vec3(1.0,0.0,0.267),vec3(1.0,0.20,0.0),clamp((v_lineRatio-0.16)/0.16,0.0,1.0));}else if(v_cd<0.50){color=mix(vec3(0.0,1.0,0.40),vec3(0.0,0.80,0.533),clamp((v_lineRatio-0.32)/0.18,0.0,1.0));}else if(v_cd<0.70){color=mix(vec3(1.0,0.0,0.667),vec3(0.467,0.0,1.0),clamp((v_lineRatio-0.50)/0.18,0.0,1.0));}else if(v_cd<0.90){color=mix(vec3(1.0,0.733,0.0),vec3(1.0,0.267,0.0),clamp((v_lineRatio-0.68)/0.16,0.0,1.0));}else{color=mix(vec3(0.9,0.95,1.0),vec3(0.0,0.941,1.0),clamp((v_lineRatio-0.84)/0.16,0.0,1.0));}gl_FragColor.rgb=color;float distFromCenter=abs(v_s-0.5)*2.0;float alpha=1.0-smoothstep(1.0-fwidth(distFromCenter),1.0,distFromCenter);gl_FragColor.a=alpha;}`;

code = code.slice(0, fragIdx) + newFrag + code.slice(fragEndIdx + 1);

// 2. Replace lineEndFrag with clean 2D round cap shader
const endFragMarkerStart = 'lineEndFrag=`#define GLSLIFY 1\nuniform float u_cd;uniform float u_lineRatio;uniform float u_ao;varying vec2 v_uv;';
const endFragIdx = code.indexOf(endFragMarkerStart);
if (endFragIdx === -1) {
  console.error('lineEndFrag start marker not found!');
  process.exit(1);
}
const endFragEndIdx = code.indexOf('}`,_v0$2=', endFragIdx);
if (endFragEndIdx === -1) {
  console.error('lineEndFrag end marker not found!');
  process.exit(1);
}

const newEndFrag = `lineEndFrag=\`#define GLSLIFY 1
uniform float u_cd;uniform float u_lineRatio;uniform float u_ao;varying vec2 v_uv;void main(){float d=length(v_uv-0.5)*2.0;if(d>1.0)discard;vec3 color;if(u_cd<0.10){color=mix(vec3(0.0,0.941,1.0),vec3(0.071,0.522,0.863),clamp(u_lineRatio/0.16,0.0,1.0));}else if(u_cd<0.30){color=mix(vec3(1.0,0.0,0.267),vec3(1.0,0.20,0.0),clamp((u_lineRatio-0.16)/0.16,0.0,1.0));}else if(u_cd<0.50){color=mix(vec3(0.0,1.0,0.40),vec3(0.0,0.80,0.533),clamp((u_lineRatio-0.32)/0.18,0.0,1.0));}else if(u_cd<0.70){color=mix(vec3(1.0,0.0,0.667),vec3(0.467,0.0,1.0),clamp((u_lineRatio-0.50)/0.18,0.0,1.0));}else if(u_cd<0.90){color=mix(vec3(1.0,0.733,0.0),vec3(1.0,0.267,0.0),clamp((u_lineRatio-0.68)/0.16,0.0,1.0));}else{color=mix(vec3(0.9,0.95,1.0),vec3(0.0,0.941,1.0),clamp((u_lineRatio-0.84)/0.16,0.0,1.0));}gl_FragColor.rgb=color;float alpha=1.0-smoothstep(1.0-fwidth(d),1.0,d);gl_FragColor.a=alpha;}`;

code = code.slice(0, endFragIdx) + newEndFrag + code.slice(endFragEndIdx + 1);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully transitioned line to clean, modern 2D flat graphics!');
