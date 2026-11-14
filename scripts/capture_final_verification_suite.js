const puppeteer = require('puppeteer-core');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== RUNNING FINAL TWO-STAGE WARP TYPOGRAPHY VERIFICATION SUITE ===');
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
  await sleep(2000);

  // Helper to safely render intro at exact second
  async function renderIntroAt(sec, filename, label) {
    const data = await page.evaluate((s) => {
      let titleEl = document.getElementById('home-goal-tunnel-title');
      let introWrapper = document.getElementById('intro-tunnel-title-wrapper');
      if (!introWrapper && titleEl) {
        let padX = window.properties.width > 812 ? Math.max(window.properties.width * .05, 40) : (window.properties.width > 380 ? 25 : 15);
        let nativeLeft = padX, nativeWidth = window.properties.width - 2 * padX;
        introWrapper = document.createElement('div');
        introWrapper.id = 'intro-tunnel-title-wrapper';
        introWrapper.style.cssText = 'position:fixed;top:50%;left:0;width:100%;height:0;z-index:9000;pointer-events:none;transform:translateZ(0);display:block;visibility:hidden;';
        if (!titleEl._origParent) {
          titleEl._origParent = titleEl.parentNode;
          titleEl._origNext = titleEl.nextSibling;
        }
        titleEl.style.marginLeft = nativeLeft + 'px';
        titleEl.style.width = nativeWidth + 'px';
        introWrapper.appendChild(titleEl);
        document.body.appendChild(introWrapper);
      }
      window.goalTunnels.hasCleanedIntroTitle = false;
      window.properties.isIntroWarp = true;
      window.goalTunnels.introStartTime = performance.now() - (s * 1000);
      window.visuals.syncProperties(1/60);
      window.visuals.update(1/60);

      const p1 = document.getElementById('tunnel-title-phase1');
      const p2 = document.getElementById('tunnel-title-phase2');
      return {
        sec: s,
        stage: window.visuals?.currentStage3D?.constructor?.name,
        titleVis: titleEl?.style.visibility,
        titleOp: titleEl?.style.opacity,
        p1Vis: p1?.style.visibility,
        p1Class: p1?.className,
        p2Vis: p2?.style.visibility,
        p2Class: p2?.className
      };
    }, sec);

    await sleep(60);
    await page.screenshot({ path: filename });
    console.log(`[Captured ${label}] ${filename} (sec=${sec}) -> Title: vis=${data.titleVis}, op=${data.titleOp} | P1: vis=${data.p1Vis}(${data.p1Class}) | P2: vis=${data.p2Vis}(${data.p2Class}) | Stage=${data.stage}`);
  }

  console.log('\n--- Capturing Intro Warp Sequence ---');
  // Phase 1 (PLAY WITH AI)
  await renderIntroAt(1.0, 'intro_phase1_start.png', 'Phase 1 Start');
  await renderIntroAt(1.6, 'intro_phase1_spread.png', 'Phase 1 Spread');
  await renderIntroAt(2.4, 'intro_phase1_rush.png', 'Phase 1 Rush');

  // Phase 2 (THIS WAY TOGETHER)
  await renderIntroAt(3.0, 'intro_phase2_entry.png', 'Phase 2 Entry');
  await renderIntroAt(4.2, 'intro_phase2_spread.png', 'Phase 2 Spread');
  await renderIntroAt(5.2, 'intro_phase2_rush.png', 'Phase 2 Rush');

  // Fast forward intro to completion and clean up wrapper
  console.log('\n--- Fast-forwarding intro to completion ---');
  await page.evaluate(() => {
    window.goalTunnels.introStartTime = performance.now() - 25000;
    window.visuals.syncProperties(1/60);
    window.visuals.update(1/60);
  });
  await sleep(1500);

  // Native Mid-Page Warp: Phase 1 & Phase 2
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
  await sleep(80);
  await page.screenshot({ path: 'native_phase1.png' });
  console.log('[Captured Native Phase 1] native_phase1.png');

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
  await sleep(80);
  await page.screenshot({ path: 'native_phase2.png' });
  console.log('[Captured Native Phase 2] native_phase2.png');

  console.log('\n--- Console Errors Check ---');
  console.log('Filtered console errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Errors:', consoleErrors);
  } else {
    console.log('Zero console errors! 100% Clean.');
  }

  await browser.close();
  console.log('=== FINAL VERIFICATION COMPLETE ===');
})();
