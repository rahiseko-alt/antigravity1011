const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const targetDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('=== Capturing Mobile Reel Flat 2D Line Screenshots ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  console.log('Loading http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 35000 });

  console.log('Waiting for intro warp to settle...');
  await page.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 35000 });

  await sleep(1000);

  // Ensure scroll is quiet and auto-scroll stopped
  await page.evaluate(() => {
    window.scrollManager.autoScrollSpeed = 0;
    window.scrollManager.skipAutoScroll = true;
    window.scrollManager.resetScroll(0);
    window.scrollManager.targetScrollPixel = 0;
    window.scrollManager.scrollPixel = 0;
    window.scrollManager.syncDom();
  });
  await sleep(200);

  const spList = [400, 500, 600, 700, 800, 900];

  for (const sp of spList) {
    const debug = await page.evaluate(async (p) => {
      window.scrollManager.autoScrollSpeed = 0;
      window.scrollManager.skipAutoScroll = true;
      window.scrollManager.resetScroll(p);
      window.scrollManager.targetScrollPixel = p;
      window.scrollManager.scrollPixel = p;
      window.scrollManager.syncDom();

      // Wait for rendering
      await new Promise(r => {
        let f = 0;
        function t() {
          f++;
          if (f > 25) r();
          else requestAnimationFrame(t);
        }
        requestAnimationFrame(t);
      });

      const reel = document.getElementById('home-reel');
      const rect = reel ? reel.getBoundingClientRect() : null;
      let lineMesh = null;
      if (window.homePage && window.homePage.preUfxContainer) {
        window.homePage.preUfxContainer.traverse(obj => {
          if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
            lineMesh = {
              visible: obj.visible,
              u_showRatio: obj.material.uniforms.u_showRatio ? obj.material.uniforms.u_showRatio.value : null,
              u_radius: obj.material.uniforms.u_radius ? obj.material.uniforms.u_radius.value : null,
              u_scrollY: obj.material.uniforms.u_scrollY ? obj.material.uniforms.u_scrollY.value : null
            };
          }
        });
      }

      return {
        sp: p,
        scrollPixel: window.scrollManager.scrollPixel,
        targetScrollPixel: window.scrollManager.targetScrollPixel,
        reelRect: rect ? { top: rect.top, bottom: rect.bottom, height: rect.height } : null,
        lineMesh
      };
    }, sp);

    await sleep(300);

    const filename = `reel_flat2d_mob_${sp}.png`;
    const fullPath = path.join(targetDir, filename);
    await page.screenshot({ path: fullPath });
    console.log(`Captured sp=${sp}:`, JSON.stringify(debug));
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
})();
