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

  const testScrolls = [900, 1400, 1800, 2200, 2600, 3000, 3400, 3800, 4200, 4600, 5000, 5500, 6000, 6500];

  for (const s of testScrolls) {
    await page.evaluate((px) => {
      window.scrollManager.scrollToPixel(px, true);
    }, s);
    await new Promise(r => setTimeout(r, 300));

    const info = await page.evaluate((px) => {
      let lineObj = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius && !lineObj) {
          lineObj = obj;
        }
      });

      if (!lineObj) return { error: 'line not found' };

      const inner = lineObj.parent;
      const container = inner.parent;
      const u_showRatio = lineObj.material.uniforms.u_showRatio.value;

      return {
        px,
        scrollPixel: window.scrollManager.scrollPixel,
        u_showRatio,
        innerPosY: inner.position.y,
        containerVisible: container.visible,
      };
    }, s);

    console.log(`Scroll ${s}:`, JSON.stringify(info));
  }

  await browser.close();
})();
