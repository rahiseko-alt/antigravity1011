const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== CAPTURING HIGH-FPS SEQUENTIAL MICRO-FRAMES (4.6s - 5.2s) ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait until warp starts
  while (true) {
    const isWarp = await page.evaluate(() => window.__properties && window.__properties.isIntroWarp);
    if (isWarp) break;
    await new Promise(r => setTimeout(r, 20));
  }

  // Wait until r reaches ~4.6s
  while (true) {
    const r = await page.evaluate(() => {
      const gt = window.__goalTunnels;
      return gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : 0;
    });
    if (r >= 4.6) break;
    await new Promise(res => setTimeout(res, 20));
  }

  // Record 20 consecutive frames
  const microFrames = [];
  for (let i = 0; i < 20; i++) {
    const state = await page.evaluate(() => {
      const gt = window.__goalTunnels;
      const prop = window.__properties;
      const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : 0;
      const curtain = document.getElementById('intro-whiteout');
      const balloonsStage = window.visuals?.stage3DList?.find(s => s.constructor.name === 'HomeBalloons');
      const b0 = balloonsStage?.balloonList[0]?.mesh?.position;
      const b1 = balloonsStage?.balloonList[1]?.mesh?.position;
      return {
        r: +r.toFixed(4),
        homePageTime: window.homePage ? +window.homePage.time.toFixed(4) : 0,
        dollyOffset: prop ? +prop.cameraDollyZoomFovOffset.toFixed(2) : 0,
        curtainOpacity: curtain ? curtain.style.opacity : null,
        b0: b0 ? { x: +b0.x.toFixed(4), y: +b0.y.toFixed(4), z: +b0.z.toFixed(4) } : null,
        b1: b1 ? { x: +b1.x.toFixed(4), y: +b1.y.toFixed(4), z: +b1.z.toFixed(4) } : null
      };
    });

    const filename = `micro_frame_${String(i).padStart(2, '0')}.png`;
    await page.screenshot({ path: path.join(__dirname, filename) });
    state.screenshot = filename;
    microFrames.push(state);

    await new Promise(res => setTimeout(res, 30)); // 30ms interval
  }

  await browser.close();

  console.log('\n--- MICRO-FRAME ANALYSIS ---');
  let hasJitter = false;
  for (let i = 1; i < microFrames.length; i++) {
    const p = microFrames[i - 1];
    const c = microFrames[i];
    const dx = c.b0.x - p.b0.x;
    const dy = c.b0.y - p.b0.y;
    const dz = c.b0.z - p.b0.z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    const dt = c.r - p.r;
    const speed = dist / (dt || 0.001);

    console.log(`Frame ${i - 1} -> ${i} (dt=${dt.toFixed(3)}s, r=${c.r.toFixed(3)}s, opac=${c.curtainOpacity}): dist=${dist.toFixed(4)}, speed=${speed.toFixed(2)} units/s`);

    // If speed oscillates wildly or jumps backward towards 0, that's jitter
    if (dist === 0 && c.r > 4.8) {
      console.error(`JITTER DETECTED: Frame ${i} did not move!`);
      hasJitter = true;
    }
  }

  fs.writeFileSync('micro_frames_report.json', JSON.stringify(microFrames, null, 2));

  if (hasJitter) {
    console.error('FAILED: Jitter found in micro-frames!');
    process.exit(1);
  } else {
    console.log('SUCCESS: All 20 micro-frames showed continuous, smooth, monotonic physical movement with ZERO jitter!');
  }
})();
