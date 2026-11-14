const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== Starting Option B Puppeteer Verification ===');
  const consoleErrors = [];

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--no-sandbox',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('ERR_CONNECTION_CLOSED') && !text.includes('favicon')) {
      console.error('[Browser Error]', text);
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', err => {
    console.error('[Page Error]', err.message);
    consoleErrors.push(err.message);
  });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait for intro initialized
  await page.waitForFunction(() => window.goalTunnels && window.goalTunnels.hasIntroInitialized, { timeout: 35000 });
  console.log('Intro initialized successfully!');

  const introTestSteps = [
    { name: 'p1_entry', time: 0.5, desc: 'Phase 1 ("PLAY WITH AI") Entry Fade-in' },
    { name: 'p1_mid_spread', time: 1.2, desc: 'Phase 1 Mid Scale & Spread' },
    { name: 'p1_peak_rush', time: 1.8, desc: 'Phase 1 High Scale Fly-through' },
    { name: 'p2_entry', time: 2.6, desc: 'Phase 2 ("THIS WAY TOGETHER") Entry Fade-in' },
    { name: 'p2_mid_spread', time: 3.3, desc: 'Phase 2 Cyber Tunnel Mid Scale & Spread' },
    { name: 'p2_peak_rush', time: 4.0, desc: 'Phase 2 Cyber Tunnel Fly-through' },
    { name: 'white_tunnel', time: 4.8, desc: 'Supersonic White Tunnel Acceleration' },
    { name: 'white_hold', time: 5.6, desc: 'Pure White Light Hold' },
    { name: 'hero_veil_reveal', time: 6.4, desc: 'Hero Unveil Veil Dissolve' },
    { name: 'hero_settled', time: 7.5, desc: 'Hero Fully Settled & Interactive' }
  ];

  const results = {
    introSteps: [],
    centeringChecks: [],
    midpageCheck: null,
    consoleErrors
  };

  // 1. Capture Sequential Intro Frames
  for (const step of introTestSteps) {
    const metrics = await page.evaluate((elapsedSec) => {
      window.goalTunnels.introStartTime = performance.now() - (elapsedSec * 1000);
      window.visuals.syncProperties(1 / 60);
      window.visuals.update(1 / 60);

      const titleEl = document.getElementById('intro-warp-title');
      const p1El = document.getElementById('intro-warp-p1');
      const p2El = document.getElementById('intro-warp-p2');
      const curtain = document.getElementById('intro-whiteout');

      const titleStyle = titleEl ? window.getComputedStyle(titleEl) : null;
      const titleRect = titleEl ? titleEl.getBoundingClientRect() : null;

      const p1Style = p1El ? window.getComputedStyle(p1El) : null;
      const p1Rect = p1El ? p1El.getBoundingClientRect() : null;
      const p1Words = p1El ? Array.from(p1El.querySelectorAll('.intro-warp-word')).map(w => ({
        text: w.textContent,
        styleTransform: w.style.transform,
        rect: { left: Math.round(w.getBoundingClientRect().left), width: Math.round(w.getBoundingClientRect().width) }
      })) : [];

      const p2Style = p2El ? window.getComputedStyle(p2El) : null;
      const p2Rect = p2El ? p2El.getBoundingClientRect() : null;
      const p2Words = p2El ? Array.from(p2El.querySelectorAll('.intro-warp-word')).map(w => ({
        text: w.textContent,
        styleTransform: w.style.transform,
        rect: { left: Math.round(w.getBoundingClientRect().left), width: Math.round(w.getBoundingClientRect().width) }
      })) : [];

      return {
        elapsedSec,
        title: {
          display: titleStyle?.display,
          visibility: titleStyle?.visibility,
          opacity: titleStyle?.opacity,
          transform: titleEl?.style.transform,
          rect: titleRect ? { top: Math.round(titleRect.top), left: Math.round(titleRect.left), width: Math.round(titleRect.width), height: Math.round(titleRect.height) } : null
        },
        p1: {
          isActive: p1El?.classList.contains('is-active'),
          visibility: p1Style?.visibility,
          opacity: p1Style?.opacity,
          rect: p1Rect ? { top: Math.round(p1Rect.top), left: Math.round(p1Rect.left), width: Math.round(p1Rect.width), height: Math.round(p1Rect.height) } : null,
          words: p1Words
        },
        p2: {
          isActive: p2El?.classList.contains('is-active'),
          visibility: p2Style?.visibility,
          opacity: p2Style?.opacity,
          rect: p2Rect ? { top: Math.round(p2Rect.top), left: Math.round(p2Rect.left), width: Math.round(p2Rect.width), height: Math.round(p2Rect.height) } : null,
          words: p2Words
        },
        curtain: {
          display: curtain?.style.display,
          opacity: curtain?.style.opacity
        },
        isIntroWarp: window.properties?.isIntroWarp,
        currentStage: window.visuals?.currentStage3D?.constructor?.name
      };
    }, step.time);

    await sleep(80);
    const shotPath = `option_b_${step.name}.png`;
    await page.screenshot({ path: shotPath });
    console.log(`[Captured ${step.name}] (r=${step.time}s) -> ${shotPath}`);
    console.log(`   Title: vis=${metrics.title.visibility}, op=${metrics.title.opacity}, tf=${metrics.title.transform}`);
    if (metrics.p1.isActive) {
      console.log(`   P1 Active: words: ${JSON.stringify(metrics.p1.words.map(w => w.text + ':' + w.styleTransform))}`);
      // Centering check for P1
      if (metrics.p1.rect) {
        const centerOffset = Math.abs((metrics.p1.rect.left + metrics.p1.rect.width / 2) - 960);
        results.centeringChecks.push({ step: step.name, phase: 'P1', centerOffset, rect: metrics.p1.rect });
        console.log(`   P1 Center Offset from 960px: ${centerOffset.toFixed(2)}px`);
      }
    }
    if (metrics.p2.isActive) {
      console.log(`   P2 Active: words: ${JSON.stringify(metrics.p2.words.map(w => w.text + ':' + w.styleTransform))}`);
      // Centering check for P2
      if (metrics.p2.rect) {
        const centerOffset = Math.abs((metrics.p2.rect.left + metrics.p2.rect.width / 2) - 960);
        results.centeringChecks.push({ step: step.name, phase: 'P2', centerOffset, rect: metrics.p2.rect });
        console.log(`   P2 Center Offset from 960px: ${centerOffset.toFixed(2)}px`);
      }
    }

    results.introSteps.push({ ...step, metrics, shotPath });
  }

  // 2. Fast-forward to regular interactive page and verify mid-page warp
  console.log('\n--- Fast-forwarding Intro to regular site ---');
  await page.evaluate(() => {
    window.goalTunnels.introStartTime = performance.now() - 30000;
    window.visuals.syncProperties(1 / 60);
    window.visuals.update(1 / 60);
  });
  await sleep(1500);

  console.log('\n--- Verifying Mid-Page Warp (#home-goal) ---');
  const midpageShot = 'option_b_midpage_warp.png';
  const midData = await page.evaluate(() => {
    const ranges = window.homeGoalSectionRanges;
    const bt = ranges.items.blackTitle;
    const targetOffsetY = bt.pixelFrom + bt.pixelCount * 0.55;
    const targetScrollPx = ranges.baseY + targetOffsetY;

    window.scrollManager.scrollToPixel(targetScrollPx, true);
    window.scrollManager.scrollPixel = targetScrollPx;
    window.scrollManager.targetScrollPixel = targetScrollPx;
    ranges.update(1 / 60);
    window.visuals.update(1 / 60);

    const titleEl = document.getElementById('home-goal-tunnel-title');
    const compTitle = titleEl ? window.getComputedStyle(titleEl) : null;
    const rectTitle = titleEl ? titleEl.getBoundingClientRect() : null;

    return {
      titlePresent: !!titleEl,
      parentId: titleEl?.parentElement?.id,
      visibility: compTitle?.visibility,
      opacity: compTitle?.opacity,
      transform: titleEl?.style.transform,
      rect: rectTitle ? { top: Math.round(rectTitle.top), left: Math.round(rectTitle.left), width: Math.round(rectTitle.width), height: Math.round(rectTitle.height) } : null,
      scrollPixel: window.scrollManager?.scrollPixel
    };
  });

  await sleep(100);
  await page.screenshot({ path: midpageShot });
  console.log(`[Captured Mid-Page] -> ${midpageShot}`);
  console.log('   Mid-Page Title status:', JSON.stringify(midData));
  results.midpageCheck = { midData, shotPath: midpageShot };

  fs.writeFileSync('option_b_verification_report.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('\n=== Option B Verification Complete! Console errors count: ' + consoleErrors.length + ' ===');

  await browser.close();
})();
