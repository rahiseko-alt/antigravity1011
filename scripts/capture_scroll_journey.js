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

  console.log('Waiting for intro sequence...');
  await page.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 45000 });

  const scrollPoints = [
    { sy: 0, name: '0000_hero' },
    { sy: 1080, name: '1080_reel_top' },
    { sy: 1900, name: '1900_initiatives_top' },
    { sy: 2500, name: '2500_initiatives_mid' },
    { sy: 3000, name: '3000_initiatives_late' },
    { sy: 3500, name: '3500_initiatives_bottom' },
    { sy: 4500, name: '4500_members_top' },
    { sy: 5800, name: '5800_goal_top' }
  ];

  for (const pt of scrollPoints) {
    const info = await page.evaluate(async (targetY) => {
      window.scrollManager.scrollToPixel(targetY, true);
      await new Promise(r => {
        let f = 0;
        function tick() {
          f++;
          if (f > 30) r();
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });

      let lineInfo = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
          lineInfo = {
            showRatio: obj.material.uniforms.u_showRatio ? obj.material.uniforms.u_showRatio.value : null,
            visible: obj.visible,
            parentVisible: obj.parent ? obj.parent.visible : null,
            parentParentVisible: obj.parent && obj.parent.parent ? obj.parent.parent.visible : null,
            innerPosY: obj.parent ? obj.parent.position.y : null,
            scrollY: window.scrollManager.scrollPixel
          };
        }
      });
      return lineInfo;
    }, pt.sy);

    console.log(`[${pt.name}]`, JSON.stringify(info));
    const outPath = path.resolve(process.cwd(), `test_${pt.name}.png`);
    await page.screenshot({ path: outPath });
  }

  await browser.close();
  console.log('Screenshots captured successfully.');
})();
