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

  console.log('Mobile Hero settled! Scrolling through #home-reel...');
  const pixels = [850, 1100, 1400, 1800, 2400];
  for (const p of pixels) {
    const info = await page.evaluate(async (targetY) => {
      window.scrollManager.scrollToPixel(targetY, true);
      await new Promise(r => {
        let f = 0;
        function t() { f++; if (f > 30) r(); else requestAnimationFrame(t); }
        requestAnimationFrame(t);
      });
      let lineInfo = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
          lineInfo = {
            visible: obj.visible,
            containerVisible: obj.parent && obj.parent.parent ? obj.parent.parent.visible : null,
            u_showRatio: obj.material.uniforms.u_showRatio.value,
            u_radius: obj.material.uniforms.u_radius.value,
            u_scrollY: obj.material.uniforms.u_scrollY.value
          };
        }
      });
      return { targetY, lineInfo };
    }, p);

    console.log(`Pixel ${p}:`, JSON.stringify(info, null, 2));
    await new Promise(r => setTimeout(r, 400));
    const shotPath = path.resolve(`mobile_step_${p}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved ${shotPath}`);
  }

  await browser.close();
  console.log('Done!');
})();
