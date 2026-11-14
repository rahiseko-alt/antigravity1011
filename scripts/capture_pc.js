const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

(async () => {
  console.log('=== STARTING PC CAPTURE ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(180000);
  page.setDefaultTimeout(180000);
  await page.setViewport({ width: 1440, height: 900 });

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('google-analytics') || url.includes('googletagmanager')) {
      req.abort();
    } else {
      req.continue();
    }
  });

  console.log('Navigating to http://localhost:3000...');
  const t0 = Date.now();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  console.log(`DOMContentLoaded reached in ${Date.now() - t0}ms. Waiting for intro sequence to settle (~9s)...`);

  await page.waitForFunction(() => {
    const gt = window.__goalTunnels;
    const sm = window.scrollManager;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0 && sm && sm.isActive;
  }, { timeout: 90000 });
  console.log('Intro sequence settled!');

  await new Promise(r => setTimeout(r, 800));

  const scrollTargets = [500, 650, 800];

  for (const sp of scrollTargets) {
    console.log(`\n[PC] Scrolling to target sp = ${sp}...`);
    const details = await page.evaluate(async (targetY) => {
      window.scrollManager.scrollToPixel(targetY, true);

      // Wait 35 frames for Three.js render loop to update
      for (let f = 0; f < 35; f++) {
        await new Promise(r => requestAnimationFrame(r));
      }

      const reel = document.getElementById('home-reel');
      const rRect = reel ? reel.getBoundingClientRect() : null;

      const reelTitle = document.getElementById('home-reel-title');
      const tRect = reelTitle ? reelTitle.getBoundingClientRect() : null;

      const reelCta = document.getElementById('home-reel-cta');
      const ctaRect = reelCta ? reelCta.getBoundingClientRect() : null;

      let tubeInfo = null;
      let l0 = window.__line0;
      if (l0 && l0.mesh) {
        const mat = l0.mesh.material;
        tubeInfo = {
          meshVisible: l0.mesh.visible,
          containerVisible: l0.container ? l0.container.visible : null,
          u_showRatio: mat && mat.uniforms && mat.uniforms.u_showRatio ? mat.uniforms.u_showRatio.value : null,
          u_radius: mat && mat.uniforms && mat.uniforms.u_radius ? mat.uniforms.u_radius.value : null,
          u_color: mat && mat.uniforms && mat.uniforms.u_color ? mat.uniforms.u_color.value : null,
          hasLighting: mat && mat.uniforms ? Boolean(mat.uniforms.u_lightDir) : false,
        };
      }

      return {
        currentScrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : null,
        reelBounding: rRect ? { top: Math.round(rRect.top), bottom: Math.round(rRect.bottom), height: Math.round(rRect.height) } : null,
        titleBounding: tRect ? { top: Math.round(tRect.top), bottom: Math.round(tRect.bottom) } : null,
        ctaBounding: ctaRect ? { top: Math.round(ctaRect.top), bottom: Math.round(ctaRect.bottom) } : null,
        tubeInfo
      };
    }, sp);

    console.log(`[PC] State at sp = ${sp}:`, JSON.stringify(details, null, 2));

    await new Promise(r => setTimeout(r, 400));

    const filename = `pc_sp${sp}.png`;
    const fullPath = path.join(outputDir, filename);
    await page.screenshot({ path: fullPath, fullPage: false });
    console.log(`Saved screenshot to ${fullPath}`);

    // Local copy
    await page.screenshot({ path: filename, fullPage: false });
  }

  // Also check PC at sp = 1200 (Reel visible on PC)
  console.log(`\n[PC] Scrolling to target sp = 1200...`);
  const reelCheck = await page.evaluate(async () => {
    window.scrollManager.scrollToPixel(1200, true);
    for (let f = 0; f < 35; f++) {
      await new Promise(r => requestAnimationFrame(r));
    }
    const reel = document.getElementById('home-reel');
    const rRect = reel ? reel.getBoundingClientRect() : null;
    let l0 = window.__line0;
    return {
      reelBounding: rRect ? { top: Math.round(rRect.top), bottom: Math.round(rRect.bottom), height: Math.round(rRect.height) } : null,
      tubeRatio: l0 && l0.mesh && l0.mesh.material && l0.mesh.material.uniforms ? l0.mesh.material.uniforms.u_showRatio.value : null
    };
  });
  console.log(`[PC] State at sp = 1200:`, JSON.stringify(reelCheck, null, 2));
  await page.screenshot({ path: path.join(outputDir, 'pc_sp1200.png'), fullPage: false });
  await page.screenshot({ path: 'pc_sp1200.png', fullPage: false });

  await browser.close();
  console.log('=== COMPLETED PC CAPTURE ===');
})();
