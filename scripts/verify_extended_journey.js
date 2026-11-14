const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScroll(page, scrollTarget, stageName) {
  console.log(`Scrolling to ${scrollTarget} (${stageName})...`);
  const state = await page.evaluate(async (target) => {
    window.scrollManager.scrollToPixel(target, true);
    await new Promise(res => {
      let f = 0;
      function tick() {
        if (++f > 35) res();
        else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });

    const lv = window.__lineReel ? window.__lineReel.lineVisual : null;
    let info = null;
    if (lv && lv.mesh) {
      info = {
        scrollPixel: window.scrollManager.scrollPixel,
        showRatio: lv.mesh.material.uniforms.u_showRatio.value,
        radius: lv.mesh.material.uniforms.u_radius.value,
        containerVisible: lv.container.visible,
        meshVisible: lv.mesh.visible,
        innerPosY: lv.innerContainer.position.y
      };
    }
    return info;
  }, scrollTarget);

  console.log(`[${stageName}] State:`, JSON.stringify(state));
  await sleep(400);

  const shotPath = path.resolve(process.cwd(), `${stageName}.png`);
  await page.screenshot({ path: shotPath });
  console.log(`Saved screenshot: ${shotPath}`);
  return { state, shotPath };
}

(async () => {
  console.log('=== VERIFYING EXTENDED 3D SPLINE JOURNEY ===');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for hero to settle (>= 9.0s)...');
  await page.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 25000 });

  console.log('Hero settled! Capturing 7 desktop stages...');
  await captureScroll(page, 1100, 'stage1_reel_headline_1100');
  await captureScroll(page, 1400, 'stage2_reel_crest_1400');
  await captureScroll(page, 1700, 'stage3_reel_button_1700');
  await captureScroll(page, 2200, 'stage4_initiatives_header_2200');
  await captureScroll(page, 2700, 'stage5_initiatives_cards_2700');
  await captureScroll(page, 3200, 'stage6_initiatives_cards2_3200');
  await captureScroll(page, 3600, 'stage7_initiatives_deep_3600');

  console.log('\n--- Mobile Captures (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setCacheEnabled(false);
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 25000 });

  await captureScroll(mobilePage, 1200, 'stage_mobile_reel_1200');
  await captureScroll(mobilePage, 2400, 'stage_mobile_initiatives_2400');

  await browser.close();
  console.log('\n=== ALL CAPTURES FINISHED SUCCESSFULLY ===');
})();
