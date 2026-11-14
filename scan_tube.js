const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox', '--window-size=390,844']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6500));

  const scrollTargets = [1800, 2400, 2800, 3200, 3600, 4000, 4400, 4800, 5200, 5600, 6000];

  for (const sp of scrollTargets) {
    await page.evaluate((px) => {
      window.scrollManager.scrollToPixel(px, true);
    }, sp);
    await new Promise(r => setTimeout(r, 400));

    const check = await page.evaluate(() => {
      let lineObj = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius && !lineObj) {
          lineObj = obj;
        }
      });
      if (!lineObj) return null;

      const inner = lineObj.parent;
      const container = inner.parent;
      const u = Math.hypot(window.properties.viewportWidth, window.properties.viewportHeight);
      const sx = (window.properties.viewportWidth / u) / 0.87157;
      const showRatio = lineObj.material.uniforms.u_showRatio.value;

      // Check all vertices up to showRatio
      const cp = lineObj.geometry.attributes.CP.array;
      const count = lineObj.geometry.attributes.CP.count;
      const maxIdx = Math.floor(showRatio * (count - 1));

      let visiblePointsCount = 0;
      let minScreenX = Infinity, maxScreenX = -Infinity;
      let minScreenY = Infinity, maxScreenY = -Infinity;

      for (let i = 0; i <= maxIdx; i++) {
        const x3d = inner.position.x + cp[i * 3 + 0] * sx * inner.scale.x;
        const y3d = inner.position.y + cp[i * 3 + 1] * inner.scale.y;

        // In screen pixel coordinates:
        // x goes 0 to viewportWidth (390)
        // y goes 0 to -844. In screen pixels: screenY = -y3d
        const screenX = x3d;
        const screenY = -y3d;

        if (screenX >= -50 && screenX <= window.properties.viewportWidth + 50 &&
            screenY >= -50 && screenY <= window.properties.viewportHeight + 50) {
          visiblePointsCount++;
          if (screenX < minScreenX) minScreenX = screenX;
          if (screenX > maxScreenX) maxScreenX = screenX;
          if (screenY < minScreenY) minScreenY = screenY;
          if (screenY > maxScreenY) maxScreenY = screenY;
        }
      }

      // Check canvas z-index and DOM element stacking
      const canvas = document.querySelector('canvas');
      const canvasZ = canvas ? window.getComputedStyle(canvas).zIndex : null;

      return {
        showRatio,
        containerVisible: container.visible,
        maxIdx,
        visiblePointsCount,
        screenBounds: { minScreenX, maxScreenX, minScreenY, maxScreenY },
        canvasZ
      };
    });

    console.log(`Scroll ${sp}:`, JSON.stringify(check));
    await page.screenshot({ path: `scan_tube_${sp}.png` });
  }

  await browser.close();
})();
