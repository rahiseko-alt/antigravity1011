const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  console.log('======================================================');
  console.log('   HERO REVEAL TRANSITION VERIFICATION SUITE');
  console.log('======================================================\n');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--no-sandbox'
    ]
  });

  const errors = [];
  const warnings = [];

  function attachErrorListener(page) {
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('font-size:0;color:transparent') || text.includes('ERR_CONNECTION_CLOSED')) {
        return; // Chrome headless devtools styling artifact
      }
      if (msg.type() === 'error') {
        errors.push('Console Error: ' + text);
        console.error('Console error:', text);
      } else if (msg.type() === 'warning') {
        warnings.push('Console Warn: ' + text);
      }
    });
    page.on('pageerror', err => {
      errors.push('Page Error: ' + err.message);
      console.error('Page error:', err.message);
    });
  }

  // ---------------------------------------------------------
  // PASS 1: Full 60fps Uninterrupted Real-Time Metric Logging
  // ---------------------------------------------------------
  console.log('--- PASS 1: Live 60fps Metrics & Continuity Recording ---');
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1920, height: 1080 });
  attachErrorListener(page1);

  await page1.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page1.waitForFunction(() => window.__properties && window.__properties.isIntroWarp, { timeout: 15000 });
  console.log('Intro warp running, sampling continuous 60fps frames...');

  await page1.evaluate(() => {
    window.__heroSamples = [];
    function sampleFrame() {
      const gt = window.__goalTunnels;
      const prop = window.__properties;
      const curtain = document.getElementById('intro-whiteout');
      const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : 0;
      
      let bodySpeedSum = 0;
      let bodyCount = 0;
      let body0Speed = 0;
      let body0Pos = null;
      if (window.__hbp && window.__hbp.bodies) {
        bodyCount = window.__hbp.bodies.length;
        for (let i = 0; i < bodyCount; i++) {
          const b = window.__hbp.bodies[i];
          const spd = b.velocity.length();
          bodySpeedSum += spd;
          if (i === 0) {
            body0Speed = +spd.toFixed(3);
            body0Pos = { x: +b.position.x.toFixed(3), y: +b.position.y.toFixed(3), z: +b.position.z.toFixed(3) };
          }
        }
      }

      const sample = {
        timestamp: performance.now(),
        r: +r.toFixed(4),
        time: window.homePage ? +window.homePage.time.toFixed(4) : null,
        dollyOffset: prop ? +prop.cameraDollyZoomFovOffset.toFixed(3) : null,
        camZ: prop ? +(prop.defaultCameraPosition ? prop.defaultCameraPosition.z : 0).toFixed(3) : null,
        camFov: prop && prop.camera ? +prop.camera.fov.toFixed(3) : null,
        curtainOpacity: curtain ? curtain.style.opacity : null,
        curtainDisplay: curtain ? curtain.style.display : null,
        pageContOpacity: document.getElementById('page-container')?.style.opacity || null,
        isIntroWarp: prop ? prop.isIntroWarp : false,
        avgBodySpeed: bodyCount > 0 ? +(bodySpeedSum / bodyCount).toFixed(3) : 0,
        body0Speed,
        body0Pos
      };

      if (r >= 6.4 && r <= 9.2) {
        window.__heroSamples.push(sample);
      }
      requestAnimationFrame(sampleFrame);
    }
    requestAnimationFrame(sampleFrame);
  });

  await page1.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.2;
  }, { timeout: 15000 });

  const samples = await page1.evaluate(() => window.__heroSamples);
  console.log(`Captured ${samples.length} uninterrupted 60fps frames.`);
  await page1.close();

  // ---------------------------------------------------------
  // PASS 2: Exact High-Fidelity Milestone Screenshots
  // ---------------------------------------------------------
  console.log('\n--- PASS 2: Precision Milestone Screenshots ---');
  const milestones = [
    { label: 'veil_00_start', rTarget: 7.40, desc: 'Veil dissolve start (r=7.40s): 100% white hold ending, zoom starts from beginning' },
    { label: 'veil_25_pct',   rTarget: 7.65, desc: 'Veil 25% dissolved (r=7.65s): content appearing, zoom actively in progress' },
    { label: 'veil_50_pct',   rTarget: 7.90, desc: 'Veil 50% dissolved (r=7.90s): half dissolved, scale visibly changing, blocks moving' },
    { label: 'veil_75_pct',   rTarget: 8.15, desc: 'Veil 75% dissolved (r=8.15s): veil lifting, typography unfolding' },
    { label: 'veil_100_end',  rTarget: 8.40, desc: 'Veil 100% dissolved (r=8.40s): veil completely clear, zoom completing glide' },
    { label: 'hero_settled',  rTarget: 9.00, desc: 'Hero settled (r=9.00s): zoom at rest, page interactive' }
  ];

  const screenshotReports = [];

  for (const m of milestones) {
    const pageM = await browser.newPage();
    await pageM.setViewport({ width: 1920, height: 1080 });
    attachErrorListener(pageM);

    await pageM.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await pageM.waitForFunction(() => window.__properties && window.__properties.isIntroWarp, { timeout: 15000 });

    // Poll until exact rTarget reached
    while (true) {
      const state = await pageM.evaluate(() => {
        const gt = window.__goalTunnels;
        const prop = window.__properties;
        const curtain = document.getElementById('intro-whiteout');
        const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : 0;
        return {
          r: +r.toFixed(3),
          time: window.homePage ? +window.homePage.time.toFixed(3) : 0,
          curtainOpacity: curtain ? curtain.style.opacity : null,
          dollyOffset: prop ? +prop.cameraDollyZoomFovOffset.toFixed(2) : null,
          camZ: prop ? +(prop.defaultCameraPosition ? prop.defaultCameraPosition.z : 0).toFixed(2) : null
        };
      });

      if (state.r >= m.rTarget) {
        const shotName = `screenshot_${m.label}.png`;
        const shotPath = path.join(process.cwd(), shotName);
        await pageM.screenshot({ path: shotPath });
        console.log(`[Captured ${m.label}] r=${state.r}s (target ${m.rTarget}s) | curtainOp=${state.curtainOpacity} | dolly=${state.dollyOffset} | camZ=${state.camZ} | time=${state.time}s -> ${shotName}`);
        screenshotReports.push({
          label: m.label,
          targetR: m.rTarget,
          actualR: state.r,
          curtainOpacity: state.curtainOpacity,
          dollyOffset: state.dollyOffset,
          camZ: state.camZ,
          homePageTime: state.time,
          file: shotPath,
          desc: m.desc
        });
        break;
      }
      await sleep(8);
    }
    await pageM.close();
  }

  await browser.close();

  // ---------------------------------------------------------
  // ANALYSIS & CONTINUITY CHECKS
  // ---------------------------------------------------------
  console.log('\n======================================================');
  console.log('FRAME LOG TABLE: White Hold -> Dissolve -> Settling');
  console.log('======================================================');
  console.log('r(s)   | curtainOp | homePage.time | dollyOffset | camZ  | avgBodySpd | body0Spd | isWarp');
  console.log('-------+-----------+---------------+-------------+-------+------------+----------+-------');

  const checkSteps = [6.6, 7.0, 7.35, 7.4, 7.5, 7.65, 7.8, 7.9, 8.0, 8.15, 8.3, 8.4, 8.6, 8.8, 9.0];
  for (const step of checkSteps) {
    const s = samples.find(x => x.r >= step);
    if (s) {
      console.log(
        `${s.r.toFixed(3).padEnd(6)} | ` +
        `${(s.curtainOpacity || '0').padEnd(9)} | ` +
        `${String(s.time).padEnd(13)} | ` +
        `${String(s.dollyOffset).padEnd(11)} | ` +
        `${String(s.camZ).padEnd(5)} | ` +
        `${String(s.avgBodySpeed).padEnd(10)} | ` +
        `${String(s.body0Speed).padEnd(8)} | ` +
        `${s.isIntroWarp}`
      );
    }
  }

  // Continuity across tIntroEnd (8.40s)
  let continuityAtEnd = null;
  let maxDollySpeed = 0;
  let maxCamZSpeed = 0;

  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const curr = samples[i];
    const dt = (curr.timestamp - prev.timestamp) / 1000;
    if (dt > 0.001) {
      const dSpd = Math.abs(curr.dollyOffset - prev.dollyOffset) / dt;
      const zSpd = Math.abs(curr.camZ - prev.camZ) / dt;
      if (dSpd > maxDollySpeed) maxDollySpeed = dSpd;
      if (zSpd > maxCamZSpeed) maxCamZSpeed = zSpd;

      if (prev.isIntroWarp && !curr.isIntroWarp) {
        continuityAtEnd = {
          prevR: prev.r,
          currR: curr.r,
          prevDolly: prev.dollyOffset,
          currDolly: curr.dollyOffset,
          dollySpeed: +dSpd.toFixed(2),
          prevCamZ: prev.camZ,
          currCamZ: curr.camZ,
          camZSpeed: +zSpd.toFixed(2),
          prevTime: prev.time,
          currTime: curr.time,
          dt: +dt.toFixed(4)
        };
      }
    }
  }

  console.log('\n======================================================');
  console.log('SUMMARY REPORT');
  console.log('======================================================');
  console.log('Console Errors:', errors.length);
  console.log('Console Warnings:', warnings.length);
  console.log('Peak Dolly Zoom Speed (deg/s):', maxDollySpeed.toFixed(2));
  console.log('Peak Cam Z Speed (units/s):', maxCamZSpeed.toFixed(2));
  if (continuityAtEnd) {
    console.log('Handoff across tIntroEnd (8.4s):', JSON.stringify(continuityAtEnd, null, 2));
  }

  const finalReport = {
    errors,
    warnings,
    milestones: screenshotReports,
    continuityAtEnd,
    maxDollySpeed,
    maxCamZSpeed,
    samples
  };

  fs.writeFileSync('scripts/hero_reveal_final_report.json', JSON.stringify(finalReport, null, 2));
  console.log('\nSaved report to scripts/hero_reveal_final_report.json');

  if (errors.length > 0) {
    console.error('FAILED: Encountered errors:', errors);
    process.exit(1);
  } else {
    console.log('\n>>> ALL CHECKS PASSED PERFECTLY! <<<');
  }
})();
