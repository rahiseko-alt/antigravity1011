const puppeteer = require('puppeteer-core');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== CAPTURING SEQUENTIAL TWO-STAGE WARP TYPOGRAPHY SCREENSHOTS ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('font-size:0;color:transparent') && !text.includes('ERR_CONNECTION_CLOSED')) {
      consoleErrors.push(text);
      console.error('[BROWSER ERROR]', text);
    }
  });

  await page.goto('http://localhost:3000');

  // Wait for introStartTime to be set (preloader ends)
  console.log('Waiting for preloader to finish and introStartTime to be established...');
  await page.waitForFunction(() => {
    return typeof window.goalTunnels !== 'undefined' && window.goalTunnels.introStartTime != null;
  }, { timeout: 10000 });

  console.log('Intro started!');

  // Helper to freeze intro at exact r seconds
  async function freezeIntroAt(targetSec, filename, label) {
    const data = await page.evaluate((sec) => {
      window.properties.isIntroWarp = true;
      window.goalTunnels.introStartTime = performance.now() - (sec * 1000);
      window.visuals.syncProperties(1/60);
      window.visuals.update(1/60);

      const titleEl = document.getElementById('home-goal-tunnel-title');
      const introWrap = document.getElementById('intro-tunnel-title-wrapper');
      const p1 = document.getElementById('tunnel-title-phase1');
      const p2 = document.getElementById('tunnel-title-phase2');
      const p1Words = p1 ? Array.from(p1.querySelectorAll('span')).map(s => ({ text: s.textContent, transform: s.style.transform })) : [];
      const p2Words = p2 ? Array.from(p2.querySelectorAll('span')).map(s => ({ text: s.textContent, transform: s.style.transform })) : [];

      return {
        sec,
        titleVis: titleEl?.style.visibility,
        titleOp: titleEl?.style.opacity,
        titleTrans: titleEl?.style.transform,
        wrapVis: introWrap?.style.visibility,
        p1Vis: p1?.style.visibility,
        p1Active: p1?.classList.contains('is-active'),
        p2Vis: p2?.style.visibility,
        p2Active: p2?.classList.contains('is-active'),
        p1Words,
        p2Words
      };
    }, targetSec);

    await sleep(50);
    await page.screenshot({ path: filename });
    console.log(`[Captured ${label}] ${filename} at r=${targetSec}s | titleVis=${data.titleVis}, op=${data.titleOp} | P1: vis=${data.p1Vis}(act=${data.p1Active}) | P2: vis=${data.p2Vis}(act=${data.p2Active})`);
    return data;
  }

  // 1. Phase 1: Entry (PLAY WITH AI centered)
  await freezeIntroAt(1.1, 'stage1_p1_entry.png', 'Phase 1 Entry');

  // 2. Phase 1: Spread (PLAY WITH AI spreading across screen)
  await freezeIntroAt(1.7, 'stage1_p1_spread.png', 'Phase 1 Spread');

  // 3. Phase 1: Rush (PLAY WITH AI scaling up / rushing past)
  await freezeIntroAt(2.35, 'stage1_p1_rush.png', 'Phase 1 Rush');

  // 4. Phase 2: Entry (THIS WAY TOGETHER with cyan glow in cyber grid tunnel)
  await freezeIntroAt(3.0, 'stage2_p2_entry.png', 'Phase 2 Entry');

  // 5. Phase 2: Spread (THIS WAY TOGETHER words spread across tunnel width)
  await freezeIntroAt(4.2, 'stage2_p2_spread.png', 'Phase 2 Spread');

  // 6. Phase 2: Supersonic rush past camera
  await freezeIntroAt(5.3, 'stage2_p2_supersonic.png', 'Phase 2 Supersonic Rush');

  // 7. Finish Intro & Clean up wrapper
  console.log('\nFast-forwarding intro completion...');
  await page.evaluate(() => {
    window.goalTunnels.introStartTime = performance.now() - 25000;
    window.visuals.syncProperties(1/60);
    window.visuals.update(1/60);
  });
  await sleep(1500);

  // 8. Native Mid-page Warp: Phase 1 (blackTitle)
  console.log('\n--- Capturing Native Mid-Page Warp ---');
  await page.evaluate(() => {
    const ranges = window.homeGoalSectionRanges;
    const bt = ranges.items.blackTitle;
    const btRatio = 0.55;
    const targetOffsetY = bt.pixelFrom + btRatio * bt.pixelCount;
    const targetScrollPx = ranges.baseY + targetOffsetY;

    window.scrollManager.scrollToPixel(targetScrollPx, true);
    window.scrollManager.scrollPixel = targetScrollPx;
    window.scrollManager.targetScrollPixel = targetScrollPx;
    ranges.update(1/60);
    window.visuals.update(1/60);
  });
  await sleep(100);
  await page.screenshot({ path: 'stage3_native_p1.png' });
  console.log('[Captured Native Phase 1] stage3_native_p1.png');

  // 9. Native Mid-page Warp: Phase 2 (blackTunnel)
  await page.evaluate(() => {
    const ranges = window.homeGoalSectionRanges;
    const bt = ranges.items.blackTunnel;
    const btRatio = 0.45;
    const targetOffsetY = bt.pixelFrom + btRatio * bt.pixelCount;
    const targetScrollPx = ranges.baseY + targetOffsetY;

    window.scrollManager.scrollToPixel(targetScrollPx, true);
    window.scrollManager.scrollPixel = targetScrollPx;
    window.scrollManager.targetScrollPixel = targetScrollPx;
    ranges.update(1/60);
    window.visuals.update(1/60);
  });
  await sleep(100);
  await page.screenshot({ path: 'stage3_native_p2.png' });
  console.log('[Captured Native Phase 2] stage3_native_p2.png');

  console.log('\n--- Console Errors Check ---');
  console.log('Filtered console errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Errors:', consoleErrors);
  } else {
    console.log('Zero console errors! 100% Clean.');
  }

  await browser.close();
  console.log('=== ALL SCREENSHOTS CAPTURED SUCCESSFULLY ===');
})();
