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

  for (const sp of [3200, 4800, 5200, 5800, 6200]) {
    await page.evaluate((px) => {
      window.scrollManager.scrollToPixel(px, true);
    }, sp);
    await new Promise(r => setTimeout(r, 400));

    const data = await page.evaluate(() => {
      let lineObj = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius && !lineObj) {
          lineObj = obj;
        }
      });
      const inner = lineObj.parent;
      const u = Math.hypot(window.properties.viewportWidth, window.properties.viewportHeight);
      const sx = (window.properties.viewportWidth / u) / 0.87157;
      const showRatio = lineObj.material.uniforms.u_showRatio.value;
      const cp = lineObj.geometry.attributes.CP.array;
      const count = lineObj.geometry.attributes.CP.count;
      const maxIdx = Math.floor(showRatio * (count - 1));

      const samples = [];
      for (let i = 0; i <= maxIdx; i += Math.max(1, Math.floor(maxIdx / 8))) {
        const x3d = inner.position.x + cp[i * 3 + 0] * sx * inner.scale.x;
        const y3d = inner.position.y + cp[i * 3 + 1] * inner.scale.y;
        samples.push({
          i,
          ratio: Number((i / (count - 1)).toFixed(3)),
          screenX: Math.round(x3d),
          screenY: Math.round(-y3d)
        });
      }
      return {
        showRatio: Number(showRatio.toFixed(3)),
        innerPosY: Math.round(inner.position.y),
        samples
      };
    });

    console.log(`Scroll ${sp}:`, JSON.stringify(data));
  }

  await browser.close();
})();
