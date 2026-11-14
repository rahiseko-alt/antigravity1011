const fs = require('fs');
let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

// 1. Fix Task.createCallbackFunc to handle undefined or non-function gracefully
const oldTask = 'createCallbackFunc(e){let t;return this._completeTotal++,e.isRawShaderMaterial||e.isShaderMaterial?t=this.createShaderMaterialFunc(e):e.isObject3D?t=this.createCompileSceneFunc(e):e.isTexture?t=this.createInitTextureFunc(e):t=e.bind(this,this._onComplete),t}';
const newTask = 'createCallbackFunc(e){if(!e)return()=>{this._onComplete()};let t;return this._completeTotal++,e.isRawShaderMaterial||e.isShaderMaterial?t=this.createShaderMaterialFunc(e):e.isObject3D?t=this.createCompileSceneFunc(e):e.isTexture?t=this.createInitTextureFunc(e):t=typeof e==="function"?e.bind(this,this._onComplete):()=>{this._onComplete()},t}';

console.log('Task match:', code.includes(oldTask));
if (code.includes(oldTask)) {
  code = code.replace(oldTask, newTask);
}

// 2. Fix LineVisual.init() geometry destructure
const oldLineInit = 'this.circle.frustumCulled=!1,this.innerContainer.add(this.circle);const{array:e,count:t}=this.geometry.attributes.position;this.lineRatioArray=new Float32Array(this.geometry.attributes.position.count);for(let r=0;r<t;r++)this.lineRatioArray[r]=e[r*3+2]}';
const newLineInit = 'this.circle.frustumCulled=!1,this.innerContainer.add(this.circle);if(this.geometry&&this.geometry.attributes&&this.geometry.attributes.position){const{array:e,count:t}=this.geometry.attributes.position;this.lineRatioArray=new Float32Array(t);for(let r=0;r<t;r++)this.lineRatioArray[r]=e[r*3+2]}}';

console.log('LineInit match:', code.includes(oldLineInit));
if (code.includes(oldLineInit)) {
  code = code.replace(oldLineInit, newLineInit);
}

// 3. Fix LineVisual.update() geometry destructure
const oldLineUpdate = 'const{array:f,count:p}=this.geometry.attributes.CP,{array:g}=this.geometry.attributes.position;let v=0,_=0;';
const newLineUpdate = 'if(!this.geometry||!this.geometry.attributes||!this.geometry.attributes.CP||!this.geometry.attributes.position||!this.lineRatioArray){this.container&&(this.container.visible=!1);return;}const{array:f,count:p}=this.geometry.attributes.CP,{array:g}=this.geometry.attributes.position;let v=0,_=0;';

console.log('LineUpdate match:', code.includes(oldLineUpdate));
if (code.includes(oldLineUpdate)) {
  code = code.replace(oldLineUpdate, newLineUpdate);
}

// 4. Ensure LineVisual loader onLoad updates lineRatioArray
const oldLineLoad = 'properties.loader.add(settings.MODEL_PATH+"lines/"+this.lineData.fileName+".buf",{onLoad:e=>this.geometry=e})';
const newLineLoad = 'properties.loader.add(settings.MODEL_PATH+"lines/"+this.lineData.fileName+".buf",{onLoad:e=>{this.geometry=e;if(e&&e.attributes&&e.attributes.position){const{array:n,count:a}=e.attributes.position;this.lineRatioArray=new Float32Array(a);for(let l=0;l<a;l++)this.lineRatioArray[l]=n[l*3+2]}}})';

console.log('LineLoad match:', code.includes(oldLineLoad));
if (code.includes(oldLineLoad)) {
  code = code.replace(oldLineLoad, newLineLoad);
}

fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
console.log('Successfully written patched _astro/hoisted.CUO_IjfL.js!');
