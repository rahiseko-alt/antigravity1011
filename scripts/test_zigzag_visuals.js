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

  console.log('Desktop Hero settled! Testing early scroll and zig-zag crossings...');
  
  // Test early scroll and crossings:
  // scrollY: 100 (instant start), 800 (crossing 1 cyan/blue), 1600 (crossing 2 neon crimson), 2400 (crossing 3 emerald green)
  const scrollTargets = [100, 800, 1600, 2400, 3000];
  
  for (const s of scrollTargets) {
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
            visible: obj.visible,
            containerVisible: obj.parent && obj.parent.parent ? obj.parent.parent.visible : null,
            u_showRatio: obj.material.uniforms.u_showRatio.value,
            u_radius: obj.material.uniforms.u_radius.value,
            u_scrollY: obj.material.uniforms.u_scrollY.value
          };
        }
      });
      return { targetY, lineInfo };
    }, s);
    
    console.log(`Scroll ${s}:`, JSON.stringify(info, null, 2));
    await new Promise(r => setTimeout(r, 400));
    const shotPath = path.resolve(`zigzag_desktop_${s}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved ${shotPath}`);
  }

  await browser.close();
  console.log('Done Desktop!');
})();
