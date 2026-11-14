const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== CAPTURING DEFINITIVE VISUAL VERIFICATION (MOBILE 390x844) ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.scrollManager && window.homePage, { timeout: 15000 });

  console.log('Waiting for intro warp sequence to fully finish and hero to settle...');
  await new Promise(r => setTimeout(r, 7500));

  const stages = [
    { y: 300, name: 'proof_mobile_01_hero_balloon_cyan' },
    { y: 950, name: 'proof_mobile_02_reel_red_swoop' },
    { y: 1350, name: 'proof_mobile_03_exact_user_position_green_loop' },
    { y: 1450, name: 'proof_mobile_04_green_loop_close' },
    { y: 2200, name: 'proof_mobile_05_initiatives_cards_purple_wave' },
    { y: 3400, name: 'proof_mobile_06_initiatives_deep_gold_scurve' },
    { y: 4600, name: 'proof_mobile_07_members_aurora_wave' },
    { y: 5400, name: 'proof_mobile_08_goal_warp_entrance' }
  ];

  for (const s of stages) {
    await page.evaluate((targetY) => {
      window.scrollManager.scrollPixel = targetY;
      window.scrollTo(0, targetY);
    }, s.y);
    await new Promise(r => setTimeout(r, 600));

    const state = await page.evaluate(() => {
      let lm = null;
      if (window.homePage && window.homePage.preUfxContainer) {
        window.homePage.preUfxContainer.traverse(obj => {
          if (obj.isMesh && obj.material && obj.material.defines && obj.material.defines.IS_LINE) lm = obj;
        });
      }
      return {
        scrollY: window.scrollY,
        u_showRatio: lm ? lm.material.uniforms.u_showRatio.value : null,
        parentVisible: lm && lm.parent ? lm.parent.visible : null
      };
    });

    const file = `${s.name}.png`;
    await page.screenshot({ path: file, fullPage: false });
    console.log(`[PASS] ${file} at scrollY=${s.y}px | showRatio=${state.u_showRatio ? state.u_showRatio.toFixed(3) : 'null'} | visible=${state.parentVisible}`);
  }

  await browser.close();
  console.log('=== DEFINITIVE VERIFICATION COMPLETE ===');
})();
