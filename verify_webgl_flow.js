const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runVerification() {
  console.log('=== WebGL Browser Verification & Screenshot Capture ===');
  
  // Browser binary discovery
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;
  console.log(`Using browser executable: ${executablePath}`);

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
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const consoleLogs = [];
  const consoleErrors = [];
  const webglWarnings = [];
  const failedRequests = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push({ type, text });

    if (type === 'error') {
      consoleErrors.push(text);
      console.error(`[Browser Error]: ${text}`);
    } else if (text.toLowerCase().includes('webgl') || text.toLowerCase().includes('gl_')) {
      if (type === 'warning' || text.toLowerCase().includes('warning') || text.toLowerCase().includes('error')) {
        webglWarnings.push(text);
        console.warn(`[WebGL Warning/Log]: ${text}`);
      }
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error(`[Browser PageError]: ${err.message}`);
  });

  page.on('requestfailed', req => {
    failedRequests.push({
      url: req.url(),
      failure: req.failure() ? req.failure().errorText : 'unknown'
    });
  });

  const cwd = process.cwd();
  const screenshots = {
    t0_preloader: path.join(cwd, 'verify_t0_preloader.png'),
    t1_cyber_grid_tunnel: path.join(cwd, 'verify_t1_cyber_grid_tunnel.png'),
    t2_white_tunnel_burst: path.join(cwd, 'verify_t2_white_tunnel_burst.png'),
    t2_5_hero_landing: path.join(cwd, 'verify_t2_5_hero_landing.png')
  };

  const verificationData = {
    t0: null,
    t1: null,
    t2: null,
    t2_5: null,
    consoleErrors,
    webglWarnings,
    failedRequests
  };

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // -------------------------------------------------------------
  // 1. T+0s: Preloader countdown (0% -> 100%)
  // -------------------------------------------------------------
  console.log('\n[Phase 1] Monitoring Preloader Countdown (T+0s)...');
  await sleep(250); // allow initial preloader frame to render
  
  const t0State = await page.evaluate(() => {
    const digitsContainer = document.getElementById('preloader-percent-digits');
    const preloaderEl = document.getElementById('preloader');
    const digits = document.querySelectorAll('.preloader-percent-digit');
    let digitText = '';
    digits.forEach(d => {
      const nums = d.querySelectorAll('.preloader-percent-digit-num');
      nums.forEach(n => {
        if (n.style.display !== 'none' && n.innerText) digitText += n.innerText.trim();
      });
    });
    return {
      preloaderVisible: preloaderEl ? window.getComputedStyle(preloaderEl).display !== 'none' : false,
      digitsContainerOpacity: digitsContainer ? window.getComputedStyle(digitsContainer).opacity : '0',
      digitCount: digits.length,
      digitText: digitText || '000',
      hasStarted: window.properties ? window.properties.hasStarted : false
    };
  });

  await page.screenshot({ path: screenshots.t0_preloader });
  console.log(`-> Captured T+0s Screenshot: ${screenshots.t0_preloader}`);
  console.log('   T+0 State:', JSON.stringify(t0State));
  verificationData.t0 = t0State;

  // -------------------------------------------------------------
  // Wait for Opening Warp to trigger
  // -------------------------------------------------------------
  console.log('\nWaiting for Opening Warp activation...');
  let warpStartTime = null;
  const maxWarpWaitMs = 15000;
  const pollStart = Date.now();

  while (Date.now() - pollStart < maxWarpWaitMs) {
    const warpInfo = await page.evaluate(() => {
      const warp = window.__openingWarp;
      return {
        active: warp ? warp.active : false,
        progress: warp ? warp.progress : 0,
        hasStarted: window.properties ? window.properties.hasStarted : false
      };
    });

    if (warpInfo && warpInfo.active) {
      warpStartTime = Date.now();
      const prog = typeof warpInfo.progress === 'number' ? warpInfo.progress.toFixed(3) : '0.000';
      console.log(`-> Opening Warp ACTIVATED! (progress: ${prog})`);
      break;
    }
    await sleep(40);
  }

  if (!warpStartTime) {
    throw new Error('Opening Warp did not activate within timeout!');
  }

  // -------------------------------------------------------------
  // 2. T+1.0s: The REAL 3D cyber grid tunnel / FBO feedback in action
  // -------------------------------------------------------------
  console.log('\n[Phase 2] Capturing REAL 3D cyber grid tunnel / FBO feedback (T+1.0s)...');
  
  // Wait until warp is in black cyber grid tunnel phase
  for (let i = 0; i < 100; i++) {
    const s = await page.evaluate(() => {
      const warp = window.__openingWarp;
      const gt = window.goalTunnels || window.__goalTunnels;
      return {
        active: warp ? warp.active : false,
        progress: warp ? warp.progress : 0,
        isBlackActive: gt ? gt.isBlackTunnelActive : false
      };
    });
    if (s.active && (s.isBlackActive || (s.progress >= 0.20 && s.progress < 0.60))) {
      console.log(`   Reaching Cyber Grid Tunnel sweet spot (progress: ${s.progress.toFixed(3)})`);
      break;
    }
    await sleep(20);
  }

  const t1State = await page.evaluate(() => {
    const warp = window.__openingWarp;
    const currentStage = window.visuals && window.visuals.currentStage3D ? window.visuals.currentStage3D.constructor.name : 'none';
    const goalTunnels = window.goalTunnels || window.__goalTunnels;
    const goalBlack = window.goalBlackTunnel || window.__goalBlackTunnel;
    const goalWhite = window.goalWhiteTunnel || window.__goalWhiteTunnel;

    let blackChildrenCount = 0;
    let blackMeshInfo = [];
    if (goalBlack && goalBlack.container) {
      blackChildrenCount = goalBlack.container.children.length;
      goalBlack.container.traverse(c => {
        if (c.isMesh) {
          blackMeshInfo.push({
            type: c.type,
            hasGeometry: !!c.geometry,
            vertexCount: c.geometry && c.geometry.attributes && c.geometry.attributes.position ? c.geometry.attributes.position.count : 0,
            hasMaterial: !!c.material,
            materialType: c.material ? c.material.type : null
          });
        }
      });
    }

    return {
      warpActive: warp ? warp.active : false,
      warpProgress: warp ? warp.progress : 0,
      currentStage3D: currentStage,
      isBlackTunnelActive: goalTunnels ? goalTunnels.isBlackTunnelActive : false,
      isWhiteTunnelActive: goalTunnels ? goalTunnels.isWhiteTunnelActive : false,
      blackContainerVisible: goalBlack && goalBlack.container ? goalBlack.container.visible : false,
      whiteContainerVisible: goalWhite && goalWhite.container ? goalWhite.container.visible : false,
      blackChildrenCount,
      meshCount: blackMeshInfo.length,
      sampleMeshes: blackMeshInfo.slice(0, 3),
      bloomAmount: window.properties ? window.properties.bloomAmount : 0,
      tunnelTime: goalTunnels ? goalTunnels.tunnelTime : 0
    };
  });

  await page.screenshot({ path: screenshots.t1_cyber_grid_tunnel });
  console.log(`-> Captured T+1.0s Screenshot: ${screenshots.t1_cyber_grid_tunnel}`);
  console.log('   T+1.0s State:', JSON.stringify(t1State));
  verificationData.t1 = t1State;

  // -------------------------------------------------------------
  // 3. T+2.0s: The white tunnel burst / transition
  // -------------------------------------------------------------
  console.log('\n[Phase 3] Capturing White Tunnel Burst / Transition (T+2.0s)...');

  // Wait until warp enters white tunnel burst phase
  for (let i = 0; i < 100; i++) {
    const s = await page.evaluate(() => {
      const warp = window.__openingWarp;
      const gt = window.goalTunnels || window.__goalTunnels;
      return {
        active: warp ? warp.active : false,
        progress: warp ? warp.progress : 0,
        isWhiteActive: gt ? gt.isWhiteTunnelActive : false
      };
    });
    if (s.active && (s.isWhiteActive || s.progress >= 0.65)) {
      console.log(`   Reaching White Tunnel Burst sweet spot (progress: ${s.progress.toFixed(3)})`);
      break;
    }
    await sleep(20);
  }

  const t2State = await page.evaluate(() => {
    const warp = window.__openingWarp;
    const currentStage = window.visuals && window.visuals.currentStage3D ? window.visuals.currentStage3D.constructor.name : 'none';
    const goalTunnels = window.goalTunnels || window.__goalTunnels;
    const goalBlack = window.goalBlackTunnel || window.__goalBlackTunnel;
    const goalWhite = window.goalWhiteTunnel || window.__goalWhiteTunnel;

    let whiteChildrenCount = 0;
    let whiteMeshInfo = [];
    if (goalWhite && goalWhite.container) {
      whiteChildrenCount = goalWhite.container.children.length;
      goalWhite.container.traverse(c => {
        if (c.isMesh) {
          whiteMeshInfo.push({
            type: c.type,
            hasGeometry: !!c.geometry,
            vertexCount: c.geometry && c.geometry.attributes && c.geometry.attributes.position ? c.geometry.attributes.position.count : 0,
            hasMaterial: !!c.material
          });
        }
      });
    }

    return {
      warpActive: warp ? warp.active : false,
      warpProgress: warp ? warp.progress : 0,
      currentStage3D: currentStage,
      isBlackTunnelActive: goalTunnels ? goalTunnels.isBlackTunnelActive : false,
      isWhiteTunnelActive: goalTunnels ? goalTunnels.isWhiteTunnelActive : false,
      blackContainerVisible: goalBlack && goalBlack.container ? goalBlack.container.visible : false,
      whiteContainerVisible: goalWhite && goalWhite.container ? goalWhite.container.visible : false,
      whiteChildrenCount,
      meshCount: whiteMeshInfo.length,
      sampleMeshes: whiteMeshInfo.slice(0, 3),
      whiteTunnelRatio: goalTunnels && goalTunnels.sharedUniforms && goalTunnels.sharedUniforms.u_whiteTunnelRatio ? goalTunnels.sharedUniforms.u_whiteTunnelRatio.value : 0,
      bloomAmount: window.properties ? window.properties.bloomAmount : 0,
      bgColor: window.properties ? window.properties.bgColor.getHexString() : null
    };
  });

  await page.screenshot({ path: screenshots.t2_white_tunnel_burst });
  console.log(`-> Captured T+2.0s Screenshot: ${screenshots.t2_white_tunnel_burst}`);
  console.log('   T+2.0s State:', JSON.stringify(t2State));
  verificationData.t2 = t2State;

  // -------------------------------------------------------------
  // 4. T+2.5s: The Hero floating blocks landing (HomeBalloons)
  // -------------------------------------------------------------
  console.log('\n[Phase 4] Capturing Hero Floating Blocks Landing (T+2.5s)...');

  // Wait until warp is completed and HomeBalloons takes over
  for (let i = 0; i < 100; i++) {
    const isDone = await page.evaluate(() => {
      const warp = window.__openingWarp;
      const balloons = window.homeBalloons || window.__homeBalloons;
      return warp && warp.hasCompleted && balloons && balloons.isActive;
    });
    if (isDone) {
      console.log('   Warp completed -> Hero HomeBalloons active!');
      break;
    }
    await sleep(30);
  }

  // Extra settle time for Dolly Zoom landing
  await sleep(400);

  const t25State = await page.evaluate(() => {
    const warp = window.__openingWarp;
    const currentStage = window.visuals && window.visuals.currentStage3D ? window.visuals.currentStage3D.constructor.name : 'none';
    const balloons = window.homeBalloons || window.__homeBalloons;
    const headerEl = document.getElementById('header');
    const pageContainerEl = document.getElementById('page-container');
    const heroTitle = document.getElementById('home-hero-title');

    let balloonMeshes = [];
    let stageChildrenCount = 0;
    if (balloons) {
      stageChildrenCount = balloons.children ? balloons.children.length : 0;
      if (balloons.balloonList && balloons.balloonList.length > 0) {
        balloons.balloonList.forEach(b => {
          balloonMeshes.push({
            name: b.name || 'unnamed',
            hasMesh: !!b.mesh,
            visible: b.mesh ? b.mesh.visible : false,
            vertexCount: b.mesh && b.mesh.geometry && b.mesh.geometry.attributes && b.mesh.geometry.attributes.position ? b.mesh.geometry.attributes.position.count : 0,
            radius: b.radius,
            color: b.color ? (b.color.getHexString ? b.color.getHexString() : b.color) : null,
            position: b.selfPositionRadius ? { x: b.selfPositionRadius.x, y: b.selfPositionRadius.y, z: b.selfPositionRadius.z } : null
          });
        });
      } else if (balloons.children) {
        balloons.children.forEach(c => {
          if (c.isMesh) {
            balloonMeshes.push({
              name: c.name || 'mesh',
              visible: c.visible,
              vertexCount: c.geometry && c.geometry.attributes && c.geometry.attributes.position ? c.geometry.attributes.position.count : 0
            });
          }
        });
      }
    }

    return {
      warpHasCompleted: warp ? warp.hasCompleted : false,
      currentStage3D: currentStage,
      isHomeBalloonsActive: balloons ? balloons.isActive : false,
      stageChildrenCount,
      balloonsCount: balloonMeshes.length,
      sampleBalloons: balloonMeshes.slice(0, 5),
      headerOpacity: headerEl ? window.getComputedStyle(headerEl).opacity : '0',
      pageContainerOpacity: pageContainerEl ? window.getComputedStyle(pageContainerEl).opacity : '0',
      heroTitleText: heroTitle ? heroTitle.innerText.trim() : '',
      cameraPosition: window.properties && window.properties.camera ? window.properties.camera.position : null,
      scrollManagerActive: window.scrollManager ? window.scrollManager.isActive : false
    };
  });

  await page.screenshot({ path: screenshots.t2_5_hero_landing });
  console.log(`-> Captured T+2.5s Screenshot: ${screenshots.t2_5_hero_landing}`);
  console.log('   T+2.5s State:', JSON.stringify(t25State));
  verificationData.t2_5 = t25State;

  // -------------------------------------------------------------
  // Final Checks & Assertions
  // -------------------------------------------------------------
  console.log('\n=== Summary of Verification ===');
  console.log(`Console Errors Total: ${consoleErrors.length}`);
  console.log(`WebGL Warnings Total: ${webglWarnings.length}`);
  console.log(`Failed Network Requests Total: ${failedRequests.length}`);

  if (consoleErrors.length > 0) {
    console.error('Console Errors detected:', consoleErrors);
  }
  if (webglWarnings.length > 0) {
    console.warn('WebGL Warnings detected:', webglWarnings);
  }

  // Write full verification report to JSON
  const reportPath = path.join(cwd, 'webgl_verification_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(verificationData, null, 2), 'utf8');
  console.log(`Full report saved to: ${reportPath}`);

  await browser.close();
  console.log('\nVerification run finished successfully.');

  return verificationData;
}

runVerification().catch(err => {
  console.error('Verification failed with exception:', err);
  process.exit(1);
});
