const fs = require('fs');

function patchElite3DLine(filePath, options = {}) {
  const {
    margin = { x: -0.02, y: -0.65 },
    color0 = '#00f0ff',
    color1 = '#1d35ff',
    radius = 0.0105
  } = options;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Locate LINES_DATA_LIST
  const listIdx = content.indexOf('LINES_DATA_LIST=[');
  if (listIdx === -1) {
    console.error(`[${filePath}] LINES_DATA_LIST=[ not found!`);
    return false;
  }
  const reelStart = content.indexOf('{fileName:"line_reel"', listIdx);
  const reelEnd = content.indexOf('},{fileName:"line_goal"', reelStart);
  if (reelStart === -1 || reelEnd === -1) {
    console.error(`[${filePath}] line_reel segment not found!`);
    return false;
  }

  const newLineData = `{fileName:"line_reel",aoThreshold:.555,margin:{x:${margin.x},y:${margin.y}},scrollToRatioFactors:[.4,1.3],boxMin:new Vector3(-.0112049,-.0141946,0),boxMax:new Vector3(1.01357,.718671,0),color0:"${color0}",color1:"${color1}"}`;
  content = content.slice(0, reelStart) + newLineData + content.slice(reelEnd);
  console.log(`[${filePath}] Updated line_reel data with margin {x: ${margin.x}, y: ${margin.y}}, colors ${color0} & ${color1}.`);

  // 2. Locate class Line radius
  const classLineIdx = content.indexOf('class Line{');
  if (classLineIdx === -1) {
    console.error(`[${filePath}] class Line{ not found!`);
    return false;
  }
  const radIdx = content.indexOf('radius=', classLineIdx);
  const radEnd = content.indexOf(';', radIdx);
  if (radIdx === -1 || radEnd === -1) {
    console.error(`[${filePath}] radius field in class Line not found!`);
    return false;
  }
  content = content.slice(0, radIdx) + `radius=${radius}` + content.slice(radEnd);
  console.log(`[${filePath}] Updated class Line radius to ${radius}.`);

  // 3. Locate frag$m
  const fragStart = content.indexOf('frag$m=`#define GLSLIFY 1');
  if (fragStart === -1) {
    console.error(`[${filePath}] frag$m not found!`);
    return false;
  }
  const fragEnd = content.indexOf('`', fragStart + 15);
  if (fragEnd === -1) {
    console.error(`[${filePath}] frag$m end backtick not found!`);
    return false;
  }

  const newFrag = `frag$m=\`#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform float u_hideRatio;uniform vec3 u_colorBg;uniform vec3 u_color0;uniform vec3 u_color1;uniform float u_aoThreshold;float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}vec3 hsv2rgb(in vec3 c){vec3 rgb=clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);rgb=rgb*rgb*(3.0-2.0*rgb);return c.z*mix(vec3(1.0),rgb,c.y);}vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)),d/(q.x+e),q.x);}vec3 lerpHSV(in vec3 a,in vec3 b,in float x){float hue=(mod(mod((b.x-a.x),1.)+1.5,1.)-0.5)*x+a.x;return vec3(hue,mix(a.yz,b.yz,x));}void main(){float ao=0.9+0.1*v_cd;float aoRatio=linearStep(u_aoThreshold-0.02,u_aoThreshold+0.02,u_showRatio);if(step(u_showRatio,v_lineRatio)>0.5)discard;float mixRatio=1.0-pow(1.0-clamp(v_lineRatio,0.0,1.0),2.0);vec3 baseColor=hsv2rgb(lerpHSV(rgb2hsv(u_color1),rgb2hsv(u_color0),mixRatio));float t=(v_s-0.5)*2.0;float nz=sqrt(max(0.0,1.0-t*t));float diff=0.58+0.42*nz;vec3 n=vec3(t,0.0,nz);vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),26.0);float rim=pow(1.0-nz,3.0);vec3 rimColor=u_color0*(rim*0.28);float aoFactor=min(1.0,ao+1.0-aoRatio);vec3 shaded=(baseColor*diff+rimColor)*aoFactor+vec3(1.0)*(spec*0.38);gl_FragColor.rgb=shaded;float alpha=abs(v_s-.5);gl_FragColor.a=linearStep(0.5,0.5-fwidth(alpha),alpha);}\``;

  content = content.slice(0, fragStart) + newFrag + content.slice(fragEnd + 1);
  console.log(`[${filePath}] Updated frag$m with elite 3D cylindrical lighting, specular highlights & rim.`);

  // 4. Locate lineEndFrag
  const endFragStart = content.indexOf('lineEndFrag=`#define GLSLIFY 1');
  if (endFragStart === -1) {
    console.error(`[${filePath}] lineEndFrag not found!`);
    return false;
  }
  const endFragEnd = content.indexOf('`', endFragStart + 15);
  if (endFragEnd === -1) {
    console.error(`[${filePath}] lineEndFrag end backtick not found!`);
    return false;
  }

  const newLineEndFrag = `lineEndFrag=\`#define GLSLIFY 1
varying vec3 v_color;varying vec2 v_uv;void main(){float d=length(v_uv-.5)*2.;if(d>1.0)discard;float nz=sqrt(max(0.0,1.0-clamp(d*d,0.0,1.0)));float diff=0.58+0.42*nz;vec3 n=vec3((v_uv-.5)*2.,nz);vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),26.0);float rim=pow(1.0-nz,3.0);gl_FragColor.rgb=(v_color*diff+v_color*rim*0.28)+vec3(1.0)*(spec*0.38);gl_FragColor.a=smoothstep(1.,1.-fwidth(d),d);}\``;

  content = content.slice(0, endFragStart) + newLineEndFrag + content.slice(endFragEnd + 1);
  console.log(`[${filePath}] Updated lineEndFrag with matching 3D spherical cap shading.`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[${filePath}] Saved successfully.`);
  return true;
}

module.exports = { patchElite3DLine };

if (require.main === module) {
  console.log('--- Applying Elite 3D Line to _astro/hoisted.CUO_IjfL.js ---');
  patchElite3DLine('_astro/hoisted.CUO_IjfL.js');
  console.log('--- Applying Elite 3D Line to dist/_astro/hoisted.CUO_IjfL.js ---');
  patchElite3DLine('dist/_astro/hoisted.CUO_IjfL.js');
}
