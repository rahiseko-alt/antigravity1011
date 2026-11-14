const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Locate Line.prototype.update
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
  let n=this.radius*math.fit(properties.viewportWidth,540,1920,1.85,1.0),a;
  if(this.lineId===0){
    const s=scrollManager.scrollPixel;
    const isMob=properties.viewportWidth<768;
    if(isMob){
      if(s<=350) a=0;
      else if(s>=5500) a=1.0;
      else if(s<950){
        const d=(s-350)/(950-350);
        a=0.20*d*d*(3.0-2.0*d);
      } else if(s<2200){
        const d=(s-950)/(2200-950);
        a=0.20+0.25*d*d*(3.0-2.0*d);
      } else if(s<3600){
        const d=(s-2200)/(3600-2200);
        a=0.45+0.25*d*d*(3.0-2.0*d);
      } else {
        const d=(s-3600)/(5500-3600);
        a=0.70+0.30*d*d*(3.0-2.0*d);
      }
    } else {
      if(s<=750) a=0;
      else if(s>=5800) a=1.0;
      else if(s<1500){
        const d=(s-750)/(1500-750);
        a=0.20*d*d*(3.0-2.0*d);
      } else if(s<2600){
        const d=(s-1500)/(2600-1500);
        a=0.20+0.25*d*d*(3.0-2.0*d);
      } else if(s<3900){
        const d=(s-2600)/(3900-2600);
        a=0.45+0.25*d*d*(3.0-2.0*d);
      } else {
        const d=(s-3900)/(5800-3900);
        a=0.70+0.30*d*d*(3.0-2.0*d);
      }
    }
  } else {
    a=ease.quadInOut(math.saturate(-(t.screenY-this.lineData.scrollToRatioFactors[0]*properties.viewportHeight)/(this.lineData.scrollToRatioFactors[1]*properties.viewportHeight)));
  }
  const l=t.screenY+r,hypot=Math.hypot(properties.viewportWidth,properties.viewportHeight);
  let c=hypot,u=hypot;
  this.mesh.material.uniforms.u_showRatio.value=math.saturate(a);
  this.mesh.material.uniforms.u_scrollY.value=-l;
  this.mesh.material.uniforms.u_colorBg.value.copy(properties.bgColor);
  this.mesh.material.uniforms.u_radius.value=n;
  this.innerContainer.position.x=this.lineId===0 ? 0 : this.lineData.margin.x*c;
  this.innerContainer.position.y=this.lineId===0 ? (0.5*scrollManager.scrollPixel + 0.5*((0.78 + 4.57*a)*u - 0.45*properties.viewportHeight)) : (this.lineData.margin.y*u - l);
  this.innerContainer.scale.x=c;
  this.innerContainer.scale.y=u;
  this.container.visible=!1;
  this.container.parent && (
    this.container.parent.updateMatrixWorld(!0),
    _box.min.copy(this.lineData.boxMin),
    _box.max.copy(this.lineData.boxMax),
    _box.applyMatrix4(this.innerContainer.matrixWorld),
    this.container.visible=this.lineId===0 ? (scrollManager.scrollPixel>=(properties.viewportWidth<768?350:700) && scrollManager.scrollPixel<=6500) : (_box.max.y>-properties.viewportHeight && _box.min.y<0)
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
