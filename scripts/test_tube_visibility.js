const puppeteer = require('puppeteer-core');
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

  console.log('Intro done! Testing scroll positions on Desktop (1920x1080)...');
  const scrollTests = [0, 500, 1000, 1500, 2000, 2500, 2800, 3000, 3023, 3024, 3025, 3100, 3200, 3500, 4000, 5000];
  for (const sy of scrollTests) {
    const res = await page.evaluate(async (targetY) => {
      window.scrollManager.scrollToPixel(targetY, true);
      await new Promise(r => {
        let f = 0;
        function tick() {
          f++;
          if (f > 20) r();
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });

      let lineInfo = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
          lineInfo = {
            scrollPixel: window.scrollManager.scrollPixel,
            u_showRatio: obj.material.uniforms.u_showRatio ? obj.material.uniforms.u_showRatio.value : null,
            meshVisible: obj.visible,
            innerContainerVisible: obj.parent ? obj.parent.visible : null,
            containerVisible: obj.parent && obj.parent.parent ? obj.parent.parent.visible : null,
            innerPosY: obj.parent ? obj.parent.position.y : null,
            parentParentType: obj.parent && obj.parent.parent ? obj.parent.parent.constructor.name : null
          };
        }
      });
      return lineInfo;
    }, sy);
    console.log(`Scroll ${sy}px:`, JSON.stringify(res));
  }

  console.log('\n--- Mobile Test (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 45000 });

  const mobileScrollTests = [0, 500, 1000, 1500, 2000, 2300, 2363, 2364, 2400, 3000, 4000];
  for (const sy of mobileScrollTests) {
    const res = await mobilePage.evaluate(async (targetY) => {
      window.scrollManager.scrollToPixel(targetY, true);
      await new Promise(r => {
        let f = 0;
        function tick() {
          f++;
          if (f > 20) r();
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });

      let lineInfo = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
          lineInfo = {
            scrollPixel: window.scrollManager.scrollPixel,
            u_showRatio: obj.material.uniforms.u_showRatio ? obj.material.uniforms.u_showRatio.value : null,
            containerVisible: obj.parent && obj.parent.parent ? obj.parent.parent.visible : null
          };
        }
      });
      return lineInfo;
    }, sy);
    console.log(`Mobile Scroll ${sy}px:`, JSON.stringify(res));
  }

  await browser.close();
})();
