const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('=== APPLYING PERFECT MOBILE TUBE REPLACEMENT ===');

const filesToPatch = [
  path.resolve('_astro/hoisted.CUO_IjfL.js'),
  path.resolve('dist/_astro/hoisted.CUO_IjfL.js')
];

const exactNeedle = `this.mesh.material.uniforms.u_radius.value=n,this.innerContainer.position.x=this.lineId===0?(properties.viewportWidth<768?-0.225*c:0):this.lineData.margin.x*c,this.innerContainer.position.y=this.lineId===0?((0.78+4.92*a)*u-0.15*properties.viewportHeight):this.lineData.margin.y*u-l,this.innerContainer.scale.x=this.lineId===0?(properties.viewportWidth<768?c*0.45:c):c,this.innerContainer.scale.y=u,`;

const exactReplacement = `this.mesh.material.uniforms.u_radius.value=n;let _mobTipY=-(0.78+4.92*a);if(this.lineId===0&&properties.viewportWidth<768&&this.geometry&&this.geometry.attributes&&this.geometry.attributes.CP&&this.lineRatioArray){const _cp=this.geometry.attributes.CP.array,_cnt=this.geometry.attributes.CP.count;let _v=0,__=0;for(let R=0;R<_cnt;R++)a>=this.lineRatioArray[R]&&(_v=R,R===_cnt-1?__=0:__=(a-this.lineRatioArray[R])/(this.lineRatioArray[R+1]-this.lineRatioArray[R]));_mobTipY=_cp[_v*3+1]*(1-__)+_cp[Math.min(_cnt-1,_v+1)*3+1]*__;}let _mobTargetY=properties.viewportHeight*(0.54+0.06*Math.sin(a*Math.PI*4.0));if(scrollManager.scrollPixel<800)_mobTargetY=math.fit(scrollManager.scrollPixel,550,800,properties.viewportHeight*0.25,_mobTargetY);else if(scrollManager.scrollPixel>6450)_mobTargetY-=(scrollManager.scrollPixel-6450)*0.85;this.innerContainer.position.x=this.lineId===0?(properties.viewportWidth<768?0.112*properties.viewportWidth:0):this.lineData.margin.x*c;this.innerContainer.position.y=this.lineId===0?(properties.viewportWidth<768?(-_mobTipY*u-_mobTargetY):((0.78+4.92*a)*u-0.15*properties.viewportHeight)):this.lineData.margin.y*u-l;this.innerContainer.scale.x=this.lineId===0&&(properties.viewportWidth<768)?c*0.68:c;this.innerContainer.scale.y=u,`;

const circleScaleNeedle = `this.circle.scale.set(n*strokeThick,n*strokeThick,1);`;
const newCircleScale = `this.circle.scale.set(n*strokeThick/(this.lineId===0&&(properties.viewportWidth<768)?0.68:1.0),n*strokeThick,1);`;

for (const filePath of filesToPatch) {
  console.log(`\nProcessing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes(exactNeedle)) {
    console.error(`ERROR: exactNeedle not found in ${filePath}!`);
    process.exit(1);
  }
  content = content.replace(exactNeedle, exactReplacement);
  console.log('1. Replaced exact position & width containment transform.');

  if (content.includes(circleScaleNeedle)) {
    content = content.replace(circleScaleNeedle, newCircleScale);
    console.log('2. Preserved round circle tip.');
  } else {
    console.log('2. Circle scale already updated or variant.');
  }

  // Validate with esbuild
  console.log('Validating with esbuild.transformSync...');
  esbuild.transformSync(content, { loader: 'js' });
  console.log('Validation PASSED!');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully saved: ${filePath}`);
}

console.log('\n=== ALL FILES SUCCESSFULLY UPDATED AND VALIDATED ===');
