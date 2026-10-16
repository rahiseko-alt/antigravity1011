const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('=== APPLYING FLAWLESS SECTION-SYNCHRONIZED PROGRESS IN HOISTED JS ===');

const filesToPatch = [
  path.resolve('_astro/hoisted.CUO_IjfL.js'),
  path.resolve('dist/_astro/hoisted.CUO_IjfL.js')
];

for (const filePath of filesToPatch) {
  if (!fs.existsSync(filePath)) continue;
  console.log(`\nProcessing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace a calculation
  // Target: a=this.lineId===0?math.saturate(scrollManager.scrollPixel/((properties.viewportWidth<768?...)*properties.viewportHeight)):math.saturate(-(t.screenY-this.lineData.scrollToRatioFactors[0]*properties.viewportHeight)/(this.lineData.scrollToRatioFactors[1]*properties.viewportHeight));
  const oldAPattern = /a=this\.lineId===0\?math\.saturate\(scrollManager\.scrollPixel\/\(\(properties\.viewportWidth<768\?[^)]+\)\*properties\.viewportHeight\)\):math\.saturate\(-\(t\.screenY-this\.lineData\.scrollToRatioFactors\[0\]\*properties\.viewportHeight\)\/\(this\.lineData\.scrollToRatioFactors\[1\]\*properties\.viewportHeight\)\);/;
  
  // Section-synchronized progress curve:
  // S <= 1350: fit 0..1350 -> 0.00..0.44 (Covers Stroke 1 & Stroke 2, and draws Stroke 3 Green Loop right at S=1350!)
  // S <= 2400: fit 1350..2400 -> 0.44..0.64 (Stroke 4 Cards 1&2 Purple Wave)
  // S <= 3800: fit 2400..3800 -> 0.64..0.82 (Stroke 5 Cards 3&4 Gold S-Curve)
  // S <= 5600: fit 3800..5600 -> 0.82..1.00 (Stroke 6 Members & Goal Aurora Wave)
  const newA = `a=this.lineId===0?math.saturate(scrollManager.scrollPixel<=1350?math.fit(scrollManager.scrollPixel,0,1350,0,0.44):scrollManager.scrollPixel<=2400?math.fit(scrollManager.scrollPixel,1350,2400,0.44,0.64):scrollManager.scrollPixel<=3800?math.fit(scrollManager.scrollPixel,2400,3800,0.64,0.82):math.fit(scrollManager.scrollPixel,3800,5600,0.82,1)):math.saturate(-(t.screenY-this.lineData.scrollToRatioFactors[0]*properties.viewportHeight)/(this.lineData.scrollToRatioFactors[1]*properties.viewportHeight));`;

  if (!oldAPattern.test(content)) {
    throw new Error(`oldAPattern did not match in ${filePath}`);
  }
  content = content.replace(oldAPattern, newA);
  console.log(`[PASS] Updated progress curve in ${filePath}`);

  // Update container.visible
  const visPattern = /this\.container\.visible=this\.lineId===0\?\(scrollManager\.scrollPixel<[^)]+\):/;
  const newVis = 'this.container.visible=this.lineId===0?(scrollManager.scrollPixel<6200):';
  if (visPattern.test(content)) {
    content = content.replace(visPattern, newVis);
    console.log(`[PASS] Updated container.visible in ${filePath}`);
  }

  // Validate with esbuild
  esbuild.transformSync(content, { loader: 'js' });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Saved and validated: ${filePath}`);
}

console.log('\n=== ALL FILES SUCCESSFULLY PATCHED ===');
