const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('=== TUNING MOBILE PROGRESSION AND TUBE VISIBILITY ===');

const filesToPatch = [
  path.resolve('_astro/hoisted.CUO_IjfL.js'),
  path.resolve('dist/_astro/hoisted.CUO_IjfL.js')
];

const exactOldACalc = `if(this.lineId===0){const s=scrollManager.scrollPixel,isMob=properties.viewportWidth<768,s0=isMob?550:750,s1=isMob?1300:1600,s2=isMob?2200:2600,s3=isMob?3200:4000,s4=isMob?4300:5400,s5=isMob?6500:6800;if(s<=s0)a=0;else if(s<s1){const t=(s-s0)/(s1-s0);a=0.32*t*t*(3.0-2.0*t)}else if(s<s2){const t=(s-s1)/(s2-s1);a=0.32+0.18*t*t*(3.0-2.0*t)}else if(s<s3){const t=(s-s2)/(s3-s2);a=0.50+0.18*t*t*(3.0-2.0*t)}else if(s<s4){const t=(s-s3)/(s4-s3);a=0.68+0.16*t*t*(3.0-2.0*t)}else if(s<s5){const t=(s-s4)/(s5-s4);a=0.84+0.16*t*t*(3.0-2.0*t)}else a=1.0}`;

const exactNewACalc = `if(this.lineId===0){const s=scrollManager.scrollPixel;if(properties.viewportWidth<768){const mK=[[550,0],[1200,0.18],[1800,0.30],[2400,0.44],[2900,0.58],[3400,0.70],[3800,0.78],[4300,0.84],[4900,0.89],[5500,0.94],[6100,0.98],[6500,1.0]];if(s<=mK[0][0])a=0;else if(s>=mK[mK.length-1][0])a=1.0;else{for(let i=0;i<mK.length-1;i++){if(s>=mK[i][0]&&s<mK[i+1][0]){const t=(s-mK[i][0])/(mK[i+1][0]-mK[i][0]);a=mK[i][1]+(mK[i+1][1]-mK[i][1])*t;break;}}}}else{const s0=750,s1=1600,s2=2600,s3=4000,s4=5400,s5=6800;if(s<=s0)a=0;else if(s<s1){const t=(s-s0)/(s1-s0);a=0.32*t*t*(3.0-2.0*t)}else if(s<s2){const t=(s-s1)/(s2-s1);a=0.32+0.18*t*t*(3.0-2.0*t)}else if(s<s3){const t=(s-s2)/(s3-s2);a=0.50+0.18*t*t*(3.0-2.0*t)}else if(s<s4){const t=(s-s3)/(s4-s3);a=0.68+0.16*t*t*(3.0-2.0*t)}else if(s<s5){const t=(s-s4)/(s5-s4);a=0.84+0.16*t*t*(3.0-2.0*t)}else a=1.0}}`;

const exactOldTargetY = `let _mobTargetY=properties.viewportHeight*(0.54+0.06*Math.sin(a*Math.PI*4.0));if(scrollManager.scrollPixel<800)_mobTargetY=math.fit(scrollManager.scrollPixel,550,800,properties.viewportHeight*0.25,_mobTargetY);else if(scrollManager.scrollPixel>6450)_mobTargetY-=(scrollManager.scrollPixel-6450)*0.85;`;

const exactNewTargetY = `let _mobTargetY=properties.viewportHeight*(0.58+0.08*Math.sin(a*Math.PI*4.0));if(scrollManager.scrollPixel<800)_mobTargetY=math.fit(scrollManager.scrollPixel,550,800,properties.viewportHeight*0.28,_mobTargetY);else if(scrollManager.scrollPixel>6450)_mobTargetY-=(scrollManager.scrollPixel-6450)*0.85;`;

for (const filePath of filesToPatch) {
  console.log(`\nProcessing file: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes(exactOldACalc)) {
    console.error(`ERROR: exactOldACalc not found in ${filePath}!`);
    process.exit(1);
  }
  content = content.replace(exactOldACalc, exactNewACalc);
  console.log('1. Replaced exact a progression curve.');

  if (!content.includes(exactOldTargetY)) {
    console.error(`ERROR: exactOldTargetY not found in ${filePath}!`);
    process.exit(1);
  }
  content = content.replace(exactOldTargetY, exactNewTargetY);
  console.log('2. Replaced exact _mobTargetY.');

  // Validate with esbuild
  console.log('Validating with esbuild.transformSync...');
  esbuild.transformSync(content, { loader: 'js' });
  console.log('Validation PASSED!');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully saved: ${filePath}`);
}

console.log('\n=== ALL FILES SUCCESSFULLY TUNED ===');
