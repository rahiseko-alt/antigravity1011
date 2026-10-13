const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const launchArgs = [
  '--use-gl=angle',
  '--use-angle=default',
  '--enable-webgl',
  '--enable-webgl2-compute-context',
  '--ignore-gpu-blocklist',
  '--disable-gpu-sandbox',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--window-size=1920,1080'
];

async function capturePass(targetStage) {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: launchArgs
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('font-size:0;color:transparent') && !text.includes('ERR_CONNECTION_CLOSED')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  if (targetStage === '1a_zoom_approach') {
    await page.evaluateOnNewDocument(() => {
      window.__FREEZE_ZOOM_PROGRESS = 0.55;
    });
  }

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  const start = Date.now();
  let result = null;

  while (Date.now() - start < 15000) {
    const state = await page.evaluate(() => {
      const p = window.__preloader;
      const gt = window.__goalTunnels || window.goalTunnels;
      const hb = window.__homeBalloons || window.homeBalloons;
      const prop = window.__properties;
      const digits = document.getElementById('preloader-percent-digits');
      const blackout = document.getElementById('intro-blackout');
      const whiteout = document.getElementById('intro-whiteout');
      const pCont = document.getElementById('page-container');
      const header = document.getElementById('header');

      const isWarp = prop ? prop.isIntroWarp : false;
      const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : -1;

      return {
        preloaderText: digits ? digits.innerText.replace(/\s+/g, '') : '',
        zoomProgress: p ? p.zoomProgress : 0,
        zoomScale: p ? p.zoomScale : 1,
        digitsOpacity: digits ? digits.style.opacity : '',
        isIntroWarp: isWarp,
        r,
        isBlackActive: gt ? gt.isBlackTunnelActive : false,
        isWhiteActive: gt ? gt.isWhiteTunnelActive : false,
        bloom: prop ? prop.bloomAmount : 0,
        bgColor: prop ? prop.bgColorHex : '',
        blackoutOpacity: blackout ? blackout.style.opacity : null,
        blackoutDisplay: blackout ? blackout.style.display : null,
        whiteoutOpacity: whiteout ? whiteout.style.opacity : null,
        whiteoutDisplay: whiteout ? whiteout.style.display : null,
        homeBalloonsActive: hb ? hb.isActive : false,
        pageOpacity: pCont ? window.getComputedStyle(pCont).opacity : '0',
        headerOpacity: header ? window.getComputedStyle(header).opacity : '0',
        scrollActive: window.scrollManager ? window.scrollManager.isActive : false
      };
    });

    let matched = false;
    if (targetStage === '1a_zoom_approach') {
      if (state.zoomProgress >= 0.4 && state.zoomScale > 2) {
        matched = true;
      }
    } else if (targetStage === '1b_pure_black_interval') {
      // The "間": Pure Black stillness (#000000, 0 graphics, 0.0s to 0.55s)
      if (state.isIntroWarp && state.r >= 0.05 && state.r <= 0.54 && !state.isBlackActive && !state.isWhiteActive && state.bloom === 0) {
        matched = true;
      }
    } else if (targetStage === '1c_warp_fadein') {
      // Fade-in from Black to Warp (0.55s to 1.15s)
      if (state.isIntroWarp && state.r >= 0.58 && state.r <= 1.12 && state.isBlackActive) {
        matched = true;
      }
    } else if (targetStage === '1d_black_warp_full') {
      // Full black tunnel warp (1.15s to 1.60s)
      if (state.isIntroWarp && state.r >= 1.18 && state.r <= 1.58 && state.isBlackActive) {
        matched = true;
      }
    } else if (targetStage === '1e_white_warp') {
      // White tunnel warp (1.60s to 2.30s)
      if (state.isIntroWarp && state.r >= 1.65 && state.r <= 2.25 && state.isWhiteActive) {
        matched = true;
      }
    } else if (targetStage === '2_fade_white') {
      // Fade into pure white (2.30s to 2.90s)
      if (state.isIntroWarp && state.r >= 2.35 && state.r <= 2.85) {
        matched = true;
      }
    } else if (targetStage === '3_hold_white') {
      // Hold pure white (2.90s to 3.50s)
      if (state.isIntroWarp && state.r >= 2.95 && state.r <= 3.48 && state.whiteoutOpacity === '1') {
        matched = true;
      }
    } else if (targetStage === '4a_fade_hero') {
      // Fade into hero (3.50s to 4.20s)
      if (state.isIntroWarp && state.r >= 3.55 && state.r <= 4.15 && state.homeBalloonsActive) {
        matched = true;
      }
    } else if (targetStage === '4b_hero_settled') {
      // Hero settled & scroll active (r >= 4.20s)
      if ((!state.isIntroWarp || state.r >= 4.20) && state.homeBalloonsActive && state.scrollActive) {
        matched = true;
      }
    }

    if (matched) {
      const outPath = path.join(process.cwd(), `test_timing_${targetStage}.png`);
      await page.screenshot({ path: outPath });
      result = { state, consoleErrors, file: outPath };
      break;
    }

    await sleep(10);
  }

  await browser.close();
  return result;
}

