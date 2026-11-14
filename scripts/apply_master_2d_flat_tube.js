const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('=== APPLYING MASTER 2D FLAT TUBE & COMPANION TRAJECTORY ===');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Restore vert$j: uniform strokeThick = 1.3
const cpIdx = code.indexOf('attribute vec3 CP;');
if (cpIdx === -1) {
  console.error('attribute vec3 CP; not found!');
  process.exit(1);
}
const vertAssignStart = code.lastIndexOf('`', cpIdx);
const vertEndIdx = code.indexOf('}`,frag$m=', cpIdx);

const newVertBody = `#define GLSLIFY 1\nattribute vec3 CP;attribute float Cd;varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_scrollY;uniform vec2 u_viewportResolution;uniform vec2 u_aspect;uniform vec2 u_margin;uniform float u_radius;uniform float u_showRatio;void main(){float strokeThick=1.3;vec3 pos=vec3(CP.xy+position.xy*(u_radius*strokeThick),0.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_cd=Cd;v_lineRatio=position.z;v_s=CP.z;}`;
code = code.slice(0, vertAssignStart + 1) + newVertBody + code.slice(vertEndIdx);
console.log('1. vert$j restored to uniform strokeThick 1.3');

// 2. Restore frag$m: pure 2D flat solid color (no lighting, no specular, no normal)
const fragAssignStart = code.indexOf('frag$m=`');
const fragBodyStart = fragAssignStart + 'frag$m=`'.length;
const fragEndIdx = code.indexOf('}`,lineEndVert=', fragBodyStart);

const newFragBody = `#define GLSLIFY 1\nvarying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform vec3 u_color0;vec3 getTubeColor(float t){t=clamp(t,0.0,1.0);vec3 c_cyan=vec3(0.00,0.92,1.00);vec3 c_blue=vec3(0.06,0.38,1.00);vec3 c_red=vec3(1.00,0.12,0.24);vec3 c_yellow=vec3(1.00,0.85,0.00);vec3 c_green=vec3(0.00,0.88,0.36);vec3 c_purple=vec3(0.68,0.12,1.00);vec3 c_orange=vec3(1.00,0.48,0.04);if(t<0.18){return mix(c_cyan,c_blue,t/0.18);}else if(t<0.36){return mix(c_red,c_orange,(t-0.18)/0.18);}else if(t<0.54){return mix(c_yellow,c_green,(t-0.36)/0.18);}else if(t<0.72){return mix(c_green,c_purple,(t-0.54)/0.18);}else{return mix(c_purple,c_cyan,(t-0.72)/0.28);}}void main(){if(step(u_showRatio,v_lineRatio)>0.5)discard;vec3 color=getTubeColor(v_lineRatio);float dist=abs(v_s-0.5)*2.0;float alpha=1.0-smoothstep(1.0-fwidth(dist),1.0,dist);gl_FragColor=vec4(color,alpha);}`;
code = code.slice(0, fragBodyStart) + newFragBody + code.slice(fragEndIdx);
console.log('2. frag$m restored to pure 2D flat solid color');

// 3. Restore lineEndFrag: pure 2D flat round cap
const endFragAssignStart = code.indexOf('lineEndFrag=`');
const endFragBodyStart = endFragAssignStart + 'lineEndFrag=`'.length;
const endFragEndIdx = code.indexOf('}`,_v0$2=', endFragBodyStart);

const newLineEndFragBody = `#define GLSLIFY 1\nuniform float u_cd;uniform float u_lineRatio;varying vec2 v_uv;vec3 getTubeColor(float t){t=clamp(t,0.0,1.0);vec3 c_cyan=vec3(0.00,0.92,1.00);vec3 c_blue=vec3(0.06,0.38,1.00);vec3 c_red=vec3(1.00,0.12,0.24);vec3 c_yellow=vec3(1.00,0.85,0.00);vec3 c_green=vec3(0.00,0.88,0.36);vec3 c_purple=vec3(0.68,0.12,1.00);vec3 c_orange=vec3(1.00,0.48,0.04);if(t<0.18){return mix(c_cyan,c_blue,t/0.18);}else if(t<0.36){return mix(c_red,c_orange,(t-0.18)/0.18);}else if(t<0.54){return mix(c_yellow,c_green,(t-0.36)/0.18);}else if(t<0.72){return mix(c_green,c_purple,(t-0.54)/0.18);}else{return mix(c_purple,c_cyan,(t-0.72)/0.28);}}void main(){float d=length(v_uv-0.5)*2.0;if(d>1.0)discard;vec3 color=getTubeColor(u_lineRatio);float alpha=1.0-smoothstep(1.0-fwidth(d),1.0,d);gl_FragColor=vec4(color,alpha);}`;
code = code.slice(0, endFragBodyStart) + newLineEndFragBody + code.slice(endFragEndIdx);
console.log('3. lineEndFrag restored to pure 2D flat round cap');

