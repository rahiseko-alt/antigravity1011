const fs = require('fs');
const esbuild = require('esbuild');

console.log('=== CALIBRATING EXACT SCROLL LIFESPAN IN HOISTED JS ===');

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Match and replace scrollFactor in Line.update
  const aRegex = /a=this\.lineId===0\?math\.saturate\(scrollManager\.scrollPixel\/\([^)]+\*properties\.viewportHeight\)\)/;
  const newA = 'a=this.lineId===0?math.saturate(scrollManager.scrollPixel/((properties.viewportWidth<768?4.1:3.5)*properties.viewportHeight))';
  
  if (aRegex.test(content)) {
    content = content.replace(aRegex, newA);
    console.log(`[${filePath}] Updated scroll calculation denominator to (4.1 mobile, 3.5 desktop).`);
  }

  // Match and replace container.visible
  const visRegex = /this\.container\.visible=this\.lineId===0\?\(scrollManager\.scrollPixel<[^)]+\*properties\.viewportHeight\):/;
  const newVis = 'this.container.visible=this.lineId===0?(scrollManager.scrollPixel<(properties.viewportWidth<768?6.5:5.5)*properties.viewportHeight):';

  if (visRegex.test(content)) {
    content = content.replace(visRegex, newVis);
    console.log(`[${filePath}] Updated container visibility threshold to (6.5 mobile, 5.5 desktop).`);
  }

  try {
    esbuild.transformSync(content, { loader: 'js' });
    fs.writeFileSync(filePath, content, 'utf8');
    const now = new Date();
    fs.utimesSync(filePath, now, now);
    console.log(`[PASS] ${filePath} verified.`);
  } catch (err) {
    console.error(`[ERROR] esbuild syntax error in ${filePath}:`, err.message);
    process.exit(1);
  }
}

patchFile('_astro/hoisted.CUO_IjfL.js');
patchFile('dist/_astro/hoisted.CUO_IjfL.js');
