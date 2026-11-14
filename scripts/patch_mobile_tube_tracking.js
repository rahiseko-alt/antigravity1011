const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('=== PATCHING MOBILE TUBE TRACKING AND SCREEN WIDTH OPTIMIZATION ===');

const filesToPatch = [
  path.resolve('_astro/hoisted.CUO_IjfL.js'),
  path.resolve('dist/_astro/hoisted.CUO_IjfL.js')
];

for (const filePath of filesToPatch) {
  console.log(`\nProcessing file: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace a calculation (smooth monotonic progression on mobile)
  const aNeedle = `if(this.lineId===0){const s=scrollManager.scrollPixel;if(properties.viewportWidth<768){if(s<=550)a=0;else if(s<1500){const t=(s-550)/950;a=0.24*t*t*(3.0-2.0*t)}else if(s<2600){const t=(s-1500)/1100;a=0.24+0.24*t*t*(3.0-2.0*t)}else if(s<3900){const t=(s-2600)/1300;a=0.48+0.24*t*t*(3.0-2.0*t)}else if(s<4350){const t=(s-3900)/450;a=0.72+0.07*t*t*(3.0-2.0*t)}else if(s<6450){const t=(s-4350)/2100;a=0.79+0.20*t*t*(3.0-2.0*t)}else a=1.0}else{const s0=750,s1=1600,s2=2600,s3=4000,s4=5400,s5=6800;if(s<=s0)a=0;else if(s<s1){const t=(s-s0)/(s1-s0);a=0.32*t*t*(3.0-2.0*t)}else if(s<s2){const t=(s-s1)/(s2-s1);a=0.32+0.18*t*t*(3.0-2.0*t)}else if(s<s3){const t=(s-s2)/(s3-s2);a=0.50+0.18*t*t*(3.0-2.0*t)}else if(s<s4){const t=(s-s3)/(s4-s3);a=0.68+0.16*t*t*(3.0-2.0*t)}else if(s<s5){const t=(s-s4)/(s5-s4);a=0.84+0.16*t*t*(3.0-2.0*t)}else a=1.0}}`;
  
  if (!content.includes(aNeedle)) {
    console.error(`ERROR: aNeedle not found in ${filePath}!`);
    process.exit(1);
  }
  console.log('1. Verified a progression curve.');

  // 2. Replace innerContainer transform
  const posNeedle = `this.mesh.material.uniforms.u_radius.value=n;let _mobTipY=-(0.78+4.92*a);if(this.lineId===0&&properties.viewportWidth<768&&this.geometry&&this.geometry.attributes&&this.geometry.attributes.CP&&this.lineRatioArray){const _cp=this.geometry.attributes.CP.array,_cnt=this.geometry.attributes.CP.count;let _v=0,__=0;for(let R=0;R<_cnt;R++)a>=this.lineRatioArray[R]&&(_v=R,R===_cnt-1?__=0:__=(a-this.lineRatioArray[R])/(this.lineRatioArray[R+1]-this.lineRatioArray[R]));_mobTipY=_cp[_v*3+1]*(1-__)+_cp[Math.min(_cnt-1,_v+1)*3+1]*__;}let _mobTargetY=properties.viewportHeight*(0.48+0.08*Math.sin(a*Math.PI*6.0));if(scrollManager.scrollPixel<800)_mobTargetY=math.fit(scrollManager.scrollPixel,550,800,properties.viewportHeight*0.20,_mobTargetY);else if(scrollManager.scrollPixel>6450)_mobTargetY-=(scrollManager.scrollPixel-6450)*0.85;this.innerContainer.position.x=this.lineId===0?(properties.viewportWidth<768?-0.06*properties.viewportWidth:0):this.lineData.margin.x*c;this.innerContainer.position.y=this.lineId===0?(properties.viewportWidth<768?(-_mobTipY*u-_mobTargetY):(0.5*scrollManager.scrollPixel+0.5*((0.78+4.92*a)*u-0.45*properties.viewportHeight))):this.lineData.margin.y*u-l,this.innerContainer.scale.x=c,this.innerContainer.scale.y=u,`;

  const newPosTransform = `this.mesh.material.uniforms.u_radius.value=n;let _mobTipY=-(0.78+4.92*a);if(this.lineId===0&&properties.viewportWidth<768&&this.geometry&&this.geometry.attributes&&this.geometry.attributes.CP&&this.lineRatioArray){const _cp=this.geometry.attributes.CP.array,_cnt=this.geometry.attributes.CP.count;let _v=0,__=0;for(let R=0;R<_cnt;R++)a>=this.lineRatioArray[R]&&(_v=R,R===_cnt-1?__=0:__=(a-this.lineRatioArray[R])/(this.lineRatioArray[R+1]-this.lineRatioArray[R]));_mobTipY=_cp[_v*3+1]*(1-__)+_cp[Math.min(_cnt-1,_v+1)*3+1]*__;}let _mobTargetY=properties.viewportHeight*(0.54+0.06*Math.sin(a*Math.PI*4.0));if(scrollManager.scrollPixel<800)_mobTargetY=math.fit(scrollManager.scrollPixel,550,800,properties.viewportHeight*0.25,_mobTargetY);else if(scrollManager.scrollPixel>6450)_mobTargetY-=(scrollManager.scrollPixel-6450)*0.85;this.innerContainer.position.x=this.lineId===0?(properties.viewportWidth<768?0.112*properties.viewportWidth:0):this.lineData.margin.x*c;this.innerContainer.position.y=this.lineId===0?(properties.viewportWidth<768?(-_mobTipY*u-_mobTargetY):((0.78+4.92*a)*u-0.15*properties.viewportHeight)):this.lineData.margin.y*u-l;this.innerContainer.scale.x=this.lineId===0&&(properties.viewportWidth<768)?c*0.68:c;this.innerContainer.scale.y=u,`;

  if (!content.includes(posNeedle)) {
    console.error(`ERROR: posNeedle not found in ${filePath}!`);
    process.exit(1);
  }
  content = content.replace(posNeedle, newPosTransform);
  console.log('2. Patched position and width containment transform for mobile.');

  // 3. Keep circle tip perfectly round when innerContainer.scale.x is scaled
  const circleScaleNeedle = `this.circle.scale.set(n*strokeThick,n*strokeThick,1);`;
  const newCircleScale = `this.circle.scale.set(n*strokeThick/(this.lineId===0&&(properties.viewportWidth<768)?0.68:1.0),n*strokeThick,1);`;

  if (!content.includes(circleScaleNeedle)) {
    console.error(`ERROR: circleScaleNeedle not found in ${filePath}!`);
    process.exit(1);
  }
  content = content.replace(circleScaleNeedle, newCircleScale);
  console.log('3. Preserved round circle tip aspect ratio.');

  // Validate with esbuild
  console.log('Validating with esbuild.transformSync...');
  esbuild.transformSync(content, { loader: 'js' });
  console.log('Validation PASSED!');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully saved: ${filePath}`);
}

console.log('\n=== ALL FILES SUCCESSFULLY PATCHED ===');
