const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('=== APPLYING PERFECT SECTION-SYNCHRONIZED LIFESPAN IN HOISTED JS ===');

const filesToPatch = [
  path.resolve('_astro/hoisted.CUO_IjfL.js'),
  path.resolve('dist/_astro/hoisted.CUO_IjfL.js')
];

for (const filePath of filesToPatch) {
  if (!fs.existsSync(filePath)) continue;
  console.log(`\nProcessing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace a calculation in Line.update
  // Search for `let a=this.lineId===0?`
  const aIdx = content.indexOf('let a=this.lineId===0?');
  if (aIdx === -1) throw new Error(`a calculation not found in ${filePath}`);
  
  const endAIdx = content.indexOf(';a=this.lineId===0?a:ease.quadInOut(a);', aIdx);
  if (endAIdx === -1) throw new Error(`end of a calculation not found in ${filePath}`);

  // Piecewise smooth section-synchronized progress:
  // Mobile (viewportWidth < 768): S=1250 gives a=0.42 (Green loop!), S=2400 gives a=0.62, S=3800 gives a=0.80, S=5800 gives 1.00
  // Desktop: S=1400 gives a=0.42, S=2600 gives a=0.62, S=4200 gives a=0.80, S=5800 gives 1.00
  const syncLogic = `let S=scrollManager.scrollPixel,mS=properties.viewportWidth<768,k1=mS?1250:1400,k2=mS?2400:2600,k3=mS?3800:4200,k4=5800;let a=this.lineId===0?math.saturate(S<=k1?math.fit(S,0,k1,0,0.42):S<=k2?math.fit(S,k1,k2,0.42,0.62):S<=k3?math.fit(S,k2,k3,0.62,0.80):math.fit(S,k3,k4,0.80,1.0)):math.saturate(-(t.screenY-this.lineData.scrollToRatioFactors[0]*properties.viewportHeight)/(this.lineData.scrollToRatioFactors[1]*properties.viewportHeight))`;

  content = content.slice(0, aIdx) + syncLogic + content.slice(endAIdx);

  // Update container.visible to persist until S = 6400px (Goal)
  const visIdx = content.indexOf('this.container.visible=this.lineId===0?');
  if (visIdx !== -1) {
    const endVisIdx = content.indexOf('):(_box.max.y>-properties.viewportHeight&&_box.min.y<0)', visIdx);
    if (endVisIdx !== -1) {
      const newVis = `this.container.visible=this.lineId===0?(scrollManager.scrollPixel<(properties.viewportWidth<768?6600:6200))`;
      content = content.slice(0, visIdx) + newVis + content.slice(endVisIdx + 1);
    }
  }

  // Validate syntax
  esbuild.transformSync(content, { loader: 'js' });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated and validated ${filePath}`);
}

console.log('\n=== ALL FILES SUCCESSFULLY UPDATED WITH SECTION-SYNCHRONIZED LIFESPAN ===');
