const fs = require('fs');

function patchTipSolution(filePath, mode = 'taper_clean') {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Ensure LINES_DATA_LIST has the elite curve layout
  const listIdx = content.indexOf('LINES_DATA_LIST=[');
  if (listIdx === -1) {
    console.error(`[${filePath}] LINES_DATA_LIST=[ not found!`);
    return false;
  }
  const reelStart = content.indexOf('{fileName:"line_reel"', listIdx);
  const reelEnd = content.indexOf('},{fileName:"line_goal"', reelStart);
  if (reelStart !== -1 && reelEnd !== -1) {
    const newLineData = `{fileName:"line_reel",aoThreshold:.555,margin:{x:-0.02,y:-0.65},scrollToRatioFactors:[.4,1.3],boxMin:new Vector3(-.0112049,-.0141946,0),boxMax:new Vector3(1.01357,.718671,0),color0:"#00f0ff",color1:"#1d35ff"}`;
    content = content.slice(0, reelStart) + newLineData + content.slice(reelEnd);
  }

  // 2. Ensure radius is 0.0105
  const classLineIdx = content.indexOf('class Line{');
  if (classLineIdx !== -1) {
    const radIdx = content.indexOf('radius=', classLineIdx);
    const radEnd = content.indexOf(';', radIdx);
    if (radIdx !== -1 && radEnd !== -1) {
      content = content.slice(0, radIdx) + `radius=0.0105` + content.slice(radEnd);
    }
  }

  // 3. vert$j: Elegant teardrop taper
  const vertStart = content.indexOf('vert$j=`#define GLSLIFY 1');
  if (vertStart !== -1) {
    const vertEnd = content.indexOf('`', vertStart + 15);
    const newVert = `vert$j=\`#define GLSLIFY 1
attribute vec3 CP;attribute float Cd;varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_scrollY;uniform vec2 u_viewportResolution;uniform vec2 u_aspect;uniform vec2 u_margin;uniform float u_radius;uniform float u_showRatio;void main(){float taperLen=0.032;float distToEnd=clamp((u_showRatio-position.z)/taperLen,0.0,1.0);float taper=pow(smoothstep(0.0,1.0,distToEnd),0.75);vec3 pos=vec3(CP.xy+position.xy*u_radius*taper,0.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_cd=Cd;v_lineRatio=position.z;v_s=CP.z;}\``;
    content = content.slice(0, vertStart) + newVert + content.slice(vertEnd + 1);
  }

  // 4. frag$m: 3D cylindrical lighting with specular, rim, and subpixel feathered tip
  const fragStart = content.indexOf('frag$m=`#define GLSLIFY 1');
  if (fragStart !== -1) {
    const fragEnd = content.indexOf('`', fragStart + 15);
    const newFrag = `frag$m=\`#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform float u_hideRatio;uniform vec3 u_colorBg;uniform vec3 u_color0;uniform vec3 u_color1;uniform float u_aoThreshold;float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}vec3 hsv2rgb(in vec3 c){vec3 rgb=clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);rgb=rgb*rgb*(3.0-2.0*rgb);return c.z*mix(vec3(1.0),rgb,c.y);}vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)),d/(q.x+e),q.x);}vec3 lerpHSV(in vec3 a,in vec3 b,in float x){float hue=(mod(mod((b.x-a.x),1.)+1.5,1.)-0.5)*x+a.x;return vec3(hue,mix(a.yz,b.yz,x));}void main(){float ao=0.9+0.1*v_cd;float aoRatio=linearStep(u_aoThreshold-0.02,u_aoThreshold+0.02,u_showRatio);if(step(u_showRatio,v_lineRatio)>0.5)discard;float mixRatio=1.0-pow(1.0-clamp(v_lineRatio,0.0,1.0),2.0);vec3 baseColor=hsv2rgb(lerpHSV(rgb2hsv(u_color1),rgb2hsv(u_color0),mixRatio));float t=(v_s-0.5)*2.0;float nz=sqrt(max(0.0,1.0-t*t));float diff=0.58+0.42*nz;vec3 n=vec3(t,0.0,nz);vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),26.0);float rim=pow(1.0-nz,3.0);vec3 rimColor=u_color0*(rim*0.28);float aoFactor=min(1.0,ao+1.0-aoRatio);vec3 shaded=(baseColor*diff+rimColor)*aoFactor+vec3(1.0)*(spec*0.38);gl_FragColor.rgb=shaded;float alpha=abs(v_s-.5);float edgeAlpha=linearStep(0.5,0.5-fwidth(alpha),alpha);float tipAlpha=smoothstep(0.0,0.002,u_showRatio-v_lineRatio);gl_FragColor.a=edgeAlpha*tipAlpha;}\``;
    content = content.slice(0, fragStart) + newFrag + content.slice(fragEnd + 1);
  }

  // 5. lineEndFrag and this.circle visibility based on mode
  if (mode === 'taper_clean') {
    // Hide circle completely
    const addCircle = 'this.innerContainer.add(this.circle)';
    if (content.indexOf(addCircle) !== -1 && !content.includes('this.innerContainer.add(this.circle),this.circle.visible=!1')) {
      content = content.replace(addCircle, 'this.innerContainer.add(this.circle),this.circle.visible=!1');
    }
    const circleUpdate = 'this.circle.position.copy(_v0$2)';
    if (content.indexOf(circleUpdate) !== -1 && !content.includes('this.circle.visible=!1,this.circle.position.copy')) {
      content = content.replace(circleUpdate, 'this.circle.visible=!1,this.circle.position.copy(_v0$2)');
    }
  } else if (mode === 'taper_glow') {
    // Enable soft luminous radial glow sprite
    content = content.replace('this.circle.visible=!1,this.circle.position.copy', 'this.circle.visible=!0,this.circle.position.copy');
    content = content.replace('this.innerContainer.add(this.circle),this.circle.visible=!1', 'this.innerContainer.add(this.circle)');

    const endFragStart = content.indexOf('lineEndFrag=`#define GLSLIFY 1');
    if (endFragStart !== -1) {
      const endFragEnd = content.indexOf('`', endFragStart + 15);
      const newEndFrag = `lineEndFrag=\`#define GLSLIFY 1
varying vec3 v_color;varying vec2 v_uv;void main(){float d=length(v_uv-.5)*2.0;float glow=exp(-d*d*3.5);if(glow<0.02)discard;vec3 glowCol=mix(v_color,vec3(1.0),glow*0.4);gl_FragColor=vec4(glowCol,glow*0.8);}\``;
      content = content.slice(0, endFragStart) + newEndFrag + content.slice(endFragEnd + 1);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[${filePath}] Applied mode: ${mode}`);
  return true;
}

module.exports = { patchTipSolution };

if (require.main === module) {
  const mode = process.argv[2] || 'taper_clean';
  patchTipSolution('_astro/hoisted.CUO_IjfL.js', mode);
  patchTipSolution('dist/_astro/hoisted.CUO_IjfL.js', mode);
}