// 4. Restore Line.prototype.update with companion scroll positioning for line 0
const lineClassIdx = code.indexOf('class Line{');
const updateIdx = code.indexOf('update(e,t,r=0){', lineClassIdx);
const vimeoIdx = code.indexOf('/*! @vimeo/player', updateIdx);
// The last '}' before vimeoIdx belongs to class Line, the one before belongs to update()
const updateClosingBrace = vimeoIdx - 1; // replaces up to the second '}'

const newUpdateMethod = `update(e,t,r=0){if(this.lineId===0)window.__line0=this;let n=this.radius*math.fit(properties.viewportWidth,540,1920,1.85,1.0),a;const s=scrollManager.scrollPixel,isMob=properties.viewportWidth<768;if(this.lineId===0){const startS=isMob?350:700,endS=6200;if(s<=startS)a=0;else if(s>=endS)a=1;else{const tr=(s-startS)/(endS-startS);a=tr*tr*(3.0-2.0*tr);}}else{a=ease.quadInOut(math.saturate(-(t.screenY-this.lineData.scrollToRatioFactors[0]*properties.viewportHeight)/(this.lineData.scrollToRatioFactors[1]*properties.viewportHeight)));}const l=t.screenY+r,hypot=Math.hypot(properties.viewportWidth,properties.viewportHeight);let c=hypot,u=hypot;this.mesh.material.uniforms.u_showRatio.value=math.saturate(a),this.mesh.material.uniforms.u_scrollY.value=-l,this.mesh.material.uniforms.u_colorBg.value.copy(properties.bgColor),this.mesh.material.uniforms.u_radius.value=n;this.innerContainer.position.x=this.lineId===0?(isMob?properties.viewportWidth*0.06:0):this.lineData.margin.x*c;this.innerContainer.position.y=this.lineId===0?(0.5*s+0.5*((0.78+4.57*a)*u-0.45*properties.viewportHeight)):this.lineData.margin.y*u-l;this.innerContainer.scale.x=c;this.innerContainer.scale.y=u;this.container.visible=!1;this.container.parent&&(this.container.parent.updateMatrixWorld(!0),_box.min.copy(this.lineData.boxMin),_box.max.copy(this.lineData.boxMax),_box.applyMatrix4(this.innerContainer.matrixWorld),this.container.visible=this.lineId===0?(s>=(isMob?300:600)&&s<=6600):(_box.max.y>-properties.viewportHeight&&_box.min.y<0));if(!this.geometry||!this.geometry.attributes||!this.geometry.attributes.CP||!this.geometry.attributes.position||!this.lineRatioArray){this.container&&(this.container.visible=!1);return;}const{array:f,count:p}=this.geometry.attributes.CP,{array:g}=this.geometry.attributes.position;let v=0,_=0;for(let R=0;R<p;R++)a>=this.lineRatioArray[R]&&(v=R,R===p-1?_=0:_=(a-this.lineRatioArray[R])/(this.lineRatioArray[R+1]-this.lineRatioArray[R]));const T=v,M=Math.min(v+1,p-1);_v0$2.fromArray(f,v*3),_v1$5.fromArray(f,Math.min(p-1,v+1)*3),_v0$2.lerp(_v1$5,_);this.circle.position.copy(_v0$2);this.circle.scale.set(n*1.3,n*1.3,1);this.circle.material.uniforms.u_lineRatio.value=a;this.circle.material.uniforms.u_cd.value=a;this.circle.visible=(this.lineId===0?(s>=(isMob?320:650)&&a>0.001&&a<0.999):(a>0.001&&a<0.999));let w=math.lerp(g[T*3+2],g[M*3+2],_);w=1-Math.pow(1-math.clamp(w,0,1),2),this.circle.material.uniforms.u_mixRatio.value=w;}`;

code = code.slice(0, updateIdx) + newUpdateMethod + code.slice(updateClosingBrace);
console.log('4. Line.prototype.update restored to mathematical companion scroll pacing');

// 5. Update LINES_DATA_LIST boxMax to ensure full screen coverage
const boxNeedle = 'boxMin:new Vector3(-0.4000,-8.0000,-0.5000),boxMax:new Vector3(0.4000,0.5000,0.5000)';
const newBox = 'boxMin:new Vector3(-0.4000,-8.0000,-0.5000),boxMax:new Vector3(1.2000,1.2000,0.5000)';
if (code.includes(boxNeedle)) {
  code = code.replace(boxNeedle, newBox);
  console.log('5. Bounding box max extended to 1.20 for safe frustum culling');
}

// 6. Validate with esbuild
console.log('Validating with esbuild.transformSync...');
esbuild.transformSync(code, { loader: 'js' });
console.log('Validation PASSED: 0 errors!');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully written to _astro/hoisted.CUO_IjfL.js');
