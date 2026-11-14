const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT_DIR = path.resolve(__dirname, '..');

// 1. Update index.html and dist/index.html
function patchIndexHtml(filePath) {
  if (!fs.existsSync(filePath)) return;
  console.log('Patching HTML:', filePath);
  let html = fs.readFileSync(filePath, 'utf8');

  // Remove any previous intro-warp-title if present
  html = html.replace(/<div id="intro-warp-title">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, '');
  html = html.replace(/<div id="intro-warp-title">[\s\S]*?<\/div>\s*<\/div>/g, '');

  const introWarpHtml = `  <div id="intro-warp-title">
    <div id="intro-warp-p1" class="intro-warp-phase is-active">
      <span class="intro-warp-word">PLAY</span>
      <span class="intro-warp-word">WITH</span>
      <span class="intro-warp-word">AI</span>
    </div>
    <div id="intro-warp-p2" class="intro-warp-phase">
      <span class="intro-warp-word">THIS</span>
      <span class="intro-warp-word">WAY</span>
      <span class="intro-warp-word">TOGETHER</span>
    </div>
  </div>`;

  // Insert right after <body>
  const bodyIdx = html.indexOf('<body>');
  if (bodyIdx === -1) {
    throw new Error('Could not find <body> in ' + filePath);
  }

  html = html.slice(0, bodyIdx + 6) + '\n' + introWarpHtml + html.slice(bodyIdx + 6);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('  -> HTML patched successfully');
}

// 2. Update CSS files
function patchCss(filePath) {
  if (!fs.existsSync(filePath)) return;
  console.log('Patching CSS:', filePath);
  let css = fs.readFileSync(filePath, 'utf8');

  // Check if #intro-warp-title is already in CSS
  if (css.includes('#intro-warp-title')) {
    console.log('  -> Already has #intro-warp-title in CSS, skipping append');
    return;
  }

  const warpCss = `
/* Option B Intro Warp Typography */
#intro-warp-title {
  position: fixed;
  top: 50%;
  left: 0;
  width: 100vw;
  height: 0;
  pointer-events: none;
  z-index: 9500;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: translate3d(0, -50%, 0);
  will-change: transform, opacity;
  visibility: hidden;
  opacity: 0;
}
.intro-warp-phase {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.35ch;
  white-space: nowrap;
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
  font-weight: 900 !important;
  font-size: clamp(2.5rem, 6.5vw, 7.5rem);
  letter-spacing: -0.02em;
  color: #ffffff;
  text-shadow: 0 0 15px rgba(0, 240, 255, 0.95), 0 0 35px rgba(0, 180, 255, 0.7), 0 0 70px rgba(255, 255, 255, 0.4);
  opacity: 0;
  visibility: hidden;
  transition: none;
}
.intro-warp-phase.is-active {
  visibility: visible;
  opacity: 1;
}
.intro-warp-word {
  display: inline-block;
  will-change: transform;
}
`;

  css += warpCss;
  fs.writeFileSync(filePath, css, 'utf8');
  console.log('  -> CSS patched successfully');
}

