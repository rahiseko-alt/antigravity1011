const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== Starting Side-by-Side Warp Text Comparison ===');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--enable-webgl2-compute-context',
      '--ignore-gpu-blocklist',
      '--disable-gpu-sandbox',
      '--no-sandbox',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('ERR_CONNECTION_CLOSED')) {
      console.error('[Page Error]', text);
    }
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait for intro warp initialization
  await page.waitForFunction(() => window.goalTunnels && window.goalTunnels.hasIntroInitialized, { timeout: 35000 });
  console.log('Intro initialized!');

  const ratios = [0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9];
  const traceComparison = {
    intro: [],
    native: []
  };

  // -------------------------------------------------------------
  // 1. CAPTURE INTRO WARP TEXT AT RATIOS
  // -------------------------------------------------------------
  console.log('\n--- Capturing Intro Warp Text ---');
  for (const r of ratios) {
    await page.evaluate((targetR) => {
      const tPureBlack = 0.50;
      const tTitle = 2.60;
      const neededElapsedSec = tPureBlack + targetR * (tTitle - tPureBlack);
      window.goalTunnels.introStartTime = performance.now() - (neededElapsedSec * 1000);
      window.visuals.syncProperties(1/60);
      window.visuals.update(1/60);
    }, r);

    await sleep(80);

    const introData = await page.evaluate((targetR) => {
      const titleEl = document.getElementById('home-goal-tunnel-title');
      const introWrap = document.getElementById('intro-tunnel-title-wrapper');
      const bTitle = window.homeGoalSectionRanges?.getRange('blackTitle');
      const compTitle = titleEl ? window.getComputedStyle(titleEl) : null;
      const rectTitle = titleEl ? titleEl.getBoundingClientRect() : null;
      const spans = titleEl ? Array.from(titleEl.querySelectorAll('.home-goal-tunnel-title-line span')).map(s => ({
        text: s.textContent,
        transform: s.style.transform,
        computedTransform: window.getComputedStyle(s).transform,
        rect: s.getBoundingClientRect()
      })) : [];

      const lines = titleEl ? Array.from(titleEl.querySelectorAll('.home-goal-tunnel-title-line')).map(l => ({
        text: l.textContent,
        rect: l.getBoundingClientRect()
      })) : [];

      return {
        targetRatio: targetR,
        blackTitleRatio: bTitle ? bTitle.ratio : null,
        stage: window.visuals?.currentStage3D?.constructor?.name,
        bgColor: window.properties?.bgColorHex,
        bloomAmount: window.properties?.bloomAmount,
        haloStrength: window.properties?.haloStrength,
        container: {
          id: titleEl?.id,
          parentId: titleEl?.parentElement?.id,
          parentTag: titleEl?.parentElement?.tagName,
          visibility: titleEl?.style.visibility,
          computedVisibility: compTitle?.visibility,
          opacity: titleEl?.style.opacity,
          computedOpacity: compTitle?.opacity,
          inlineTransform: titleEl?.style.transform,
          computedTransform: compTitle?.transform,
          fontSize: compTitle?.fontSize,
          fontFamily: compTitle?.fontFamily,
          textTransform: compTitle?.textTransform,
          color: compTitle?.color,
          zIndex: compTitle?.zIndex,
          rect: rectTitle ? { top: Math.round(rectTitle.top), left: Math.round(rectTitle.left), width: Math.round(rectTitle.width), height: Math.round(rectTitle.height) } : null
        },
        wrapper: {
          display: introWrap?.style.display,
          transform: introWrap?.style.transform,
          rect: introWrap?.getBoundingClientRect() ? { top: Math.round(introWrap.getBoundingClientRect().top), left: Math.round(introWrap.getBoundingClientRect().left), width: Math.round(introWrap.getBoundingClientRect().width) } : null
        },
        lines,
        spans
      };
    }, r);

    traceComparison.intro.push(introData);
    const shotName = `intro_text_r${r}.png`;
    await page.screenshot({ path: shotName });
    console.log(`[Captured Intro] r=${r} -> ${shotName} | vis=${introData.container.visibility}, op=${introData.container.opacity}, rect=${JSON.stringify(introData.container.rect)}`);
  }

  // -------------------------------------------------------------
  // 2. WAIT FOR INTRO TO FINISH AND TRANSITION TO REGULAR SITE
  // -------------------------------------------------------------
  console.log('\nFast-forwarding intro completion...');
  await page.evaluate(() => {
    window.goalTunnels.introStartTime = performance.now() - 25000;
    window.visuals.syncProperties(1/60);
    window.visuals.update(1/60);
  });
  await sleep(1500);

  // -------------------------------------------------------------
  // 3. CAPTURE NATIVE MID-PAGE WARP TEXT AT MATCHING RATIOS
  // -------------------------------------------------------------
  console.log('\n--- Capturing Native Mid-Page Warp Text ---');

  for (const r of ratios) {
    await page.evaluate((targetR) => {
      const ranges = window.homeGoalSectionRanges;
      const bt = ranges.items.blackTitle;
      // HomeGoalSectionTunnelTitle: RATIO_FROM = 0.25, RATIO_TO = 1.0
      // r = (blackTitle.ratio - 0.25) / (1 - 0.25) => blackTitle.ratio = 0.25 + r * 0.75
      const btRatio = 0.25 + targetR * 0.75;
      const targetOffsetY = bt.pixelFrom + btRatio * bt.pixelCount;
      const targetScrollPx = ranges.baseY + targetOffsetY;

      window.scrollManager.scrollToPixel(targetScrollPx, true);
      window.scrollManager.scrollPixel = targetScrollPx;
      window.scrollManager.targetScrollPixel = targetScrollPx;
      ranges.update(1/60);
      window.visuals.update(1/60);
    }, r);

    await sleep(80);

    const nativeData = await page.evaluate((targetR) => {
      const titleEl = document.getElementById('home-goal-tunnel-title');
      const bTitle = window.homeGoalSectionRanges?.getRange('blackTitle');
      const compTitle = titleEl ? window.getComputedStyle(titleEl) : null;
      const rectTitle = titleEl ? titleEl.getBoundingClientRect() : null;
      const spans = titleEl ? Array.from(titleEl.querySelectorAll('.home-goal-tunnel-title-line span')).map(s => ({
        text: s.textContent,
        transform: s.style.transform,
        computedTransform: window.getComputedStyle(s).transform,
        rect: s.getBoundingClientRect()
      })) : [];

      const lines = titleEl ? Array.from(titleEl.querySelectorAll('.home-goal-tunnel-title-line')).map(l => ({
        text: l.textContent,
        rect: l.getBoundingClientRect()
      })) : [];

      return {
        targetRatio: targetR,
        blackTitleRatio: bTitle ? bTitle.ratio : null,
        scrollPixel: window.scrollManager?.scrollPixel,
        stage: window.visuals?.currentStage3D?.constructor?.name,
        bgColor: window.properties?.bgColorHex,
        bloomAmount: window.properties?.bloomAmount,
        haloStrength: window.properties?.haloStrength,
        container: {
          id: titleEl?.id,
          parentId: titleEl?.parentElement?.id,
          parentTag: titleEl?.parentElement?.tagName,
          visibility: titleEl?.style.visibility,
          computedVisibility: compTitle?.visibility,
          opacity: titleEl?.style.opacity,
          computedOpacity: compTitle?.opacity,
          inlineTransform: titleEl?.style.transform,
          computedTransform: compTitle?.transform,
          fontSize: compTitle?.fontSize,
          fontFamily: compTitle?.fontFamily,
          textTransform: compTitle?.textTransform,
          color: compTitle?.color,
          zIndex: compTitle?.zIndex,
          rect: rectTitle ? { top: Math.round(rectTitle.top), left: Math.round(rectTitle.left), width: Math.round(rectTitle.width), height: Math.round(rectTitle.height) } : null
        },
        lines,
        spans
      };
    }, r);

    traceComparison.native.push(nativeData);
    const shotName = `native_text_r${r}.png`;
    await page.screenshot({ path: shotName });
    console.log(`[Captured Native] r=${r} -> ${shotName} | vis=${nativeData.container.visibility}, op=${nativeData.container.opacity}, rect=${JSON.stringify(nativeData.container.rect)}`);
  }

  // -------------------------------------------------------------
  // 4. 60-STEP TRACE SWEEP
  // -------------------------------------------------------------
  console.log('\n--- Sweeping 60 steps for Native & Intro ---');
  const sweep = [];
  for (let i = 0; i <= 60; i++) {
    const rVal = i / 60;
    const pt = await page.evaluate((targetR) => {
      const ranges = window.homeGoalSectionRanges;
      const bt = ranges.items.blackTitle;
      const btRatio = 0.25 + targetR * 0.75;
      const targetOffsetY = bt.pixelFrom + btRatio * bt.pixelCount;
      const targetScrollPx = ranges.baseY + targetOffsetY;

      window.scrollManager.scrollToPixel(targetScrollPx, true);
      window.scrollManager.scrollPixel = targetScrollPx;
      window.scrollManager.targetScrollPixel = targetScrollPx;
      ranges.update(1/60);
      window.visuals.update(1/60);

      const titleEl = document.getElementById('home-goal-tunnel-title');
      const bTitle = ranges.getRange('blackTitle');
      const spans = titleEl ? Array.from(titleEl.querySelectorAll('.home-goal-tunnel-title-line span')).map(sp => ({
        text: sp.textContent,
        transform: sp.style.transform
      })) : [];

      return {
        r: targetR,
        blackTitleRatio: bTitle ? bTitle.ratio : null,
        scrollPixel: targetScrollPx,
        opacity: titleEl ? titleEl.style.opacity : null,
        transform: titleEl ? titleEl.style.transform : null,
        spans
      };
    }, rVal);
    sweep.push(pt);
  }

  traceComparison.sweep = sweep;
  fs.writeFileSync('warp_text_trace_comparison.json', JSON.stringify(traceComparison, null, 2), 'utf8');
  console.log('Saved warp_text_trace_comparison.json');

  await browser.close();
  console.log('ALL DONE!');
})();
