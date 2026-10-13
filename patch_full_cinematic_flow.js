const fs = require('fs');

let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

// Ensure GoalTunnelGlass container is added to goalTunnels and properly rendered
// And ensure camera looks down the tunnel (0, 0, 24)
const oldBlackLookAt = 'goalTunnels.properties.defaultLookAtPosition.set(0,0,0)';
if (code.includes(oldBlackLookAt)) {
  code = code.replaceAll(oldBlackLookAt, 'goalTunnels.properties.defaultLookAtPosition.set(0,0,24)');
  console.log('Updated lookAt position to (0, 0, 24) down the tunnel');
}

// Ensure background color in glass shatter phase keeps dark background for chromatic glass refraction
// before exploding into pure white flash
const oldBgInGlass = 'properties.bgColor.setStyle("#fff"),properties.bgColorHex="#ffffff",goalTunnelEfx.isActive=gProgress<0.4';
const newBgInGlass = 'properties.bgColor.setStyle(gProgress<0.6?"#000":"#fff"),properties.bgColorHex=gProgress<0.6?"#000000":"#ffffff",goalTunnelEfx.isActive=gProgress<0.4';

if (code.includes(oldBgInGlass)) {
  code = code.replace(oldBgInGlass, newBgInGlass);
  console.log('Updated background color in glass shatter phase');
}

// Also ensure intro-whiteout overlay is fully opaque white during climax (gProgress >= 0.65 or r between 2.2 and 2.5)
const oldWhiteoutCheck = 'let whiteout=document.getElementById("intro-whiteout");whiteout||(whiteout=document.createElement("div"),whiteout.id="intro-whiteout"';
if (code.includes(oldWhiteoutCheck)) {
  // Good, whiteout creation is present
  console.log('whiteout overlay logic present');
}

fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
if (fs.existsSync('dist/_astro/hoisted.CUO_IjfL.js')) {
  fs.writeFileSync('dist/_astro/hoisted.CUO_IjfL.js', code, 'utf8');
}
console.log('Successfully patched _astro/hoisted.CUO_IjfL.js!');