async function run() {
  console.log('================================================================');
  console.log('   QA & Validation: Perfect "間" & Warp Choreography Verification');
  console.log('================================================================\n');

  const stages = [
    { id: '1a_zoom_approach', name: 'Stage 1a: Approach 100 Zoom & Dissolve Simultaneously' },
    { id: '1b_pure_black_interval', name: 'Stage 1b: The "間" - Pure Black Stillness (0.55s)' },
    { id: '1c_warp_fadein', name: 'Stage 1c: Fade-in from Black to Cyber Grid Warp (0.60s)' },
    { id: '1d_black_warp_full', name: 'Stage 1d: GoalBlackTunnel Warp Full Visibility' },
    { id: '1e_white_warp', name: 'Stage 1e: GoalWhiteTunnel Warp (Constant Speed)' },
    { id: '2_fade_white', name: 'Stage 2: Fade-in to Pure White (~0.6s)' },
    { id: '3_hold_white', name: 'Stage 3: Hold Pure White Screen (~0.6s)' },
    { id: '4a_fade_hero', name: 'Stage 4a: Fade-in to HERO Scene (~0.7s)' },
    { id: '4b_hero_settled', name: 'Stage 4b: Hero Settled & Scroll Unlocked' }
  ];

  const results = {};
  let totalErrors = 0;

  for (const stage of stages) {
    process.stdout.write(`Capturing ${stage.name} ... `);
    const res = await capturePass(stage.id);
    if (res) {
      console.log('SUCCESS');
      console.log(`   Telemetry -> r: ${res.state.r.toFixed(2)}s, Bloom: ${res.state.bloom}, Blackout: ${res.state.blackoutOpacity}, Whiteout: ${res.state.whiteoutOpacity}`);
      results[stage.id] = {
        name: stage.name,
        state: res.state,
        file: res.file,
        errors: res.consoleErrors
      };
      totalErrors += res.consoleErrors.length;
    } else {
      console.log('FAILED (Timeout)');
      results[stage.id] = { name: stage.name, failed: true };
    }
  }

  console.log('\n================================================================');
  console.log('   Verification Summary');
  console.log('================================================================');
  for (const s of stages) {
    const passed = results[s.id] && !results[s.id].failed;
    console.log(`${s.name}: ${passed ? 'PASS' : 'FAIL'}`);
  }
  console.log(`Total Console Errors: ${totalErrors}`);

  const allPassed = stages.every(s => results[s.id] && !results[s.id].failed) && totalErrors === 0;

  fs.writeFileSync('interval_warp_verification_report.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    totalErrors,
    allPassed
  }, null, 2));

  if (allPassed) {
    console.log('\n>>> ALL CHOREOGRAPHY STAGES VERIFIED PERFECTLY WITH ZERO ERRORS! <<<\n');
  } else {
    console.log('\n>>> VERIFICATION INCOMPLETE <<<\n');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
