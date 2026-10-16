const fs = require('fs');
const esbuild = require('esbuild');

console.log('=== HARMONIZING TUBE BODY AND TIP CIRCLE ===');

const files = [
  '_astro/hoisted.CUO_IjfL.js',
  'dist/_astro/hoisted.CUO_IjfL.js'
];

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. In frag$m: Remove capLen discard that caused double-dome protrusion
  const targetFragOld = 'float t=(v_s-0.5)*2.0;float L=u_showRatio-v_lineRatio;float capLen=max(0.002,u_radius*0.21)*strokeThick;vec3 n;float nz;float capAlpha=1.0;if(L<capLen){float dy=1.0-(L/capLen);float d2=t*t+dy*dy;if(d2>1.0)discard;float d=sqrt(d2);nz=sqrt(max(0.0,1.0-d2));float tangentSign=1.0;n=normalize(vec3(t,dy*tangentSign,nz));float fw=max(0.0001,fwidth(d));capAlpha=linearStep(1.0,1.0-fw,d);}else{nz=sqrt(max(0.0,1.0-t*t));n=vec3(t,0.0,nz);}';
  
  const targetFragNew = 'float t=(v_s-0.5)*2.0;float nz=sqrt(max(0.0,1.0-t*t));vec3 n=vec3(t,0.0,nz);float capAlpha=1.0;';

  if (!content.includes(targetFragOld)) {
    throw new Error('targetFragOld not found in ' + filePath);
  }
  content = content.replace(targetFragOld, targetFragNew);
  console.log('Replaced double capLen discard in', filePath);

  // 2. Validate with esbuild
  esbuild.transformSync(content, { loader: 'js' });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Validated and saved:', filePath);
}

console.log('=== HARMONIZATION COMPLETE ===');
