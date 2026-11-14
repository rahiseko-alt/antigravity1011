const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== Verifying Intro Warp Title Fly-Through and Mid-Page Warp ===');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const errors = [];

  const browser = await puppeteer.launch({
    executablePath,
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
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out internal Chrome devtools styling artifact
      if (!text.includes('font-size:0;color:transparent') && !text.includes('ERR_CONNECTION_CLOSED')) {
        console.error('[Browser Error]', text);
        errors.push(text);
      }
    }
  });

  page.on('pageerror', err => {
    console.error('[Browser PageError]', err.message);
    errors.push(err.message);
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for intro warp initialization...');
  await page.waitForFunction(() => window.goalTunnels && window.goalTunnels.hasIntroInitialized, { timeout: 35000 });

  console.log('Intro warp initialized! Recording frames...');

  const captures = [];

  const targets = [
    { id: 'a_pure_black', time: 0.25, label: '(a) Pure Black Interval' },
    { id: 'b_text_fading_in', time: 0.85, label: '(b) Text Fading In Centered' },
    { id: 'c_text_spreading', time: 1.55, label: '(c) Text Spreading & Scaling' },
    { id: 'd_text_huge_flythrough', time: 2.30, label: '(d) Text Huge Flying Past' },
    { id: 'e_black_tunnel', time: 3.80, label: '(e) Black Tunnel Entered' },
    { id: 'f1_white_tunnel', time: 6.00, label: '(f1) White Tunnel Supersonic' },
    { id: 'f2_white_hold', time: 6.80, label: '(f2) White Pure Hold' },
    { id: 'f3_hero_fade', time: 7.70, label: '(f3) Hero Fade-in' },
    { id: 'f4_hero_settled', time: 8.80, label: '(f4) Hero Settled Interactive' }
  ];

  for (const t of targets) {
    while (true) {
      const curR = await page.evaluate(() => {
        if (!window.goalTunnels || !window.goalTunnels.introStartTime) return 0;
        return (performance.now() - window.goalTunnels.introStartTime) / 1000;
      });
      if (curR >= t.time) break;
      await sleep(15);
    }

    const state = await page.evaluate(() => {
      const curR = (performance.now() - window.goalTunnels.introStartTime) / 1000;
      const titleEl = document.getElementById('home-goal-tunnel-title');
      const introWrap = document.getElementById('intro-tunnel-title-wrapper');
      const bTitle = window.homeGoalSectionRanges.getRange('blackTitle');
      const bTunnel = window.homeGoalSectionRanges.getRange('blackTunnel');
      const curStage = window.visuals && window.visuals.currentStage3D ? window.visuals.currentStage3D.constructor.name : null;
      const rect = titleEl ? titleEl.getBoundingClientRect() : null;

      return {
        r: curR,
        bTitleRatio: bTitle ? bTitle.ratio : null,
        bTunnelRatio: bTunnel ? bTunnel.ratio : null,
        curStage,
        titleInDom: !!titleEl,
        wrapperInDom: !!introWrap,
        wrapperDisplay: introWrap ? introWrap.style.display : null,
        titleParentId: titleEl && titleEl.parentElement ? titleEl.parentElement.id : null,
        titleVisibility: titleEl ? titleEl.style.visibility : null,
        titleOpacity: titleEl ? titleEl.style.opacity : null,
        titleTransform: titleEl ? titleEl.style.transform : null,
        rect: rect ? { top: Math.round(rect.top), bottom: Math.round(rect.bottom), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) } : null
      };
    });

    const shotPath = `shot_intro_${t.id}.png`;
    await page.screenshot({ path: shotPath });
    console.log(`[Captured] ${t.label} -> ${shotPath} | r=${state.r.toFixed(2)}s, stage=${state.curStage}, wrapDisp=${state.wrapperDisplay}, titleParent=${state.titleParentId}, vis=${state.titleVisibility}, op=${state.titleOpacity}, rect=${JSON.stringify(state.rect)}`);
    captures.push({ target: t, shotPath, state });
  }

  // Wait for intro completion
  console.log('Waiting for intro completion...');
  await page.waitForFunction(() => window.properties && window.properties.hasStarted && !window.properties.isIntroWarp, { timeout: 15000 });
  await sleep(1000);

  // --- PART 2: CONFIRM MID-PAGE WARP TITLE STILL WORKS ---
  console.log('\n--- PART 2: Testing Mid-Page Native Warp Title ---');
  const midState = await page.evaluate(() => {
    const r = window.homeGoalSectionRanges;
    const bt = r.items.blackTitle;
    const targetPx = r.baseY + bt.pixelFrom + bt.pixelCount * 0.45;
    window.scrollManager.scrollToPixel(targetPx, true);
    return { targetPx, baseY: r.baseY, pixelFrom: bt.pixelFrom };
  });

  await sleep(400);

  const midCheck = await page.evaluate(() => {
    const el = document.getElementById('home-goal-tunnel-title');
    const comp = el ? window.getComputedStyle(el) : null;
    const rect = el ? el.getBoundingClientRect() : null;
    const bTitle = window.homeGoalSectionRanges.getRange('blackTitle');
    const spans = el ? Array.from(el.querySelectorAll('.home-goal-tunnel-title-line span')).map(s => ({
      text: s.textContent,
      transform: s.style.transform
    })) : [];

    return {
      scrollPixel: window.scrollManager.scrollPixel,
      bTitleRatio: bTitle ? bTitle.ratio : null,
      parentTag: el ? el.parentElement.tagName : null,
      parentId: el ? el.parentElement.id : null,
      inlineVis: el ? el.style.visibility : null,
      inlineOp: el ? el.style.opacity : null,
      compVis: comp ? comp.visibility : null,
      compOp: comp ? comp.opacity : null,
      transform: el ? el.style.transform : null,
      rect: rect ? { top: Math.round(rect.top), bottom: Math.round(rect.bottom), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) } : null,
      spans
    };
  });

  const midShot = 'shot_midpage_recheck_ratio_0.45.png';
  await page.screenshot({ path: midShot });
  console.log('Mid-page check result:', JSON.stringify(midCheck, null, 2));

  // Write report
  const report = {
    errors,
    captures,
    midCheck
  };
  fs.writeFileSync('intro_and_midpage_verification_report.json', JSON.stringify(report, null, 2), 'utf8');

  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log('Errors caught:', errors.length);
  if (errors.length > 0) {
    console.error('Errors:', errors);
  } else {
    console.log('SUCCESS: ZERO console errors!');
  }

  await browser.close();
})();