// 3. Update hoisted JS files
async function patchHoistedJs(filePath) {
  if (!fs.existsSync(filePath)) return;
  console.log('Patching JS:', filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  const sMarker = 'syncProperties(e){if(properties.isIntroWarp){';
  const eMarker = 'this.currentStage3D=this.defaultStage3D;';

  const sIdx = content.indexOf(sMarker);
  const eIdx = content.indexOf(eMarker, sIdx);

  if (sIdx === -1 || eIdx === -1) {
    throw new Error('Could not find syncProperties boundaries in ' + filePath);
  }

  const newSyncProperties = `syncProperties(e){if(properties.isIntroWarp){let _curtain=document.getElementById("intro-whiteout");if(!_curtain){_curtain=document.createElement("div");_curtain.id="intro-whiteout";_curtain.style.cssText="position:fixed;inset:0;background:#ffffff;z-index:99999;pointer-events:none;transition:none;opacity:0;display:none;";document.body.appendChild(_curtain)}window.__introWhiteout=_curtain;if(!goalTunnels.hasIntroInitialized){goalTunnels.hasIntroInitialized=!0,goalTunnels.introStartTime=performance.now(),goalTunnels.hasResetHeroPhysics=!1,scrollManager.isActive=!1,scrollManager.scrollY=0,scrollManager.targetY=0,input.lastScrollYDirection=1,document.body.style.overflow="hidden",document.documentElement.classList.add("is-black-bg"),document.body.style.backgroundColor="#000000";const _oldB=document.getElementById("intro-blackout");_oldB&&_oldB.remove();const o=document.getElementById("page-container");o&&(o.style.opacity="0");const t=document.getElementById("header");t&&(t.style.opacity="0",t.style.pointerEvents="none");typeof transitionOverlay!="undefined"&&(transitionOverlay.contentShowRatio=1,transitionOverlay.canvas&&(transitionOverlay.canvas.style.display="none"));if(!homeGoalSectionRanges.items.blackTunnel||!homeGoalSectionRanges.items.blackTunnel.pixelCount||homeGoalSectionRanges.totalPixelCount===0){typeof homeGoalSection!="undefined"&&homeGoalSection.resize?homeGoalSection.resize(properties.width,properties.height):homeGoalSectionRanges.resize(properties.width,properties.height)}goalTunnels.frameHeight=properties.viewportHeight}let introTitle=goalTunnels.introTitleEl;if(!introTitle){introTitle=goalTunnels.introTitleEl=document.getElementById("intro-warp-title");if(introTitle){goalTunnels.introP1El=introTitle.querySelector("#intro-warp-p1");goalTunnels.introP2El=introTitle.querySelector("#intro-warp-p2");goalTunnels.introP1Words=goalTunnels.introP1El?goalTunnels.introP1El.querySelectorAll(".intro-warp-word"):null;goalTunnels.introP2Words=goalTunnels.introP2El?goalTunnels.introP2El.querySelectorAll(".intro-warp-word"):null}}let introP1=goalTunnels.introP1El,introP2=goalTunnels.introP2El,introP1Words=goalTunnels.introP1Words,introP2Words=goalTunnels.introP2Words;const r=(performance.now()-goalTunnels.introStartTime)/1e3;const _h=document.getElementById("header");_h&&(_h.style.opacity="0");const _p=document.getElementById("page-container");_p&&(_p.style.opacity="0");const tP1=2.20,tP2=2.20,tWhite=0.80,tWarpEnd=tP1+tP2+tWhite,tWhiteHold=0.80,tHoldEnd=tWarpEnd+tWhiteHold,tHeroFade=1.00,tIntroEnd=tHoldEnd+tHeroFade;goalTunnels.tP1=tP1,goalTunnels.tP2=tP2,goalTunnels.tWarpEnd=tWarpEnd,goalTunnels.tHoldEnd=tHoldEnd,goalTunnels.tIntroEnd=tIntroEnd;if(r<tP1){_curtain.style.display="none",_curtain.style.opacity="0";const p1=Math.min(1,Math.max(0,r/tP1));const btFrom=homeGoalSectionRanges.items.blackTitle.pixelFrom+homeGoalSectionRanges.items.blackTitle.pixelCount*0.25,btTo=homeGoalSectionRanges.items.blackTitle.pixelTo;const scrubOffset=btFrom+p1*(btTo-btFrom);homeGoalSectionRanges.offsetY=scrubOffset,homeGoalSectionRanges.update(e),this.currentStage3D=goalTunnels,goalTunnels.isActive=!0,goalTunnels.updateRatios(),goalTunnels.syncProperties(e);for(let k in goalTunnels.properties)properties[k]=goalTunnels.properties[k];properties.bgColorHex="#000000",properties.bgColor.setStyle("#000000");const scale=math.fit(p1,0.4,1,1,12,ease.cubicIn)*math.fit(p1,0,0.15,0.85,1,ease.cubicOut);const opacity=math.fit(p1,0,0.12,0,1)*math.fit(p1,0.85,1,1,0);const spread=math.fit(p1,0.35,0.65,0,1,ease.cubicInOut);if(introTitle){introTitle.style.display="flex",introTitle.style.visibility=opacity>0.001?"visible":"hidden",introTitle.style.opacity=opacity.toFixed(4),introTitle.style.transform="translate3d(0,-50%,0) scale("+scale.toFixed(4)+")"}if(introP1){introP1.classList.add("is-active"),introP1.style.visibility="visible",introP1.style.opacity="1";if(introP1Words&&introP1Words.length>=3){introP1Words[0].style.transform="translateX("+(-spread*properties.width*0.22).toFixed(2)+"px)";introP1Words[1].style.transform="translateZ(0)";introP1Words[2].style.transform="translateX("+(spread*properties.width*0.22).toFixed(2)+"px)"}}if(introP2){introP2.classList.remove("is-active"),introP2.style.visibility="hidden",introP2.style.opacity="0"}return}if(r<tP1+tP2){_curtain.style.display="none",_curtain.style.opacity="0";const p2=Math.min(1,Math.max(0,(r-tP1)/tP2));const bFrom=homeGoalSectionRanges.items.blackTunnel.pixelFrom,bTo=homeGoalSectionRanges.items.blackTunnel.pixelTo;const scrubOffset=bFrom+p2*(bTo-bFrom);homeGoalSectionRanges.offsetY=scrubOffset,homeGoalSectionRanges.update(e),this.currentStage3D=goalTunnels,goalTunnels.isActive=!0,goalTunnels.updateRatios(),goalTunnels.syncProperties(e);for(let k in goalTunnels.properties)properties[k]=goalTunnels.properties[k];properties.bgColorHex="#000000",properties.bgColor.setStyle("#000000");const scale=math.fit(p2,0.4,1,1,12,ease.cubicIn)*math.fit(p2,0,0.15,0.85,1,ease.cubicOut);const opacity=math.fit(p2,0,0.12,0,1)*math.fit(p2,0.85,1,1,0);const spread=math.fit(p2,0.35,0.65,0,1,ease.cubicInOut);if(introTitle){introTitle.style.display="flex",introTitle.style.visibility=opacity>0.001?"visible":"hidden",introTitle.style.opacity=opacity.toFixed(4),introTitle.style.transform="translate3d(0,-50%,0) scale("+scale.toFixed(4)+")"}if(introP1){introP1.classList.remove("is-active"),introP1.style.visibility="hidden",introP1.style.opacity="0"}if(introP2){introP2.classList.add("is-active"),introP2.style.visibility="visible",introP2.style.opacity="1";if(introP2Words&&introP2Words.length>=3){introP2Words[0].style.transform="translateX("+(-spread*properties.width*0.22).toFixed(2)+"px)";introP2Words[1].style.transform="translateZ(0)";introP2Words[2].style.transform="translateX("+(spread*properties.width*0.22).toFixed(2)+"px)"}}return}if(introTitle){introTitle.style.visibility="hidden",introTitle.style.opacity="0";if(introP1)introP1.classList.remove("is-active"),introP1.style.visibility="hidden",introP1.style.opacity="0";if(introP2)introP2.classList.remove("is-active"),introP2.style.visibility="hidden",introP2.style.opacity="0"}if(r<tWarpEnd){const wProgress=Math.min(1,Math.max(0,(r-(tP1+tP2))/tWhite)),wFrom=homeGoalSectionRanges.items.whiteTunnel.pixelFrom,wTo=homeGoalSectionRanges.items.whiteFrameOut.pixelTo,scrubOffset=wFrom+wProgress*(wTo-wFrom);homeGoalSectionRanges.offsetY=scrubOffset,homeGoalSectionRanges.update(e),this.currentStage3D=goalTunnels,goalTunnels.isActive=!0,goalTunnels.updateRatios(),goalTunnels.syncProperties(e);for(let k in goalTunnels.properties)properties[k]=goalTunnels.properties[k];properties.bgColorHex="#ffffff",properties.bgColor.setStyle("#ffffff"),_curtain.style.display="block",_curtain.style.opacity=wProgress.toFixed(4);return}if(!goalTunnels.hasResetHeroPhysics){goalTunnels.hasResetHeroPhysics=!0,goalTunnels.isActive=!1,goalTunnels.isBlackTitleActive=!1,goalTunnels.isBlackTunnelActive=!1,goalTunnels.isWhiteTunnelActive=!1,goalBlackTunnel.container.visible=!1,goalWhiteTunnel.container.visible=!1,goalTunnelGlass.container&&(goalTunnelGlass.container.visible=!1),goalTunnelGlass.ratio=0,goalTunnelEfx.isActive=!1,goalTunnelEfx.amount=0,goalTunnelEfx.offsetPostion.set(0,0,0),goalTunnelEfx.offsetRotation.set(0,0,0),goalTunnelEfx.offsetScale.set(1,1,1),goalTunnelEfx.needsSync=!0,properties.bgColor.setStyle(properties.offWhiteColorHex),properties.bgColorHex=properties.offWhiteColorHex,document.documentElement.classList.remove("is-black-bg"),document.documentElement.classList.add("is-white-bg"),homeBalloons.isActive=!0,this.currentStage3D=homeBalloons,homePage.time=0,homeBalloons.syncProperties(e);for(let k in homeBalloons.properties)properties[k]=homeBalloons.properties[k];homeBalloonsPhysics.reset(),homeBalloonsPhysics.bodies.forEach(b=>b.applyImpulse()),homeBalloons.updateColor()}if(r<tHoldEnd){_curtain.style.display="block",_curtain.style.opacity="1";this.currentStage3D=homeBalloons,homeBalloons.isActive=!0,homeBalloons.syncProperties(e);for(let k in homeBalloons.properties)properties[k]=homeBalloons.properties[k];properties.bloomAmount=6,properties.bloomSaturation=1.3,properties.haloStrength=.1,properties.bloom.amount=properties.bloomAmount,properties.bloom.haloStrength=properties.haloStrength,properties.bgColor.setStyle(properties.offWhiteColorHex),properties.bgColorHex=properties.offWhiteColorHex;return}const heroProgress=Math.min(1,Math.max(0,(r-tHoldEnd)/tHeroFade));const veilEase=ease.quadOut(heroProgress);_curtain.style.display="block",_curtain.style.opacity=(1-veilEase).toFixed(4);this.currentStage3D=homeBalloons,homeBalloons.isActive=!0,homeBalloons.syncProperties(e);for(let k in homeBalloons.properties)properties[k]=homeBalloons.properties[k];properties.bloomAmount=math.mix(6,0,veilEase),properties.bloomSaturation=math.mix(1.3,1,veilEase),properties.haloStrength=math.mix(.1,0,veilEase),properties.bloom.amount=properties.bloomAmount,properties.bloom.haloStrength=properties.haloStrength,properties.bgColor.setStyle(properties.offWhiteColorHex),properties.bgColorHex=properties.offWhiteColorHex;const pageCont=document.getElementById("page-container");pageCont&&(pageCont.style.opacity=veilEase.toFixed(3));const hdr=document.getElementById("header");hdr&&(hdr.style.opacity=veilEase.toFixed(3)),heroProgress>=.25&&typeof header!="undefined"&&header.show&&header.show();if(r>=tIntroEnd){properties.isIntroWarp=!1,properties.bloomAmount=0,properties.haloStrength=0,properties.bloom.amount=0,properties.bloom.haloStrength=0,properties.bgColor.setStyle(properties.offWhiteColorHex),properties.bgColorHex=properties.offWhiteColorHex,scrollManager.isActive=!0,scrollManager.scrollY=0,scrollManager.targetY=0,pageCont&&(pageCont.style.opacity="1"),hdr&&(hdr.style.opacity="1"),typeof header!="undefined"&&header.show&&header.show();if(introTitle)introTitle.style.display="none";if(!window.__hasCleanedIntroDom){window.__hasCleanedIntroDom=!0;setTimeout(()=>{const _c=document.getElementById("intro-whiteout");_c&&(_c.style.opacity="0",_c.style.display="none");document.body.style.overflow="";const _pc=document.getElementById("page-container");_pc&&(_pc.style.transition="");const _h=document.getElementById("header");_h&&(_h.style.transition="");},120)}}return}`;

  content = content.slice(0, sIdx) + newSyncProperties + '\n' + content.slice(eIdx);

  // Validate syntax with esbuild before writing
  await esbuild.transform(content, { loader: 'js' });
  console.log('  -> JS syntax validated with esbuild');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('  -> JS patched successfully');
}

(async () => {
  try {
    console.log('=== Applying Option B (Intro Warp Typography) ===');
    patchIndexHtml(path.join(ROOT_DIR, 'index.html'));
    patchIndexHtml(path.join(ROOT_DIR, 'dist', 'index.html'));

    patchCss(path.join(ROOT_DIR, '_astro', 'about.CNa9RfUh.css'));
    patchCss(path.join(ROOT_DIR, 'dist', '_astro', 'about.CNa9RfUh.css'));

    await patchHoistedJs(path.join(ROOT_DIR, '_astro', 'hoisted.CUO_IjfL.js'));
    await patchHoistedJs(path.join(ROOT_DIR, 'dist', '_astro', 'hoisted.CUO_IjfL.js'));

    console.log('=== All files successfully updated for Option B! ===');
  } catch (err) {
    console.error('ERROR:', err);
    process.exit(1);
  }
})();
