const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '_astro', 'hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');
console.log('Original code size:', code.length);

// 1. Remove import of GLTFLoader
const gltfImport = "import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';";
if (code.includes(gltfImport)) {
  code = code.replace(gltfImport, "/* GLTFLoader removed */");
  console.log('[1] Removed GLTFLoader import');
} else {
  console.log('[1] GLTFLoader import not found');
}

// 2. Remove michelle GLTF loading & vertex skinning loop
const loaderStartStr = "const _gltfLoader = new GLTFLoader();";
const loaderEndStr = "this.add(this.container);";
const lStart = code.indexOf(loaderStartStr);
if (lStart !== -1) {
  const lEnd = code.indexOf(loaderEndStr, lStart);
  if (lEnd !== -1) {
    const replacement = `this.customAvatar = null;\nthis.useCustomAvatar = false;\nthis.customAvatarMeshes = [];\n`;
    code = code.substring(0, lStart) + replacement + code.substring(lEnd);
    console.log('[2] Replaced michelle.glb CPU skinning block with no-op');
  }
}

// 3. Fix wheel preventDefault at end of file
const wheelPrevent = 'window.addEventListener("wheel",o=>o.preventDefault(),{passive:!1});';
if (code.includes(wheelPrevent)) {
  code = code.replace(wheelPrevent, 'window.addEventListener("wheel",o=>{if(o.ctrlKey)o.preventDefault()},{passive:!1});');
  console.log('[3] Fixed wheel preventDefault to only prevent ctrlKey zoom');
} else {
  console.log('[3] wheelPrevent not found');
}

// 4. Optimize Preloader duration and easing
const oldPreloaderParams = 'MIN_PRELOAD_DURATION=0.35;PERCENT_BETWEEN_INIT_AND_START=.3;MIN_DURATION_BETWEEN_INIT_AND_START=0.25;';
const newPreloaderParams = 'MIN_PRELOAD_DURATION=0.15;PERCENT_BETWEEN_INIT_AND_START=.1;MIN_DURATION_BETWEEN_INIT_AND_START=0.10;';
if (code.includes(oldPreloaderParams)) {
  code = code.replace(oldPreloaderParams, newPreloaderParams);
  console.log('[4] Optimized Preloader duration constants');
}

const oldPreloaderUpdate = 'if(this._elapsedTime>0.4)this.percentTarget=1;';
const newPreloaderUpdate = 'if(this._elapsedTime>0.2)this.percentTarget=1;';
if (code.includes(oldPreloaderUpdate)) {
  code = code.replace(oldPreloaderUpdate, newPreloaderUpdate);
  console.log('[4b] Preloader update elapsed check reduced to 0.2s');
}

// 5. Short-circuit intro warp duration so it feels instantaneous and responsive
const oldTimeline = 'const tP1=0.45,tP2=0.45,tWhite=0.25,tWarpEnd=tP1+tP2+tWhite,tWhiteHold=0.20,tHoldEnd=tWarpEnd+tWhiteHold,tHeroFade=0.30,tIntroEnd=tHoldEnd+tHeroFade;';
const newTimeline = 'const tP1=0.25,tP2=0.25,tWhite=0.15,tWarpEnd=tP1+tP2+tWhite,tWhiteHold=0.10,tHoldEnd=tWarpEnd+tWhiteHold,tHeroFade=0.15,tIntroEnd=tHoldEnd+tHeroFade;';
if (code.includes(oldTimeline)) {
  code = code.replace(oldTimeline, newTimeline);
  console.log('[5] Optimized opening intro warp timeline to ultra-crisp 0.9s');
}

// 6. Global immediate user gesture unlock (wheel, touch, click, keydown) + 1.2s safety timer
const globalUnlockCode = `
;(() => {
  const unlockNow = () => {
    window.__skipPreloader = true;
    if (window.__preloader) {
      window.__preloader.percentTarget = 1;
      window.__preloader.percent = 1;
      window.__preloader.percentToStart = 1;
      window.__preloader.easedPercent = 100;
      window.__preloader.isActive = false;
      if (window.__preloader.domContainer) window.__preloader.domContainer.style.display = "none";
    }
    if (typeof properties !== "undefined") {
      properties.isIntroWarp = false;
      properties.bloomAmount = 0;
      properties.haloStrength = 0;
      if (properties.bloom) { properties.bloom.amount = 0; properties.bloom.haloStrength = 0; }
      if (properties.offWhiteColorHex) {
        properties.bgColor.setStyle(properties.offWhiteColorHex);
        properties.bgColorHex = properties.offWhiteColorHex;
      }
    }
    if (typeof scrollManager !== "undefined") {
      scrollManager.isActive = true;
    }
    document.body.style.overflow = "";
    const pc = document.getElementById("page-container"); pc && (pc.style.opacity = "1");
    const hd = document.getElementById("header"); hd && (hd.style.opacity = "1", hd.style.pointerEvents = "");
    const wo = document.getElementById("intro-whiteout"); wo && (wo.style.display = "none", wo.style.opacity = "0");
    const it = document.getElementById("intro-warp-title"); it && (it.style.display = "none");
    if (typeof header !== "undefined" && header.show) header.show();
    document.documentElement.classList.remove("is-black-bg");
    document.documentElement.classList.add("is-white-bg");
    if (typeof homeBalloons !== "undefined") {
      homeBalloons.isActive = true;
      if (typeof homeBalloonsPhysics !== "undefined") homeBalloonsPhysics.reset();
      if (homeBalloons.updateColor) homeBalloons.updateColor();
    }
    if (typeof goalTunnels !== "undefined") {
      goalTunnels.isActive = false;
      goalTunnels.hasResetHeroPhysics = true;
    }
  };
  window.addEventListener("wheel", () => unlockNow(), { passive: true, once: true });
  window.addEventListener("touchstart", () => unlockNow(), { passive: true, once: true });
  window.addEventListener("keydown", () => unlockNow(), { passive: true, once: true });
  window.addEventListener("click", () => unlockNow(), { passive: true, once: true });
  setTimeout(unlockNow, 1100);
})();
`;

code += globalUnlockCode;
console.log('[6] Injected global instant unlock listeners and 1.1s safety auto-unlock');

fs.writeFileSync(filePath, code, 'utf8');
console.log('Saved patched hoisted.CUO_IjfL.js, new length:', code.length);
