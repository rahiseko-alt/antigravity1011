const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

async function fixAndVerify(filePath) {
  console.log('=== Fixing and verifying:', filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix return}return}
  if (content.includes('return}return}this.currentStage3D')) {
    content = content.replace('return}return}this.currentStage3D', 'return}this.currentStage3D');
    console.log('  -> Removed duplicate return}');
  }

  // Verify with esbuild
  try {
    await esbuild.transform(content, { loader: 'js' });
    console.log('  -> esbuild transform SUCCESS: 100% valid JavaScript syntax!');
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (err) {
    console.error('  -> esbuild error:', err.message);
    process.exit(1);
  }
}

(async () => {
  await fixAndVerify(path.join(__dirname, '_astro/hoisted.CUO_IjfL.js'));
  const distPath = path.join(__dirname, 'dist/_astro/hoisted.CUO_IjfL.js');
  if (fs.existsSync(distPath)) {
    await fixAndVerify(distPath);
  }
  console.log('=== All files valid and verified! ===');
})();
