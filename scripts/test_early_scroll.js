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
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 35000 });

  console.log('Hero settled! Testing early scroll on Desktop (1920x1080)...');
  const earlyScrolls = [0, 50, 150, 300, 600, 1080, 1600, 2400];
  for (const sy of earlyScrolls) {
    const info = await page.evaluate(async (targetY) => {
      window.scrollManager.scrollToPixel(targetY, true);
      await new Promise(r => {
        let f = 0;
        function t() { f++; if (f > 25) r(); else requestAnimationFrame(t); }
        requestAnimationFrame(t);
      });
      let lineInfo = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
          lineInfo = {
            meshVisible: obj.visible,
            containerVisible: obj.parent && obj.parent.parent ? obj.parent.parent.visible : null,
            u_showRatio: obj.material.uniforms.u_showRatio.value,
            scrollPixel: window.scrollManager.scrollPixel
          };
        }
      });
      return { targetY, lineInfo };
    }, sy);

    console.log(`scrollY ${sy}:`, JSON.stringify(info, null, 2));
    await new Promise(r => setTimeout(r, 200));
    const shotPath = path.resolve(`early_scroll_${sy}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot: ${shotPath}`);
  }

  await browser.close();
  console.log('Early scroll test completed successfully!');
})();
