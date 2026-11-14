const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureTipSuite(suiteName) {
  console.log(`\n========================================`);
  console.log(`RUNNING TIP VERIFICATION SUITE: ${suiteName}`);
  console.log(`========================================\n`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const outDir = path.resolve(process.cwd(), 'tip_captures', suiteName);
  fs.mkdirSync(outDir, { recursive: true });

  // 1. DESKTOP TEST (1920x1080)
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  await desktopPage.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 25000 });

  // 3 distinct scroll stages:
  // pixel 1600 (showRatio ~ 0.14)
  // pixel 1800 (showRatio ~ 0.20, crossing text)
  // pixel 2300 (showRatio ~ 0.43, mid flight)
  const desktopPixels = [1600, 1800, 2300];

  for (let i = 0; i < desktopPixels.length; i++) {
    const px = desktopPixels[i];
    const info = await desktopPage.evaluate(async (pixel) => {
      window.scrollManager.scrollPixel = pixel;
      window.scrollManager.targetScrollPixel = pixel;
      for (let f = 0; f < 20; f++) await new Promise(r => requestAnimationFrame(r));

      let lineInfo = null;
      let circleInfo = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
          lineInfo = {
            showRatio: obj.material.uniforms.u_showRatio.value,
            radius: obj.material.uniforms.u_radius.value,
            visible: obj.visible
          };
        }
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_mixRatio) {
          circleInfo = {
            visible: obj.visible,
            pos: [obj.position.x, obj.position.y, obj.position.z],
            scale: [obj.scale.x, obj.scale.y, obj.scale.z]
          };
        }
      });
      return { pixel, lineInfo, circleInfo };
    }, px);

    console.log(`Desktop [pixel=${px}]:`, JSON.stringify(info));
    await sleep(200);

    const fullPath = path.join(outDir, `desktop_px_${px}.png`);
    await desktopPage.screenshot({ path: fullPath });

    // Focus crop on text & tip region: x: 250..850, y: 100..750
    const cropPath = path.join(outDir, `desktop_tip_closeup_px_${px}.png`);
    await desktopPage.screenshot({
      path: cropPath,
      clip: { x: 250, y: 80, width: 650, height: 600 }
    });
    console.log(`Saved Desktop Closeup: ${cropPath}`);
  }
  await desktopPage.close();

  // 2. MOBILE TEST (390x844)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  await mobilePage.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 25000 });

  const mobilePixels = [1200, 1600, 2000];
  for (let i = 0; i < mobilePixels.length; i++) {
    const px = mobilePixels[i];
    const info = await mobilePage.evaluate(async (pixel) => {
      window.scrollManager.scrollPixel = pixel;
      window.scrollManager.targetScrollPixel = pixel;
      for (let f = 0; f < 20; f++) await new Promise(r => requestAnimationFrame(r));

      let lineInfo = null;
      let circleInfo = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
          lineInfo = {
            showRatio: obj.material.uniforms.u_showRatio.value,
            radius: obj.material.uniforms.u_radius.value
          };
        }
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_mixRatio) {
          circleInfo = {
            visible: obj.visible
          };
        }
      });
      return { pixel, lineInfo, circleInfo };
    }, px);

    console.log(`Mobile [pixel=${px}]:`, JSON.stringify(info));
    await sleep(200);

    const fullPath = path.join(outDir, `mobile_px_${px}.png`);
    await mobilePage.screenshot({ path: fullPath });

    const cropPath = path.join(outDir, `mobile_tip_closeup_px_${px}.png`);
    await mobilePage.screenshot({
      path: cropPath,
      clip: { x: 20, y: 0, width: 350, height: 480 }
    });
    console.log(`Saved Mobile Closeup: ${cropPath}`);
  }
  await mobilePage.close();

  await browser.close();
  console.log(`\n=== SUITE ${suiteName} COMPLETED ===\n`);
}

module.exports = { captureTipSuite };

if (require.main === module) {
  const suiteName = process.argv[2] || 'analytical_dome_v2';
  captureTipSuite(suiteName);
}
