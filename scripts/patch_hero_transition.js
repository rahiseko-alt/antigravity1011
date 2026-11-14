const fs = require('fs');
const path = require('path');

function patchFile(filePath) {
  console.log('Patching hero transition in:', filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Update HomeBalloons.syncProperties:
  // Remove 0.3s delay, use cubicOut without backOut overshoot, finish by 1.8s
  const oldHB = 'syncProperties(e){this.properties.defaultCameraPosition.z=math.fit(homePage.time,.3,2,25,17.5,ease.backOut),this.properties.cameraDollyZoomFovOffset=math.fit(homePage.time,.3,3,100,0,ease.backOut)}';
  const newHB = 'syncProperties(e){this.properties.defaultCameraPosition.z=math.fit(homePage.time,0,1.8,25,17.5,ease.cubicOut),this.properties.cameraDollyZoomFovOffset=math.fit(homePage.time,0,1.8,100,0,ease.cubicOut)}';

  if (!content.includes(oldHB)) {
    throw new Error('oldHB target not found in ' + filePath);
  }
  content = content.replace(oldHB, newHB);
  console.log('✓ Patched HomeBalloons.syncProperties');

  // 2. Update HomeHeroSection._updateUi:
  // Let typography reveal start with homePage.time (not delayed by .35s)
  const oldUi = 'let t=Math.max(0,homePage.time-.35);for(let r=0;r<this.domHomeTitle._words.length;r++){';
  const newUi = 'let t=Math.max(0,homePage.time);for(let r=0;r<this.domHomeTitle._words.length;r++){';

  if (!content.includes(oldUi)) {
    throw new Error('oldUi target not found in ' + filePath);
  }
  content = content.replace(oldUi, newUi);
  console.log('✓ Patched HomeHeroSection._updateUi');

  // 3. Update Visuals.syncProperties veil dissolve:
  // Smooth ease-out of veil dissolve (ease.quadOut) so content is revealed while zoom is in full flight,
  // smooth bloom and page container fade-in, continuous background color
  const oldFade = 'const heroProgress=Math.min(1,Math.max(0,(r-tHoldEnd)/tHeroFade));_curtain.style.display="block",_curtain.style.opacity=(1-heroProgress).toFixed(4);this.currentStage3D=homeBalloons,homeBalloons.isActive=!0,homeBalloons.syncProperties(e);for(let k in homeBalloons.properties)properties[k]=homeBalloons.properties[k];properties.bloomAmount=math.mix(6,0,heroProgress),properties.bloomSaturation=math.mix(1.3,1,heroProgress),properties.haloStrength=math.mix(.1,0,heroProgress),properties.bloom.amount=properties.bloomAmount,properties.bloom.haloStrength=properties.haloStrength,properties.bgColor.setStyle(heroProgress<.2?"#ffffff":properties.offWhiteColorHex),properties.bgColorHex=heroProgress<.2?"#ffffff":properties.offWhiteColorHex;const pageCont=document.getElementById("page-container");pageCont&&(pageCont.style.opacity=heroProgress.toFixed(3));const hdr=document.getElementById("header");hdr&&(hdr.style.opacity=heroProgress.toFixed(3)),heroProgress>=.25&&typeof header!="undefined"&&header.show&&header.show();';
  
  const newFade = 'const heroProgress=Math.min(1,Math.max(0,(r-tHoldEnd)/tHeroFade));const veilEase=ease.quadOut(heroProgress);_curtain.style.display="block",_curtain.style.opacity=(1-veilEase).toFixed(4);this.currentStage3D=homeBalloons,homeBalloons.isActive=!0,homeBalloons.syncProperties(e);for(let k in homeBalloons.properties)properties[k]=homeBalloons.properties[k];properties.bloomAmount=math.mix(6,0,veilEase),properties.bloomSaturation=math.mix(1.3,1,veilEase),properties.haloStrength=math.mix(.1,0,veilEase),properties.bloom.amount=properties.bloomAmount,properties.bloom.haloStrength=properties.haloStrength,properties.bgColor.setStyle(properties.offWhiteColorHex),properties.bgColorHex=properties.offWhiteColorHex;const pageCont=document.getElementById("page-container");pageCont&&(pageCont.style.opacity=veilEase.toFixed(3));const hdr=document.getElementById("header");hdr&&(hdr.style.opacity=veilEase.toFixed(3)),heroProgress>=.25&&typeof header!="undefined"&&header.show&&header.show();';

  if (!content.includes(oldFade)) {
    throw new Error('oldFade target not found in ' + filePath);
  }
  content = content.replace(oldFade, newFade);
  console.log('✓ Patched Visuals.syncProperties veil dissolve');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully saved ' + filePath);
}

try {
  patchFile(path.join(__dirname, '../_astro/hoisted.CUO_IjfL.js'));
  if (fs.existsSync(path.join(__dirname, '../dist/_astro/hoisted.CUO_IjfL.js'))) {
    patchFile(path.join(__dirname, '../dist/_astro/hoisted.CUO_IjfL.js'));
  }
  console.log('All hero transition patches applied successfully!');
} catch (err) {
  console.error('Error applying patches:', err);
  process.exit(1);
}
