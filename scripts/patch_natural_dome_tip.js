const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('=== APPLYING NATURAL 3D ROUNDED DOME CAPSULE CAP SHADERS ===');

const filesToPatch = [
  path.resolve('_astro/hoisted.CUO_IjfL.js'),
  path.resolve('dist/_astro/hoisted.CUO_IjfL.js')
];

// 1. Untapered bold vertex shader (no needle taper!)
const newVert = `vert$j=\`#define GLSLIFY 1
attribute vec3 CP;attribute float Cd;varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_scrollY;uniform vec2 u_viewportResolution;uniform vec2 u_aspect;uniform vec2 u_margin;uniform float u_radius;uniform float u_showRatio;void main(){float sx=(u_viewportResolution.x/length(u_viewportResolution))/0.87157;vec2 cpx=vec2(CP.x*sx,CP.y);float strokeThick=1.1;if(Cd<0.12)strokeThick=1.1;else if(Cd<0.37)strokeThick=1.8;else if(Cd<0.62)strokeThick=1.3;else if(Cd<0.87)strokeThick=2.1;else strokeThick=1.5;vec3 pos=vec3(cpx+position.xy*(u_radius*strokeThick),0.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_cd=Cd;v_lineRatio=position.z;v_s=CP.z;}\``;

// 2. Analytical 3D rounded dome capsule cap fragment shader
const newFrag = `frag$m=\`#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform float u_hideRatio;uniform vec3 u_colorBg;uniform vec3 u_color0;uniform vec3 u_color1;uniform float u_aoThreshold;uniform float u_radius;float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}void main(){float ao=0.9+0.1*v_cd;float aoRatio=linearStep(u_aoThreshold-0.02,u_aoThreshold+0.02,u_showRatio);if(step(u_showRatio,v_lineRatio)>0.5)discard;vec3 baseColor;vec3 rimColor;vec3 specColor;if(v_cd<0.12){baseColor=mix(vec3(0.0,0.941,1.0),vec3(0.114,0.208,1.0),clamp(v_lineRatio/0.20,0.0,1.0));rimColor=vec3(0.0,0.941,1.0);specColor=vec3(0.88,0.96,1.0);}else if(v_cd<0.37){baseColor=mix(vec3(1.0,0.0,0.267),vec3(1.0,0.20,0.0),clamp((v_lineRatio-0.20)/0.20,0.0,1.0));rimColor=vec3(1.0,0.09,0.267);specColor=vec3(1.0,0.85,0.88);}else if(v_cd<0.62){baseColor=mix(vec3(0.0,1.0,0.40),vec3(0.0,0.80,0.533),clamp((v_lineRatio-0.40)/0.20,0.0,1.0));rimColor=vec3(0.0,1.0,0.40);specColor=vec3(0.85,1.0,0.92);}else if(v_cd<0.87){baseColor=mix(vec3(1.0,0.0,0.667),vec3(0.467,0.0,1.0),clamp((v_lineRatio-0.60)/0.20,0.0,1.0));rimColor=vec3(1.0,0.0,0.667);specColor=vec3(1.0,0.85,1.0);}else{baseColor=mix(vec3(1.0,0.733,0.0),vec3(1.0,0.20,0.0),clamp((v_lineRatio-0.80)/0.20,0.0,1.0));rimColor=vec3(1.0,0.733,0.0);specColor=vec3(1.0,0.95,0.85);}float strokeThick=1.1;if(v_cd<0.12)strokeThick=1.1;else if(v_cd<0.37)strokeThick=1.8;else if(v_cd<0.62)strokeThick=1.3;else if(v_cd<0.87)strokeThick=2.1;else strokeThick=1.5;float t=(v_s-0.5)*2.0;float L=u_showRatio-v_lineRatio;float capLen=max(0.002,u_radius*0.21)*strokeThick;vec3 n;float nz;float capAlpha=1.0;if(L<capLen){float dy=1.0-(L/capLen);float d2=t*t+dy*dy;if(d2>1.0)discard;float d=sqrt(d2);nz=sqrt(max(0.0,1.0-d2));float tangentSign=1.0;n=normalize(vec3(t,dy*tangentSign,nz));float fw=max(0.0001,fwidth(d));capAlpha=linearStep(1.0,1.0-fw,d);}else{nz=sqrt(max(0.0,1.0-t*t));n=vec3(t,0.0,nz);}float diff=0.56+0.44*nz;vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),26.0);float rim=pow(1.0-nz,3.0);vec3 rimGlow=rimColor*(rim*0.38);float aoFactor=min(1.0,ao+1.0-aoRatio);vec3 shaded=(baseColor*diff+rimGlow)*aoFactor+specColor*(spec*0.42);gl_FragColor.rgb=shaded;float alpha=abs(v_s-0.5);float edgeAlpha=linearStep(0.5,0.5-fwidth(alpha),alpha);gl_FragColor.a=edgeAlpha*capAlpha;}\``;

for (const filePath of filesToPatch) {
  console.log(`\nProcessing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace vert$j
  const vertStart = content.indexOf('vert$j=`#define GLSLIFY 1');
  if (vertStart === -1) {
    throw new Error(`vert$j not found in ${filePath}`);
  }
  const vertEnd = content.indexOf('`', vertStart + 15);
  content = content.slice(0, vertStart) + newVert + content.slice(vertEnd + 1);

  // Replace frag$m
  const fragStart = content.indexOf('frag$m=`#define GLSLIFY 1');
  if (fragStart === -1) {
    throw new Error(`frag$m not found in ${filePath}`);
  }
  const fragEnd = content.indexOf('`', fragStart + 15);
  content = content.slice(0, fragStart) + newFrag + content.slice(fragEnd + 1);

  // Validate syntax with esbuild
  console.log(`Validating ${filePath} with esbuild.transformSync...`);
  esbuild.transformSync(content, { loader: 'js' });
  console.log(`Validation PASSED: 0 errors!`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated and saved: ${filePath}`);
}

console.log('\n=== ALL FILES SUCCESSFULLY PATCHED WITH NATURAL DOME CAPSULE CAP ===');
