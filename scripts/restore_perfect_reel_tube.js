const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Exact string replace for LINES_DATA_LIST[0]
const oldReelItem = `{fileName:"line_reel",aoThreshold:.555,margin:{x:-.05,y:-.8},scrollToRatioFactors:[.3,1.3],boxMin:new Vector3(-.0112049,-.0141946,0),boxMax:new Vector3(1.01357,.718671,0),color0:"#00ebff",color1:"#00ebff"}`;
const newReelItem = `{fileName:"line_reel",aoThreshold:.555,margin:{x:-.05,y:-.8},scrollToRatioFactors:[.9,.7],boxMin:new Vector3(-.0112049,-.0141946,0),boxMax:new Vector3(1.01357,.718671,0),color0:"#00ebff",color1:"#00ebff"}`;

if (!code.includes(oldReelItem)) {
  console.error('oldReelItem not found!');
  process.exit(1);
}
code = code.replace(oldReelItem, newReelItem);
console.log('1. LINES_DATA_LIST[0] replaced successfully.');

// 2. Line constructor radius
code = code.replace(/radius=0\.01\d*;/, 'radius=0.016;');
console.log('2. Line radius set to 0.016.');

// 3. Locate and replace Line.prototype.update
const updateSignature = 'update(e,t,r=0){';
const updateStart = code.indexOf(updateSignature);
if (updateStart === -1) {
  console.error('updateSignature not found!');
  process.exit(1);
}

const vimeoIdx = code.indexOf('/*! @vimeo/player', updateStart);
if (vimeoIdx === -1) {
  console.error('Vimeo marker not found!');
  process.exit(1);
}

const newUpdateMethod = `update(e,t,r=0){
  if(this.lineId===0) window.__line0=this;
  let n=this.radius*math.fit(properties.viewportWidth,540,1920,2,1);
  let a=math.saturate(-(t.screenY-this.lineData.scrollToRatioFactors[0]*properties.viewportHeight)/(this.lineData.scrollToRatioFactors[1]*properties.viewportHeight));
  a=ease.quadInOut(a);
  const l=t.screenY+r;
  let c=properties.viewportWidth/this.mesh.material.uniforms.u_aspect.value.x,u=properties.viewportHeight/this.mesh.material.uniforms.u_aspect.value.y;
  this.mesh.material.uniforms.u_showRatio.value=math.saturate(a);
  this.mesh.material.uniforms.u_scrollY.value=-l;
  this.mesh.material.uniforms.u_colorBg.value.copy(properties.bgColor);
  this.mesh.material.uniforms.u_radius.value=n;
  this.innerContainer.position.x=this.lineData.margin.x*c;
  this.innerContainer.position.y=this.lineData.margin.y*u-l;
  this.innerContainer.scale.x=c;
  this.innerContainer.scale.y=u;
  this.container.visible=!1;
  this.container.parent && (
    this.container.parent.updateMatrixWorld(!0),
    _box.min.copy(this.lineData.boxMin),
    _box.max.copy(this.lineData.boxMax),
    _box.applyMatrix4(this.innerContainer.matrixWorld),
    this.container.visible=_box.max.y>-properties.viewportHeight && _box.min.y<0
  );
  if(!this.geometry || !this.geometry.attributes || !this.geometry.attributes.CP || !this.geometry.attributes.position || !this.lineRatioArray){
    this.container && (this.container.visible=!1);
    return;
  }
  const{array:f,count:p}=this.geometry.attributes.CP,{array:g}=this.geometry.attributes.position;
  let v=0,_=0;
  for(let R=0;R<p;R++) a>=this.lineRatioArray[R] && (v=R,R===p-1 ? _=0 : _=(a-this.lineRatioArray[R])/(this.lineRatioArray[R+1]-this.lineRatioArray[R]));
  const T=v,M=Math.min(v+1,p-1);
  _v0$2.fromArray(f,v*3),_v1$5.fromArray(f,Math.min(p-1,v+1)*3),_v0$2.lerp(_v1$5,_);
  this.circle.position.copy(_v0$2);
  this.circle.scale.set(n*1.3,n*1.3,1);
  this.circle.material.uniforms.u_lineRatio.value=a;
  this.circle.material.uniforms.u_cd.value=a;
  this.circle.visible=(a>0.001 && a<0.999);
  let w=math.lerp(g[T*3+2],g[M*3+2],_);
  w=1-Math.pow(1-math.clamp(w,0,1),2);
  this.circle.material.uniforms.u_mixRatio.value=w;
}}`;

code = code.substring(0, updateStart) + newUpdateMethod + code.substring(vimeoIdx);

// Validate with esbuild
try {
  esbuild.transformSync(code, { minify: false });
  console.log('Syntax validation PASSED!');
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully written to _astro/hoisted.CUO_IjfL.js');
} catch (err) {
  console.error('Syntax validation FAILED:', err);
  process.exit(1);
}
