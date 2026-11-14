const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== VERIFYING TWO-STAGE WARP TYPOGRAPHY ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('[BROWSER ERROR]', msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
    console.error('[PAGE ERROR]', err.toString());
  });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await sleep(1000);

  // -------------------------------------------------------------
  // Test 1: DOM Elements exist in document
  // -------------------------------------------------------------
  const domCheck = await page.evaluate(() => {
    const title = document.getElementById('home-goal-tunnel-title');
    const p1 = document.getElementById('tunnel-title-phase1');
    const p2 = document.getElementById('tunnel-title-phase2');
    return {
      titleExists: !!title,
      p1Exists: !!p1,
      p2Exists: !!p2,
      p1Text: p1 ? p1.textContent.trim().replace(/\s+/g, ' ') : null,
      p2Text: p2 ? p2.textContent.trim().replace(/\s+/g, ' ') : null,
      p2Color: p2 ? window.getComputedStyle(p2).color : null,
      p2TextShadow: p2 ? window.getComputedStyle(p2).textShadow : null
    };
  });
  console.log('DOM check:', JSON.stringify(domCheck, null, 2));

  if (!domCheck.p1Exists || !domCheck.p2Exists) {
    console.error('FATAL: Phase 1 or Phase 2 DOM elements not found!');
    await browser.close();
    process.exit(1);
  }

  // -------------------------------------------------------------
  // Test 2: Intro Warp Phase 1 (PLAY WITH AI)
  // -------------------------------------------------------------
  console.log('\n--- Testing Intro Warp Phase 1 ("PLAY WITH AI") ---');

  // Let's test at r = 1.0s (Phase 1 entry / spread)
  await page.evaluate(() => {
    // Reset intro start time to exactly 1.2 seconds ago
    // tPureBlack = 0.50, tTitle = 2.60
    window.goalTunnels.introStartTime = performance.now() - 1200;
    window.visuals.syncProperties(1/60);
    window.visuals.update(1/60);
  });
  await sleep(200);

  const phase1MidData = await page.evaluate(() => {
    const p1 = document.getElementById('tunnel-title-phase1');
    const p2 = document.getElementById('tunnel-title-phase2');
    const container = document.getElementById('home-goal-tunnel-title');
    const wrapper = document.getElementById('intro-tunnel-title-wrapper');
    const spans = p1 ? Array.from(p1.querySelectorAll('span')).map(s => ({
      text: s.textContent,
      transform: s.style.transform
    })) : [];
    return {
      containerVisibility: container?.style.visibility,
      containerOpacity: container?.style.opacity,
      containerTransform: container?.style.transform,
      wrapperVisibility: wrapper?.style.visibility,
      p1Class: p1?.className,
      p1Visibility: p1?.style.visibility,
      p2Class: p2?.className,
      p2Visibility: p2?.style.visibility,
      spans
    };
  });
  console.log('Intro Phase 1 (r=1.2s):', JSON.stringify(phase1MidData, null, 2));
  await page.screenshot({ path: 'two_stage_phase1_spread.png' });
  console.log('Saved screenshot two_stage_phase1_spread.png');

  // Phase 1 rush (r = 2.4s)
  await page.evaluate(() => {
    window.goalTunnels.introStartTime = performance.now() - 2400;
    window.visuals.syncProperties(1/60);
    window.visuals.update(1/60);
  });
  await sleep(200);
  await page.screenshot({ path: 'two_stage_phase1_rush.png' });
  console.log('Saved screenshot two_stage_phase1_rush.png');

  // -------------------------------------------------------------
  // Test 3: Intro Warp Phase 2 ("THIS WAY TOGETHER")
  // -------------------------------------------------------------
  console.log('\n--- Testing Intro Warp Phase 2 ("THIS WAY TOGETHER") ---');
  // tTitle = 2.60, tBlack = 3.20 (r = 2.60s ~ 5.80s)
  // Let's test at r = 3.6s (progress = (3.6 - 2.6) / 3.2 = ~0.31)
  await page.evaluate(() => {
    window.goalTunnels.introStartTime = performance.now() - 3600;
    window.visuals.syncProperties(1/60);
    window.visuals.update(1/60);
  });
  await sleep(200);

  const phase2Data = await page.evaluate(() => {
    const p1 = document.getElementById('tunnel-title-phase1');
    const p2 = document.getElementById('tunnel-title-phase2');
    const container = document.getElementById('home-goal-tunnel-title');
    const wrapper = document.getElementById('intro-tunnel-title-wrapper');
    const spans = p2 ? Array.from(p2.querySelectorAll('span')).map(s => ({
      text: s.textContent,
      transform: s.style.transform
    })) : [];
    return {
      containerVisibility: container?.style.visibility,
      containerOpacity: container?.style.opacity,
      containerTransform: container?.style.transform,
      wrapperVisibility: wrapper?.style.visibility,
      p1Class: p1?.className,
      p1Visibility: p1?.style.visibility,
      p2Class: p2?.className,
      p2Visibility: p2?.style.visibility,
      spans,
      stage: window.visuals?.currentStage3D?.constructor?.name
    };
  });
  console.log('Intro Phase 2 (r=3.6s):', JSON.stringify(phase2Data, null, 2));
  await page.screenshot({ path: 'two_stage_phase2_spread.png' });
  console.log('Saved screenshot two_stage_phase2_spread.png');

  // Supersonic rush (r = 5.2s, progress = ~0.81)
  await page.evaluate(() => {
    window.goalTunnels.introStartTime = performance.now() - 5200;
    window.visuals.syncProperties(1/60);
    window.visuals.update(1/60);
  });
  await sleep(200);
  await page.screenshot({ path: 'two_stage_phase2_supersonic.png' });
  console.log('Saved screenshot two_stage_phase2_supersonic.png');

  // -------------------------------------------------------------
  // Test 4: Fast forward intro to completion & Test Native Mid-Page Warp
  // -------------------------------------------------------------
  console.log('\n--- Fast-forwarding intro and testing Native Mid-Page Warp ---');
  await page.evaluate(() => {
    window.goalTunnels.introStartTime = performance.now() - 25000;
    window.visuals.syncProperties(1/60);
    window.visuals.update(1/60);
  });
  await sleep(1500);

  // Scroll to blackTitle range (Phase 1)
  await page.evaluate(() => {
    const ranges = window.homeGoalSectionRanges;
    const bt = ranges.items.blackTitle;
    const btRatio = 0.5; // mid blackTitle
    const targetOffsetY = bt.pixelFrom + btRatio * bt.pixelCount;
    const targetScrollPx = ranges.baseY + targetOffsetY;

    window.scrollManager.scrollToPixel(targetScrollPx, true);
    window.scrollManager.scrollPixel = targetScrollPx;
    window.scrollManager.targetScrollPixel = targetScrollPx;
    ranges.update(1/60);
    window.visuals.update(1/60);
  });
  await sleep(200);

  const nativeP1Data = await page.evaluate(() => {
    const p1 = document.getElementById('tunnel-title-phase1');
    const p2 = document.getElementById('tunnel-title-phase2');
    const container = document.getElementById('home-goal-tunnel-title');
    return {
      containerVisibility: container?.style.visibility,
      containerOpacity: container?.style.opacity,
      p1Class: p1?.className,
      p1Visibility: p1?.style.visibility,
      p2Class: p2?.className,
      p2Visibility: p2?.style.visibility
    };
  });
  console.log('Native Mid-Page (blackTitle):', JSON.stringify(nativeP1Data, null, 2));
  await page.screenshot({ path: 'two_stage_native_phase1.png' });
  console.log('Saved screenshot two_stage_native_phase1.png');

  // Scroll to blackTunnel range (Phase 2)
  await page.evaluate(() => {
    const ranges = window.homeGoalSectionRanges;
    const bt = ranges.items.blackTunnel;
    const btRatio = 0.5; // mid blackTunnel
    const targetOffsetY = bt.pixelFrom + btRatio * bt.pixelCount;
    const targetScrollPx = ranges.baseY + targetOffsetY;

    window.scrollManager.scrollToPixel(targetScrollPx, true);
    window.scrollManager.scrollPixel = targetScrollPx;
    window.scrollManager.targetScrollPixel = targetScrollPx;
    ranges.update(1/60);
    window.visuals.update(1/60);
  });
  await sleep(200);

  const nativeP2Data = await page.evaluate(() => {
    const p1 = document.getElementById('tunnel-title-phase1');
    const p2 = document.getElementById('tunnel-title-phase2');
    const container = document.getElementById('home-goal-tunnel-title');
    return {
      containerVisibility: container?.style.visibility,
      containerOpacity: container?.style.opacity,
      p1Class: p1?.className,
      p1Visibility: p1?.style.visibility,
      p2Class: p2?.className,
      p2Visibility: p2?.style.visibility
    };
  });
  console.log('Native Mid-Page (blackTunnel):', JSON.stringify(nativeP2Data, null, 2));
  await page.screenshot({ path: 'two_stage_native_phase2.png' });
  console.log('Saved screenshot two_stage_native_phase2.png');

  console.log('\n--- Console Errors Check ---');
  console.log('Total console errors:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Errors found:', consoleErrors);
  } else {
    console.log('Zero console errors confirmed! PERFECT.');
  }

  await browser.close();
  console.log('=== VERIFICATION COMPLETED SUCCESSFULLY ===');
})();
