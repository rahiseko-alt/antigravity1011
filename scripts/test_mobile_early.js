const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 35000 });

  const scrolls = [100, 300, 500, 700, 900, 1200];
  for (const sy of scrolls) {
    const res = await page.evaluate(async (targetY) => {
      window.scrollManager.scrollToPixel(targetY, true);
      for (let f = 0; f < 30; f++) await new Promise(r => requestAnimationFrame(r));
      let info = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
          info = {
            containerVisible: obj.parent && obj.parent.parent ? obj.parent.parent.visible : null,
            u_showRatio: obj.material.uniforms.u_showRatio.value,
            parentPos: obj.parent.position,
            parentScale: obj.parent.scale
          };
        }
      });
      return info;
    }, sy);
    console.log(`Mobile sy=${sy}:`, res);
    const shotPath = path.resolve(`mobile_early_${sy}.png`);
    await page.screenshot({ path: shotPath });
  }

  await browser.close();
})();
