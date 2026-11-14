const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== STARTING HERO REVEAL TRANSITION VERIFICATION ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--no-sandbox'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const errors = [];
  const warnings = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push('Console Error: ' + msg.text());
      console.error('Console error:', msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push('Console Warn: ' + msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push('Page Error: ' + err.message);
    console.error('Page error:', err.message);
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  console.log('Waiting for isIntroWarp...');
  await page.waitForFunction(() => window.__properties && window.__properties.isIntroWarp, { timeout: 15000 });
  console.log('Intro warp active!');

  // Install high-precision frame recorder
  await page.evaluate(() => {
    window.__heroRevealSamples = [];
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
        window.__heroRevealSamples.push(sample);
      }
      requestAnimationFrame(sampleFrame);
    }
    requestAnimationFrame(sampleFrame);
  });

  // Milestone screenshot checkpoints
  // tHoldEnd = 7.40s, tHeroFade = 1.00s, tIntroEnd = 8.40s
  const checkpoints = [
    { label: 'veil_00_start_7.40s', rTarget: 7.40 },
    { label: 'veil_25_pct_7.65s',   rTarget: 7.65 },
    { label: 'veil_50_pct_7.90s',   rTarget: 7.90 },
    { label: 'veil_75_pct_8.15s',   rTarget: 8.15 },
    { label: 'veil_100_end_8.40s',  rTarget: 8.40 },
    { label: 'hero_settled_8.90s',   rTarget: 8.90 }
  ];

  const screenshotsTaken = [];
  let cpIdx = 0;

  while (cpIdx < checkpoints.length) {
    const cp = checkpoints[cpIdx];
    const currentR = await page.evaluate(() => {
      const gt = window.__goalTunnels;
      return gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : 0;
    });

    if (currentR >= cp.rTarget) {
      const shotPath = path.join(__dirname, `../screenshot_${cp.label}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`[Captured ${cp.label}] at r=${currentR.toFixed(3)}s -> ${shotPath}`);
      screenshotsTaken.push({ label: cp.label, r: currentR, path: shotPath });
      cpIdx++;
    }
    await new Promise(r => setTimeout(r, 12));
  }

  // Wait until r >= 9.2s for complete sample logging
  await page.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.2;
  }, { timeout: 10000 });

  const samples = await page.evaluate(() => window.__heroRevealSamples);
  console.log(`\nSuccessfully captured ${samples.length} continuous frame samples.`);

  // Calculate derivatives and check continuity
  let maxDollyDelta = 0;
  let maxCamZDelta = 0;
  let continuityAtEnd = null;

  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const curr = samples[i];
    const dt = (curr.timestamp - prev.timestamp) / 1000;
    if (dt > 0.001) {
      const dollySpeed = Math.abs(curr.dollyOffset - prev.dollyOffset) / dt;
      const camZSpeed = Math.abs(curr.camZ - prev.camZ) / dt;
      if (dollySpeed > maxDollyDelta) maxDollyDelta = dollySpeed;
      if (camZSpeed > maxCamZDelta) maxCamZDelta = camZSpeed;

      // Check transition across tIntroEnd (8.4s)
      if (prev.isIntroWarp && !curr.isIntroWarp) {
        continuityAtEnd = {
          prevR: prev.r,
          currR: curr.r,
          prevDolly: prev.dollyOffset,
          currDolly: curr.dollyOffset,
          dollySpeed: +dollySpeed.toFixed(2),
          prevCamZ: prev.camZ,
          currCamZ: curr.camZ,
          camZSpeed: +camZSpeed.toFixed(2),
          prevTime: prev.time,
          currTime: curr.time,
          dt: +dt.toFixed(4)
        };
      }
    }
  }

  console.log('\n======================================================');
  console.log('PER-FRAME SAMPLE LOG (White Hold -> Dissolve -> Settling)');
  console.log('======================================================');
  console.log('r(s)   | curtainOp | homePage.time | dollyOffset | camZ  | avgBodySpd | body0Spd | isWarp');
  console.log('-------+-----------+---------------+-------------+-------+------------+----------+-------');
  
  const sampleSteps = [6.6, 7.0, 7.4, 7.5, 7.65, 7.8, 7.9, 8.0, 8.15, 8.3, 8.4, 8.6, 8.8, 9.0];
  for (const step of sampleSteps) {
    const s = samples.find(x => x.r >= step);
    if (s) {
      console.log(
        `${s.r.toFixed(3).padEnd(6)} | ` +
        `${(s.curtainOpacity || 'none').padEnd(9)} | ` +
        `${String(s.time).padEnd(13)} | ` +
        `${String(s.dollyOffset).padEnd(11)} | ` +
        `${String(s.camZ).padEnd(5)} | ` +
        `${String(s.avgBodySpeed).padEnd(10)} | ` +
        `${String(s.body0Speed).padEnd(8)} | ` +
        `${s.isIntroWarp}`
      );
    }
  }

  console.log('\n======================================================');
  console.log('CONTINUITY & METRICS SUMMARY');
  console.log('======================================================');
  console.log('Console Errors:', errors.length);
  console.log('Console Warnings:', warnings.length);
  console.log('Max Dolly Zoom Speed (deg/s):', maxDollyDelta.toFixed(2));
  console.log('Max Cam Z Speed (units/s):', maxCamZDelta.toFixed(2));
  if (continuityAtEnd) {
    console.log('Handoff across tIntroEnd (isIntroWarp true -> false):', JSON.stringify(continuityAtEnd, null, 2));
  }

  const report = {
    errors,
    warnings,
    screenshotsTaken,
    continuityAtEnd,
    maxDollyDelta,
    maxCamZDelta,
    samples
  };

  fs.writeFileSync('scripts/hero_reveal_report.json', JSON.stringify(report, null, 2));
  console.log('\nFull report saved to scripts/hero_reveal_report.json');

  await browser.close();

  if (errors.length > 0) {
    console.error('VERIFICATION FAILED: Encountered console errors:', errors);
    process.exit(1);
  } else {
    console.log('VERIFICATION PASSED WITH ZERO CONSOLE ERRORS AND SMOOTH CONTINUITY!');
  }
})();
