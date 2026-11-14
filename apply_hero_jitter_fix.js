const fs = require('fs');
const path = require('path');

function patchFile(filePath) {
  console.log('Patching:', filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Fix syncProperties
  const oldSyncStart = content.indexOf('syncProperties(e){if(properties.isIntroWarp){');
  const oldSyncEnd = content.indexOf('this.currentStage3D=this.defaultStage3D;', oldSyncStart);

  if (oldSyncStart === -1 || oldSyncEnd === -1) {
    throw new Error('syncProperties not found in ' + filePath);
  }

  const newSyncProperties = `syncProperties(e){if(properties.isIntroWarp){let _curtain=document.getElementById("intro-whiteout");if(!_curtain){_curtain=document.createElement("div");_curtain.id="intro-whiteout";_curtain.style.cssText="position:fixed;inset:0;background:#ffffff;z-index:99999;pointer-events:none;transition:none;opacity:0;display:none;";document.body.appendChild(_curtain)}window.__introWhiteout=_curtain;if(!goalTunnels.hasIntroInitialized){goalTunnels.hasIntroInitialized=!0,goalTunnels.introStartTime=performance.now(),goalTunnels.hasResetHeroPhysics=!1,scrollManager.isActive=!1,scrollManager.scrollY=0,scrollManager.targetY=0,input.lastScrollYDirection=1,document.body.style.overflow="hidden",document.documentElement.classList.add("is-black-bg"),document.body.style.backgroundColor="#000000";const _oldB=document.getElementById("intro-blackout");_oldB&&_oldB.remove();const o=document.getElementById("page-container");o&&(o.style.opacity="0");const t=document.getElementById("header");t&&(t.style.opacity="0",t.style.pointerEvents="none");typeof transitionOverlay!="undefined"&&(transitionOverlay.contentShowRatio=1,transitionOverlay.canvas&&(transitionOverlay.canvas.style.display="none"));if(!homeGoalSectionRanges.items.blackTunnel||!homeGoalSectionRanges.items.blackTunnel.pixelCount||homeGoalSectionRanges.totalPixelCount===0){typeof homeGoalSection!="undefined"&&homeGoalSection.resize?homeGoalSection.resize(properties.width,properties.height):homeGoalSectionRanges.resize(properties.width,properties.height)}goalTunnels.frameHeight=properties.viewportHeight}const r=(performance.now()-goalTunnels.introStartTime)/1e3;const _h=document.getElementById("header");_h&&(_h.style.opacity="0");const _p=document.getElementById("page-container");_p&&(_p.style.opacity="0");const tBlack=3.20,tWhite=.80,tWarpEnd=tBlack+tWhite,tWhiteHold=.80,tHoldEnd=tWarpEnd+tWhiteHold,tHeroFade=1.00,tIntroEnd=tHoldEnd+tHeroFade;if(r<tBlack){_curtain.style.display="none",_curtain.style.opacity="0";const bFrom=homeGoalSectionRanges.items.blackTunnel.pixelFrom,bTo=homeGoalSectionRanges.items.blackTunnel.pixelTo,progress=Math.min(1,Math.max(0,r/tBlack)),scrubOffset=bFrom+progress*(bTo-bFrom);homeGoalSectionRanges.offsetY=scrubOffset,homeGoalSectionRanges.update(e),this.currentStage3D=goalTunnels,goalTunnels.isActive=!0,goalTunnels.updateRatios(),goalTunnels.syncProperties(e);for(let k in goalTunnels.properties)properties[k]=goalTunnels.properties[k];properties.bgColorHex="#000000",properties.bgColor.setStyle("#000000");return}if(r<tWarpEnd){const wProgress=Math.min(1,Math.max(0,(r-tBlack)/tWhite)),wFrom=homeGoalSectionRanges.items.whiteTunnel.pixelFrom,wTo=homeGoalSectionRanges.items.whiteFrameOut.pixelTo,scrubOffset=wFrom+wProgress*(wTo-wFrom);homeGoalSectionRanges.offsetY=scrubOffset,homeGoalSectionRanges.update(e),this.currentStage3D=goalTunnels,goalTunnels.isActive=!0,goalTunnels.updateRatios(),goalTunnels.syncProperties(e);for(let k in goalTunnels.properties)properties[k]=goalTunnels.properties[k];properties.bgColorHex="#ffffff",properties.bgColor.setStyle("#ffffff"),_curtain.style.display="block",_curtain.style.opacity=wProgress.toFixed(4);return}if(!goalTunnels.hasResetHeroPhysics){goalTunnels.hasResetHeroPhysics=!0,goalTunnels.isActive=!1,goalTunnels.isBlackTitleActive=!1,goalTunnels.isBlackTunnelActive=!1,goalTunnels.isWhiteTunnelActive=!1,goalBlackTunnel.container.visible=!1,goalWhiteTunnel.container.visible=!1,goalTunnelGlass.container&&(goalTunnelGlass.container.visible=!1),goalTunnelGlass.ratio=0,goalTunnelEfx.isActive=!1,goalTunnelEfx.amount=0,goalTunnelEfx.offsetPostion.set(0,0,0),goalTunnelEfx.offsetRotation.set(0,0,0),goalTunnelEfx.offsetScale.set(1,1,1),goalTunnelEfx.needsSync=!0,properties.bgColor.setStyle(properties.offWhiteColorHex),properties.bgColorHex=properties.offWhiteColorHex,document.documentElement.classList.remove("is-black-bg"),document.documentElement.classList.add("is-white-bg"),homeBalloons.isActive=!0,this.currentStage3D=homeBalloons,homePage.time=0,homeBalloons.syncProperties(e);for(let k in homeBalloons.properties)properties[k]=homeBalloons.properties[k];homeBalloonsPhysics.reset(),homeBalloonsPhysics.bodies.forEach(b=>b.applyImpulse()),homeBalloons.updateColor()}if(r<tHoldEnd){_curtain.style.display="block",_curtain.style.opacity="1";this.currentStage3D=homeBalloons,homeBalloons.isActive=!0,homeBalloons.syncProperties(e);for(let k in homeBalloons.properties)properties[k]=homeBalloons.properties[k];properties.bloomAmount=6,properties.bloomSaturation=1.3,properties.haloStrength=.1,properties.bloom.amount=properties.bloomAmount,properties.bloom.haloStrength=properties.haloStrength,properties.bgColor.setStyle(properties.offWhiteColorHex),properties.bgColorHex=properties.offWhiteColorHex;return}const heroProgress=Math.min(1,Math.max(0,(r-tHoldEnd)/tHeroFade));_curtain.style.display="block",_curtain.style.opacity=(1-heroProgress).toFixed(4);this.currentStage3D=homeBalloons,homeBalloons.isActive=!0,homeBalloons.syncProperties(e);for(let k in homeBalloons.properties)properties[k]=homeBalloons.properties[k];properties.bloomAmount=math.mix(6,0,heroProgress),properties.bloomSaturation=math.mix(1.3,1,heroProgress),properties.haloStrength=math.mix(.1,0,heroProgress),properties.bloom.amount=properties.bloomAmount,properties.bloom.haloStrength=properties.haloStrength,properties.bgColor.setStyle(heroProgress<.2?"#ffffff":properties.offWhiteColorHex),properties.bgColorHex=heroProgress<.2?"#ffffff":properties.offWhiteColorHex;const pageCont=document.getElementById("page-container");pageCont&&(pageCont.style.opacity=heroProgress.toFixed(3));const hdr=document.getElementById("header");hdr&&(hdr.style.opacity=heroProgress.toFixed(3)),heroProgress>=.25&&typeof header!="undefined"&&header.show&&header.show();if(r>=tIntroEnd){_curtain&&(_curtain.style.opacity="0",_curtain.style.display="none"),properties.isIntroWarp=!1,properties.bloomAmount=0,properties.haloStrength=0,properties.bloom.amount=0,properties.bloom.haloStrength=0,properties.bgColor.setStyle(properties.offWhiteColorHex),properties.bgColorHex=properties.offWhiteColorHex,scrollManager.isActive=!0,scrollManager.scrollY=0,scrollManager.targetY=0,document.body.style.overflow="",pageCont&&(pageCont.style.opacity="1",pageCont.style.transition=""),hdr&&(hdr.style.opacity="1",hdr.style.transition=""),typeof header!="undefined"&&header.show&&header.show()}return}`;

  content = content.slice(0, oldSyncStart) + newSyncProperties + content.slice(oldSyncEnd);

  // 2. Fix homeHeroSection.update(e)
  const oldHeroSec = 'homeBalloons.ratio=math.fit(this.sectionDomRange.ratio,0,1,1,0)*(t?1:0),homeBalloons.isActive=homeBalloons.ratio>0&&!properties.isIntroWarp,this.frameMesh.visible=t&&!properties.isIntroWarp';
  const newHeroSec = 'homeBalloons.ratio=math.fit(this.sectionDomRange.ratio,0,1,1,0)*(t?1:0),homeBalloons.isActive=properties.isIntroWarp?(goalTunnels.hasResetHeroPhysics===!0):(homeBalloons.ratio>0),this.frameMesh.visible=properties.isIntroWarp?(goalTunnels.hasResetHeroPhysics===!0&&t):t';

  if (!content.includes(oldHeroSec)) {
    throw new Error('oldHeroSec not found in ' + filePath);
  }
  content = content.replace(oldHeroSec, newHeroSec);

  // 3. Fix HomePage.update(e)
  const oldHomeTime = 'properties.isIntroWarp&&(this.time=0)';
  const newHomeTime = 'properties.isIntroWarp&&(this.time=(typeof goalTunnels!="undefined"&&goalTunnels.introStartTime)?Math.max(0,(performance.now()-goalTunnels.introStartTime)/1e3-4.80):0)';

  if (!content.includes(oldHomeTime)) {
    throw new Error('oldHomeTime not found in ' + filePath);
  }
  content = content.replace(oldHomeTime, newHomeTime);

  // 4. Fix HomeBalloons.update(e) delta time clamping
  const oldHBUpdate = 'update(e){if(this.isReady){if(homeBalloonsBackground.update(e),homeBalloonsPhysics.update(e)';
  const newHBUpdate = 'update(e){if(this.isReady){e=Math.min(Math.max(e,.001),.033);if(homeBalloonsBackground.update(e),homeBalloonsPhysics.update(e)';

  if (!content.includes(oldHBUpdate)) {
    throw new Error('oldHBUpdate not found in ' + filePath);
  }
  content = content.replace(oldHBUpdate, newHBUpdate);

  // 5. Fix HomeBalloonsPhysics.update(e) delta time clamping
  const oldHBPUpdate = 'update(e){if(!this.isActive)return;_p1$1.set(input.mouseXY.x,input.mouseXY.y,.5)';
  const newHBPUpdate = 'update(e){if(!this.isActive)return;e=Math.min(Math.max(e,.001),.033);_p1$1.set(input.mouseXY.x,input.mouseXY.y,.5)';

  if (!content.includes(oldHBPUpdate)) {
    throw new Error('oldHBPUpdate not found in ' + filePath);
  }
  content = content.replace(oldHBPUpdate, newHBPUpdate);

  // 6. Fix HomeBalloonsBody.updateGravity and update delta time clamping
  const oldBodyGravity = 'updateGravity(e){this.gravityForce.copy(this.position).negate().multiplyScalar(GRAVITY_FACTOR)';
  const newBodyGravity = 'updateGravity(e){e=Math.min(Math.max(e,.001),.033);this.gravityForce.copy(this.position).negate().multiplyScalar(GRAVITY_FACTOR)';

  if (!content.includes(oldBodyGravity)) {
    throw new Error('oldBodyGravity not found in ' + filePath);
  }
  content = content.replace(oldBodyGravity, newBodyGravity);

  const oldBodyUpdate = 'update(e){this.position.addScaledVector(this.velocity,e),this.velocity.multiplyScalar(Math.pow(.2,e))}';
  const newBodyUpdate = 'update(e){e=Math.min(Math.max(e,.001),.033);this.position.addScaledVector(this.velocity,e),this.velocity.multiplyScalar(Math.pow(.2,e))}';

  if (!content.includes(oldBodyUpdate)) {
    throw new Error('oldBodyUpdate not found in ' + filePath);
  }
  content = content.replace(oldBodyUpdate, newBodyUpdate);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched ' + filePath);
}

try {
  patchFile(path.join(__dirname, '_astro/hoisted.CUO_IjfL.js'));
  if (fs.existsSync(path.join(__dirname, 'dist/_astro/hoisted.CUO_IjfL.js'))) {
    patchFile(path.join(__dirname, 'dist/_astro/hoisted.CUO_IjfL.js'));
  }
  console.log('All patches applied cleanly!');
} catch (err) {
  console.error('Error applying patches:', err);
  process.exit(1);
}
