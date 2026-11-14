const fs = require('fs');

function patchAnalyticalDome(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. vert$j (clean, full extrusion so fragment shader has full domain to carve the dome)
  const vertStart = content.indexOf('vert$j=`#define GLSLIFY 1');
  if (vertStart === -1) {
    console.error(`[${filePath}] vert$j not found!`);
    return false;
  }
  const vertEnd = content.indexOf('`', vertStart + 15);
  const newVert = `vert$j=\`#define GLSLIFY 1
attribute vec3 CP;attribute float Cd;varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_scrollY;uniform vec2 u_viewportResolution;uniform vec2 u_aspect;uniform vec2 u_margin;uniform float u_radius;void main(){vec3 pos=vec3(CP.xy+position.xy*u_radius,0.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_cd=Cd;v_lineRatio=position.z;v_s=CP.z;}\``;
  content = content.slice(0, vertStart) + newVert + content.slice(vertEnd + 1);

  // 2. frag$m (mathematically exact 3D spherical dome cap)
  const fragStart = content.indexOf('frag$m=`#define GLSLIFY 1');
  if (fragStart === -1) {
    console.error(`[${filePath}] frag$m not found!`);
    return false;
  }
  const fragEnd = content.indexOf('`', fragStart + 15);
  const newFrag = `frag$m=\`#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform float u_hideRatio;uniform vec3 u_colorBg;uniform vec3 u_color0;uniform vec3 u_color1;uniform float u_aoThreshold;uniform float u_radius;float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}vec3 hsv2rgb(in vec3 c){vec3 rgb=clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);rgb=rgb*rgb*(3.0-2.0*rgb);return c.z*mix(vec3(1.0),rgb,c.y);}vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)),d/(q.x+e),q.x);}vec3 lerpHSV(in vec3 a,in vec3 b,in float x){float hue=(mod(mod((b.x-a.x),1.)+1.5,1.)-0.5)*x+a.x;return vec3(hue,mix(a.yz,b.yz,x));}void main(){if(step(u_showRatio,v_lineRatio)>0.5)discard;float capLen=max(0.006,u_radius*0.62);float d=clamp((u_showRatio-v_lineRatio)/capLen,0.0,1.0);float roundWidth=0.5*sqrt(max(0.0,1.0-(1.0-d)*(1.0-d)));float distFromCenter=abs(v_s-0.5);if(distFromCenter>roundWidth)discard;float ao=0.9+0.1*v_cd;float aoRatio=linearStep(u_aoThreshold-0.02,u_aoThreshold+0.02,u_showRatio);float mixRatio=1.0-pow(1.0-clamp(v_lineRatio,0.0,1.0),2.0);vec3 baseColor=hsv2rgb(lerpHSV(rgb2hsv(u_color1),rgb2hsv(u_color0),mixRatio));float localT=clamp((v_s-0.5)/max(0.0001,roundWidth),-1.0,1.0);float ny=-(1.0-d);float nz=sqrt(max(0.0,1.0-localT*localT-ny*ny));vec3 n=vec3(localT,ny,nz);float diff=0.58+0.42*nz;vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),26.0);float rim=pow(1.0-nz,3.0);vec3 rimColor=u_color0*(rim*0.28);float aoFactor=min(1.0,ao+1.0-aoRatio);vec3 shaded=(baseColor*diff+rimColor)*aoFactor+vec3(1.0)*(spec*0.38);gl_FragColor.rgb=shaded;float alpha=linearStep(roundWidth,roundWidth-fwidth(distFromCenter),distFromCenter);gl_FragColor.a=alpha;}\``;
  content = content.slice(0, fragStart) + newFrag + content.slice(fragEnd + 1);

  // 3. Ensure this.circle is hidden
  const addCircle = 'this.innerContainer.add(this.circle)';
  if (content.indexOf(addCircle) !== -1 && !content.includes('this.circle.visible=!1')) {
    content = content.replace(addCircle, 'this.innerContainer.add(this.circle),this.circle.visible=!1');
  }
  const circleUpdate = 'this.circle.position.copy(_v0$2)';
  if (content.indexOf(circleUpdate) !== -1 && !content.includes('this.circle.visible=!1,this.circle.position.copy')) {
    content = content.replace(circleUpdate, 'this.circle.visible=!1,this.circle.position.copy(_v0$2)');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[${filePath}] Analytical 3D spherical dome applied.`);
  return true;
}

patchAnalyticalDome('_astro/hoisted.CUO_IjfL.js');
patchAnalyticalDome('dist/_astro/hoisted.CUO_IjfL.js');
