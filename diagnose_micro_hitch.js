const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== STARTING HIGH PRECISION MICRO-HITCH DIAGNOSTIC (r = 4.4s to 6.4s) ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.evaluateOnNewDocument(() => {
    window.__frameLogs = [];
    let frameIdx = 0;
    let prevTime = performance.now();

    const origRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(cb) {
      return origRAF.call(window, function(timestamp) {
        try {
          const gt = window.__goalTunnels;
          const prop = window.__properties;
          const hbp = window.__hbp;
          const r = (gt && gt.introStartTime) ? (timestamp - gt.introStartTime) / 1000 : 0;

          if (r >= 4.4 && r <= 6.4) {
            const dt = (timestamp - prevTime) / 1000;
            const curtain = document.getElementById('intro-whiteout');
            const pageCont = document.getElementById('page-container');

            let bodies = null;
            if (hbp && hbp.bodies) {
              bodies = hbp.bodies.map((b, idx) => ({
                idx,
                p: { x: b.position.x, y: b.position.y, z: b.position.z },
                v: { x: b.velocity.x, y: b.velocity.y, z: b.velocity.z },
                q: { x: b.quaternion.x, y: b.quaternion.y, z: b.quaternion.z, w: b.quaternion.w }
              }));
            }

            window.__frameLogs.push({
              frameIdx: frameIdx++,
              timestamp,
              dt,
              r,
              isIntroWarp: prop ? prop.isIntroWarp : null,
              homePageTime: window.homePage ? window.homePage.time : null,
              cameraPos: prop && prop.camera ? { x: prop.camera.position.x, y: prop.camera.position.y, z: prop.camera.position.z } : null,
              cameraFov: prop && prop.camera ? prop.camera.fov : null,
              dollyOffset: prop ? prop.cameraDollyZoomFovOffset : null,
              cameraViewportOffsetY: prop ? prop.cameraViewportOffsetY : null,
              curtainOpacity: curtain ? curtain.style.opacity : null,
              curtainDisplay: curtain ? curtain.style.display : null,
              pageOpacity: pageCont ? pageCont.style.opacity : null,
              bodies
            });
          }
          prevTime = timestamp;
        } catch (e) {
          console.error(e);
        }
        cb(timestamp);
      });
    };
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait until r reaches 6.5s
  while (true) {
    const r = await page.evaluate(() => {
      const gt = window.__goalTunnels;
      return (gt && gt.introStartTime) ? (performance.now() - gt.introStartTime) / 1000 : 0;
    });
    if (r >= 6.5) break;
    await new Promise(res => setTimeout(res, 50));
  }

  const logs = await page.evaluate(() => window.__frameLogs);
  await browser.close();

  fs.writeFileSync('diagnostic_frames_raw.json', JSON.stringify(logs, null, 2));
  console.log(`Successfully recorded ${logs.length} consecutive animation frames!`);

  // Analyze frames
  console.log('\n--- DETAILED FRAME ANALYSIS ---');
  let maxAccSpike = 0;
  let maxAccSpikeInfo = null;

  for (let i = 1; i < logs.length; i++) {
    const prev = logs[i - 1];
    const curr = logs[i];
    const dt = (curr.timestamp - prev.timestamp) / 1000;

    if (!curr.bodies || !prev.bodies) continue;

    // Check camera step
    const camDx = curr.cameraPos.x - prev.cameraPos.x;
    const camDy = curr.cameraPos.y - prev.cameraPos.y;
    const camDz = curr.cameraPos.z - prev.cameraPos.z;
    const camDist = Math.sqrt(camDx*camDx + camDy*camDy + camDz*camDz);
    const fovStep = curr.cameraFov - prev.cameraFov;

    // Analyze every body
    for (let b = 0; b < curr.bodies.length; b++) {
      const bPrev = prev.bodies[b];
      const bCurr = curr.bodies[b];

      // Displacement
      const dx = bCurr.p.x - bPrev.p.x;
      const dy = bCurr.p.y - bPrev.p.y;
      const dz = bCurr.p.z - bPrev.p.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

      // Velocity change (acceleration)
      const dvx = (bCurr.v.x - bPrev.v.x);
      const dvy = (bCurr.v.y - bPrev.v.y);
      const dvz = (bCurr.v.z - bPrev.v.z);
      const dv = Math.sqrt(dvx*dvx + dvy*dvy + dvz*dvz);
      const acc = dv / (dt || 0.016);

      // Check if velocity derivative spiked
      if (acc > maxAccSpike) {
        maxAccSpike = acc;
        maxAccSpikeInfo = {
          frame: curr.frameIdx,
          r: curr.r,
          bodyIdx: b,
          acc,
          dt,
          isIntroWarp: curr.isIntroWarp,
          prevWarp: prev.isIntroWarp,
          curtainOpacity: curr.curtainOpacity,
          camDist,
          fovStep
        };
      }

      if (acc > 50) { // Large sudden spike
        console.warn(`[SPIKE DETECTED] Frame ${curr.frameIdx} (r=${curr.r.toFixed(3)}s, warp=${curr.isIntroWarp}): Body ${b} acc=${acc.toFixed(2)} units/s^2, dv=${dv.toFixed(4)}, dist=${dist.toFixed(4)}`);
      }
    }

    if (prev.isIntroWarp !== curr.isIntroWarp) {
      console.log(`\n>>> STATE HANDOFF at frame ${curr.frameIdx} (r=${curr.r.toFixed(3)}s): isIntroWarp changed from ${prev.isIntroWarp} to ${curr.isIntroWarp} <<<`);
      console.log(`    camDist=${camDist.toFixed(4)}, fovStep=${fovStep.toFixed(4)}, dt=${(dt*1000).toFixed(2)}ms`);
    }
  }

  console.log('\nMaximum acceleration spike found:', maxAccSpikeInfo);
})();
