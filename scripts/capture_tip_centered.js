const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureTipExact() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const outDir = path.resolve('tip_verification_results');
  fs.mkdirSync(outDir, { recursive: true });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  await page.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 30000 });

  // Test at various scroll pixels
  const testPixels = [200, 600, 1100, 1500, 2000, 2500];

  for (const pixel of testPixels) {
    const data = await page.evaluate(async (px) => {
      window.scrollManager.scrollPixel = px;
      window.scrollManager.targetScrollPixel = px;
      for (let f = 0; f < 25; f++) await new Promise(r => requestAnimationFrame(r));

      let tipScreenPos = null;
      let showRatio = 0;
      let strokeThick = 1.0;
      let cd = 0;

      // Find line mesh and calculate tip position
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
          showRatio = obj.material.uniforms.u_showRatio.value;
          const geom = obj.geometry;
          if (geom && geom.attributes && geom.attributes.CP && geom.attributes.position) {
            const cpArr = geom.attributes.CP.array;
            const posArr = geom.attributes.position.array;
            const cdArr = geom.attributes.Cd ? geom.attributes.Cd.array : null;
            const count = geom.attributes.position.count;

            // Find vertices closest to showRatio
            let bestDiff = 999;
            let bestIdx = 0;
            for (let i = 0; i < count; i += 2) {
              const s = posArr[i * 3 + 2];
              if (s <= showRatio && (showRatio - s) < bestDiff) {
                bestDiff = showRatio - s;
                bestIdx = i;
              }
            }

            // Get world position
            const sx = (window.properties.viewportWidth / Math.hypot(window.properties.viewportWidth, window.properties.viewportHeight)) / 0.87157;
            const cpx = cpArr[bestIdx * 3 + 0] * sx;
            const cpy = cpArr[bestIdx * 3 + 1];
            if (cdArr) cd = cdArr[bestIdx];

            const v = obj.position.clone().set(cpx, cpy, 0);
            v.applyMatrix4(obj.matrixWorld);
            v.project(window.properties.camera);

            const screenX = (v.x * 0.5 + 0.5) * window.properties.viewportWidth;
            const screenY = (-(v.y * 0.5) + 0.5) * window.properties.viewportHeight;

            tipScreenPos = { x: Math.round(screenX), y: Math.round(screenY) };
          }
        }
      });

      return { px, showRatio, cd, tipScreenPos };
    }, pixel);

    console.log(`Scroll pixel ${pixel}:`, JSON.stringify(data));

    // Full screen capture
    await page.screenshot({ path: path.join(outDir, `full_px_${pixel}.png`) });

    // Centered crop around tip if tip is on screen
    if (data.tipScreenPos && data.tipScreenPos.x >= 0 && data.tipScreenPos.x <= 1920 &&
        data.tipScreenPos.y >= 0 && data.tipScreenPos.y <= 1080) {
      const cropW = 300;
      const cropH = 300;
      const clipX = Math.max(0, Math.min(1920 - cropW, data.tipScreenPos.x - cropW / 2));
      const clipY = Math.max(0, Math.min(1080 - cropH, data.tipScreenPos.y - cropH / 2));

      await page.screenshot({
        path: path.join(outDir, `tip_closeup_px_${pixel}.png`),
        clip: { x: clipX, y: clipY, width: cropW, height: cropH }
      });
      console.log(`Saved Closeup: tip_closeup_px_${pixel}.png at (${clipX}, ${clipY})`);
    }
  }

  await browser.close();
  console.log('Capture completed!');
}

captureTipExact();
