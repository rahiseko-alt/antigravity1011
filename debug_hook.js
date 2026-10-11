const fs = require('fs');
let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

// Replace the previous (non-working) homeBalloons mount block with a debug hook exposing module internals
const start = code.indexOf("  try {\n    if (typeof homeBalloons !== 'undefined'");
if (start === -1) { console.log('MOUNT_BLOCK_NOT_FOUND'); process.exit(0); }
const end = code.indexOf("} catch(e) { console.error(e); }", start) + "} catch(e) { console.error(e); }".length;

const rep = `  try {
    window.__lusion = { visuals, cameraControls, properties, homePage, Box3, Vector3, model };
  } catch(e) { console.error(e); }`;

code = code.substring(0, start) + rep + code.substring(end);
fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
console.log('DEBUG_HOOK_INSTALLED');
