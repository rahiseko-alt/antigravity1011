const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('=== CALIBRATING EXACT STROKE 2 PROGRESSION & CLEAN 2D POSITIONING ===');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

const lineClassIdx = code.indexOf('class Line{');
const updateIdx = code.indexOf('update(e,t,r=0){', lineClassIdx);
const vimeoIdx = code.indexOf('/*! @vimeo/player', updateIdx);
const updateClosingBrace = vimeoIdx - 1;

const newUpdateMethod = `update(e,t,r=0){if(this.lineId===0)window.__line0=this;let n=this.radius*math.fit(properties.viewportWidth,540,1920,1.85,1.0),a;const s=scrollManager.scrollPixel,isMob=properties.viewportWidth<768;if(this.lineId===0){const K=isMob?[[250,0.00],[380,0.16],[560,0.24],[760,0.32],[1200,0.50],[2400,0.68],[3800,0.84],[5500,1.00]]:[[400,0.00],[650,0.16],[950,0.24],[1350,0.32],[2200,0.50],[3400,0.68],[4600,0.84],[6000,1.00]];if(s<=K[0][0])a=0;else if(s>=K[K.length-1][0])a=1.0;else{for(let i=0;i<K.length-1;i++){if(s>=K[i][0]&&s<K[i+1][0]){const tr=(s-K[i][0])/(K[i+1][0]-K[i][0]);const st=tr*tr*(3.0-2.0*tr);a=K[i][1]+(K[i+1][1]-K[i][1])*st;break;}}}}else{a=ease.quadInOut(math.saturate(-(t.screenY-this.lineData.scrollToRatioFactors[0]*properties.viewportHeight)/(this.lineData.scrollToRatioFactors[1]*properties.viewportHeight)));}const l=t.screenY+r,hypot=Math.hypot(properties.viewportWidth,properties.viewportHeight);let c=hypot,u=hypot;this.mesh.material.uniforms.u_showRatio.value=math.saturate(a),this.mesh.material.uniforms.u_scrollY.value=-l,this.mesh.material.uniforms.u_colorBg.value.copy(properties.bgColor),this.mesh.material.uniforms.u_radius.value=n;this.innerContainer.position.x=this.lineId===0?(isMob?properties.viewportWidth*0.04:0):this.lineData.margin.x*c;this.innerContainer.position.y=this.lineId===0?(isMob?(u*0.96-l):(0.5*s+0.5*((0.78+4.57*a)*u-0.45*properties.viewportHeight))):this.lineData.margin.y*u-l;this.innerContainer.scale.x=c;this.innerContainer.scale.y=u;this.container.visible=!1;this.container.parent&&(this.container.parent.updateMatrixWorld(!0),_box.min.copy(this.lineData.boxMin),_box.max.copy(this.lineData.boxMax),_box.applyMatrix4(this.innerContainer.matrixWorld),this.container.visible=this.lineId===0?(s>=(isMob?250:500)&&s<=6600):(_box.max.y>-properties.viewportHeight&&_box.min.y<0));if(!this.geometry||!this.geometry.attributes||!this.geometry.attributes.CP||!this.geometry.attributes.position||!this.lineRatioArray){this.container&&(this.container.visible=!1);return;}const{array:f,count:p}=this.geometry.attributes.CP,{array:g}=this.geometry.attributes.position;let v=0,_=0;for(let R=0;R<p;R++)a>=this.lineRatioArray[R]&&(v=R,R===p-1?_=0:_=(a-this.lineRatioArray[R])/(this.lineRatioArray[R+1]-this.lineRatioArray[R]));const T=v,M=Math.min(v+1,p-1);_v0$2.fromArray(f,v*3),_v1$5.fromArray(f,Math.min(p-1,v+1)*3),_v0$2.lerp(_v1$5,_);this.circle.position.copy(_v0$2);this.circle.scale.set(n*1.3,n*1.3,1);this.circle.material.uniforms.u_lineRatio.value=a;this.circle.material.uniforms.u_cd.value=a;this.circle.visible=(this.lineId===0?(s>=(isMob?270:550)&&a>0.001&&a<0.999):(a>0.001&&a<0.999));let w=math.lerp(g[T*3+2],g[M*3+2],_);w=1-Math.pow(1-math.clamp(w,0,1),2),this.circle.material.uniforms.u_mixRatio.value=w;}`;

code = code.slice(0, updateIdx) + newUpdateMethod + code.slice(updateClosingBrace);

// Validate with esbuild
console.log('Validating with esbuild.transformSync...');
esbuild.transformSync(code, { loader: 'js' });
console.log('Validation PASSED: 0 errors!');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully saved calibrated Line.prototype.update to _astro/hoisted.CUO_IjfL.js');
