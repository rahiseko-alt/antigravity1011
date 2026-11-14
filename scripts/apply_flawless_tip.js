const fs = require('fs');
const esbuild = require('esbuild');

function applyFlawlessTip(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. vert$j (Sleek aerodynamic teardrop leading edge)
  const vertStart = content.indexOf('vert$j=`#define GLSLIFY 1');
  if (vertStart === -1) {
    console.error(`[${filePath}] vert$j not found!`);
    return false;
  }
  const vertEnd = content.indexOf('`', vertStart + 15);
  const newVert = `vert$j=\`#define GLSLIFY 1
attribute vec3 CP;attribute float Cd;varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_scrollY;uniform vec2 u_viewportResolution;uniform vec2 u_aspect;uniform vec2 u_margin;uniform float u_radius;uniform float u_showRatio;void main(){float taperLen=0.035;float distToEnd=clamp((u_showRatio-position.z)/taperLen,0.0,1.0);float taper=pow(smoothstep(0.0,1.0,distToEnd),0.75);vec3 pos=vec3(CP.xy+position.xy*u_radius*taper,0.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_cd=Cd;v_lineRatio=position.z;v_s=CP.z;}\``;
  content = content.slice(0, vertStart) + newVert + content.slice(vertEnd + 1);

  // 2. frag$m (3D cylindrical shading + specular + rim + smooth tip anti-aliasing)
  const fragStart = content.indexOf('frag$m=`#define GLSLIFY 1');
  if (fragStart === -1) {
    console.error(`[${filePath}] frag$m not found!`);
    return false;
  }
  const fragEnd = content.indexOf('`', fragStart + 15);
  const newFrag = `frag$m=\`#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform float u_hideRatio;uniform vec3 u_colorBg;uniform vec3 u_color0;uniform vec3 u_color1;uniform float u_aoThreshold;float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}vec3 hsv2rgb(in vec3 c){vec3 rgb=clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);rgb=rgb*rgb*(3.0-2.0*rgb);return c.z*mix(vec3(1.0),rgb,c.y);}vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)),d/(q.x+e),q.x);}vec3 lerpHSV(in vec3 a,in vec3 b,in float x){float hue=(mod(mod((b.x-a.x),1.)+1.5,1.)-0.5)*x+a.x;return vec3(hue,mix(a.yz,b.yz,x));}void main(){float ao=0.9+0.1*v_cd;float aoRatio=linearStep(u_aoThreshold-0.02,u_aoThreshold+0.02,u_showRatio);if(step(u_showRatio,v_lineRatio)>0.5)discard;float mixRatio=1.0-pow(1.0-clamp(v_lineRatio,0.0,1.0),2.0);vec3 baseColor=hsv2rgb(lerpHSV(rgb2hsv(u_color1),rgb2hsv(u_color0),mixRatio));float t=(v_s-0.5)*2.0;float nz=sqrt(max(0.0,1.0-t*t));float diff=0.58+0.42*nz;vec3 n=vec3(t,0.0,nz);vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),26.0);float rim=pow(1.0-nz,3.0);vec3 rimColor=u_color0*(rim*0.28);float aoFactor=min(1.0,ao+1.0-aoRatio);vec3 shaded=(baseColor*diff+rimColor)*aoFactor+vec3(1.0)*(spec*0.38);gl_FragColor.rgb=shaded;float alpha=abs(v_s-.5);float edgeAlpha=linearStep(0.5,0.5-fwidth(alpha),alpha);float tipAlpha=smoothstep(0.0,0.002,u_showRatio-v_lineRatio);gl_FragColor.a=edgeAlpha*tipAlpha;}\``;
  content = content.slice(0, fragStart) + newFrag + content.slice(fragEnd + 1);

  // 3. Clean LINES_DATA_LIST and class Line
  const listStart = content.indexOf('LINES_DATA_LIST=[');
  const classEnd = content.indexOf('/*! @vimeo/player', listStart);
  if (listStart === -1 || classEnd === -1) {
    console.error(`[${filePath}] LINES_DATA_LIST or class Line not found!`);
    return false;
  }

  const cleanLinesBlock = `LINES_DATA_LIST=[{fileName:"line_reel",aoThreshold:.555,margin:{x:-0.02,y:-0.65},scrollToRatioFactors:[.4,1.3],boxMin:new Vector3(-.0112049,-.0141946,0),boxMax:new Vector3(1.01357,.718671,0),color0:"#00f0ff",color1:"#1d35ff"},{fileName:"line_goal",aoThreshold:1e-4,margin:{x:.2,y:-.6},scrollToRatioFactors:[1.2,2],boxMin:new Vector3(-.0180006,-.00963629,0),boxMax:new Vector3(1.01777,.850395,0),color0:"#94fffb",color1:"#1285dc"},{fileName:"line_capability",aoThreshold:1e-4,margin:{x:0,y:-1.15},scrollToRatioFactors:[0,2],boxMin:new Vector3(-.0165916,-.0152524,0),boxMax:new Vector3(1.018,1.08872,0),color0:"#fff",color1:"#bbb"},{fileName:"line_office",aoThreshold:1e-4,margin:{x:0,y:-2.2},boxMin:new Vector3(-.0131718,-.0141192,0),boxMax:new Vector3(1.01767,1.2037,0),scrollToRatioFactors:[-2,1.85],color0:"#fff",color1:"#bbb"}];class Line{container=new Object3D;innerContainer=new Object3D;geometry=new BufferGeometry;mesh=null;lineId=0;aoThreshold=.47;radius=0.0105;lineData=null;constructor(e=0){this.lineId=e,this.lineData=LINES_DATA_LIST[this.lineId]}preInit(){this.container.add(this.innerContainer),properties.loader.add(settings.MODEL_PATH+"lines/"+this.lineData.fileName+".buf",{onLoad:e=>{this.geometry=e,this.mesh&&(this.mesh.geometry=e);if(e&&e.attributes&&e.attributes.position){const{array:n,count:a}=e.attributes.position;this.lineRatioArray=new Float32Array(a);for(let l=0;l<a;l++)this.lineRatioArray[l]=n[l*3+2]}}})}init(){this.mesh=new Mesh(this.geometry,new ShaderMaterial({uniforms:{u_showRatio:{value:0},u_aoThreshold:{value:this.lineData.aoThreshold},u_colorBg:{value:new Color},u_color0:{value:new Color(this.lineData.color0)},u_color1:{value:new Color(this.lineData.color1)},u_scrollY:{value:0},u_radius:{value:0},u_aspect:{value:new Vector2},u_margin:{value:new Vector2(this.lineData.margin.x,this.lineData.margin.y)},u_viewportResolution:properties.sharedUniforms.u_viewportResolution},vertexShader:vert$j,fragmentShader:frag$m,depthTest:!1,transparent:!0})),this.mesh.frustumCulled=!1,this.mesh.material.defines.IS_LINE=!0,this.mesh.material.extensions.derivatives=!0,this.box=new Box3().setFromObject(this.mesh),this.innerContainer.add(this.mesh),this.circle=new Mesh(new PlaneGeometry(2,2),new ShaderMaterial({uniforms:{u_color0:{value:new Color(this.lineData.color0)},u_color1:{value:new Color(this.lineData.color1)},u_ao:{value:1},u_mixRatio:{value:0}},vertexShader:lineEndVert,fragmentShader:lineEndFrag,side:2,depthTest:!1,transparent:!0})),this.circle.material.extensions.derivatives=!0,this.circle.frustumCulled=!1,this.circle.visible=!1,this.innerContainer.add(this.circle);if(this.geometry&&this.geometry.attributes&&this.geometry.attributes.position){const{array:e,count:t}=this.geometry.attributes.position;this.lineRatioArray=new Float32Array(t);for(let r=0;r<t;r++)this.lineRatioArray[r]=e[r*3+2]}}resize(e,t){const r=t/Math.sqrt(e*e+t*t);this.mesh.material.uniforms.u_aspect.value.set(e/t*r,r)}update(e,t,r=0){let n=this.radius*math.fit(properties.viewportWidth,540,1920,1.85,1),a=math.saturate(-(t.screenY-this.lineData.scrollToRatioFactors[0]*properties.viewportHeight)/(this.lineData.scrollToRatioFactors[1]*properties.viewportHeight));a=ease.quadInOut(a);const l=t.screenY+r;let c=properties.viewportWidth/this.mesh.material.uniforms.u_aspect.value.x,u=properties.viewportHeight/this.mesh.material.uniforms.u_aspect.value.y;this.mesh.material.uniforms.u_showRatio.value=math.saturate(a),this.mesh.material.uniforms.u_scrollY.value=-l,this.mesh.material.uniforms.u_colorBg.value.copy(properties.bgColor),this.mesh.material.uniforms.u_radius.value=n,this.innerContainer.position.x=this.lineData.margin.x*c,this.innerContainer.position.y=this.lineData.margin.y*u-l,this.innerContainer.scale.x=c,this.innerContainer.scale.y=u,this.container.visible=!1,this.container.parent&&(this.container.parent.updateMatrixWorld(!0),_box.min.copy(this.lineData.boxMin),_box.max.copy(this.lineData.boxMax),_box.applyMatrix4(this.innerContainer.matrixWorld),this.container.visible=_box.max.y>-properties.viewportHeight&&_box.min.y<0);this.circle.visible=!1;if(!this.geometry||!this.geometry.attributes||!this.geometry.attributes.CP||!this.geometry.attributes.position||!this.lineRatioArray){this.container&&(this.container.visible=!1);return;}const{array:f,count:p}=this.geometry.attributes.CP,{array:g}=this.geometry.attributes.position;let v=0,_=0;for(let R=0;R<p;R++)a>=this.lineRatioArray[R]&&(v=R,R===p-1?_=0:_=(a-this.lineRatioArray[R])/(this.lineRatioArray[R+1]-this.lineRatioArray[R]));const T=v,M=Math.min(v+1,p-1);_v0$2.fromArray(f,v*3),_v1$5.fromArray(f,Math.min(p-1,v+1)*3),_v0$2.lerp(_v1$5,_);const S=this.geometry.attributes.Cd.array;let b=math.lerp(S[T],S[M],_);b=.9+.1*b;const C=math.linearStep(this.lineData.aoThreshold-.02,this.lineData.aoThreshold+.02,a);this.circle.position.copy(_v0$2),this.circle.scale.set(n,n,1),this.circle.material.uniforms.u_ao.value=Math.min(1,b+1-C);let w=math.lerp(g[T*3+2],g[M*3+2],_);w=1-Math.pow(1-math.clamp(w,0,1),2),this.circle.material.uniforms.u_mixRatio.value=w}}`;

  content = content.slice(0, listStart) + cleanLinesBlock + content.slice(classEnd);

  // 4. Validate syntax with esbuild before writing
  try {
    esbuild.transformSync(content, { loader: 'js' });
    console.log(`[${filePath}] ESBUILD SYNTAX VALIDATION PASSED!`);
  } catch (err) {
    console.error(`[${filePath}] ESBUILD VALIDATION FAILED:`, err.errors[0]);
    return false;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[${filePath}] Written successfully.`);
  return true;
}

console.log('--- Applying Flawless Tip to _astro/hoisted.CUO_IjfL.js ---');
applyFlawlessTip('_astro/hoisted.CUO_IjfL.js');

console.log('--- Applying Flawless Tip to dist/_astro/hoisted.CUO_IjfL.js ---');
applyFlawlessTip('dist/_astro/hoisted.CUO_IjfL.js');
