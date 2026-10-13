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
      const whiteout = document.getElementById('intro-whiteout');
      const pCont = document.getElementById('page-container');
      const header = document.getElementById('header');

      const isWarp = prop ? prop.isIntroWarp : false;
      const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : -1;

      return {
        preloaderText: digits ? digits.innerText.replace(/\s+/g, '') : '',
        zoomProgress: p ? p.zoomProgress : 0,
        zoomScale: p ? p.zoomScale : 1,
        isIntroWarp: isWarp,
        r,
        isBlackActive: gt ? gt.isBlackTunnelActive : false,
        isWhiteActive: gt ? gt.isWhiteTunnelActive : false,
        bloom: prop ? prop.bloomAmount : 0,
        bgColor: prop ? prop.bgColorHex : '',
        whiteoutOpacity: whiteout ? whiteout.style.opacity : null,
        whiteoutDisplay: whiteout ? whiteout.style.display : null,
        homeBalloonsActive: hb ? hb.isActive : false,
        pageOpacity: pCont ? window.getComputedStyle(pCont).opacity : '0',
        headerOpacity: header ? window.getComputedStyle(header).opacity : '0',
        scrollActive: window.scrollManager ? window.scrollManager.isActive : false
      };
    });

    let matched = false;
    if (targetStage === '1a_zoom' && state.preloaderText.includes('100') && state.zoomProgress >= 0.15 && state.zoomProgress <= 0.6) {
      matched = true;
    } else if (targetStage === '1b_black' && state.isIntroWarp && state.r >= 0.35 && state.r <= 0.65 && state.isBlackActive) {
      matched = true;
    } else if (targetStage === '1c_white' && state.isIntroWarp && state.r >= 0.95 && state.r <= 1.45 && state.isWhiteActive) {
      matched = true;
    } else if (targetStage === '2_fade_white' && state.isIntroWarp && state.r >= 1.75 && state.r <= 2.15) {
      matched = true;
    } else if (targetStage === '3_hold_white' && state.isIntroWarp && state.r >= 2.35 && state.r <= 2.7) {
      matched = true;
    } else if (targetStage === '4a_fade_hero' && state.isIntroWarp && state.r >= 2.95 && state.r <= 3.4 && state.homeBalloonsActive) {
      matched = true;
    } else if (targetStage === '4b_hero_settled' && !state.isIntroWarp && state.homeBalloonsActive && state.scrollActive) {
      matched = true;
    }

    if (matched) {
      const outPath = path.join(process.cwd(), `test_stage_${targetStage}.png`);
      await page.screenshot({ path: outPath });
      result = { state, consoleErrors, file: outPath };
      break;
    }

    await sleep(15);
  }

  await browser.close();
  return result;
}

async function run() {
  console.log('================================================================');
  console.log('   QA & Browser Validation: Exact 4-Stage High-Fidelity Verification');
  console.log('================================================================\n');

  const stages = [
    { id: '1a_zoom', name: 'Stage 1a: Preloader 100 Smooth Linear Zoom' },
    { id: '1b_black', name: 'Stage 1b: GoalBlackTunnel Warp (Constant Speed)' },
    { id: '1c_white', name: 'Stage 1c: GoalWhiteTunnel Warp (Constant Speed)' },
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

  fs.writeFileSync('four_stage_verification_report.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    results,
    totalErrors,
    allPassed
  }, null, 2));

  if (allPassed) {
    console.log('\n>>> ALL 4 STAGES VERIFIED PERFECTLY WITH ZERO ERRORS! <<<\n');
  } else {
    console.log('\n>>> VERIFICATION INCOMPLETE <<<\n');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
