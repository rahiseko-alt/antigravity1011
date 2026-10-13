const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('================================================================');
  console.log('   QA & Browser Validation: Frame-by-Frame Cinematic Verification');
  console.log('================================================================\n');

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

  const consoleErrors = [];
  const webglWarnings = [];
  const failedRequests = [];

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
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
  const filePaths = {
    frame1: path.join(cwd, 'verify_frame_1_100_zooming_past.png'),
    frame2: path.join(cwd, 'verify_frame_2_cyber_grid_tunnel.png'),
    frame3: path.join(cwd, 'verify_frame_3_glass_shattering.png'),
    frame4: path.join(cwd, 'verify_frame_4_pure_white_flash.png'),
    frame5: path.join(cwd, 'verify_frame_5_hero_floating_blocks_settling.png'),
    report: path.join(cwd, 'five_frames_verification_report.json')
  };

  const report = {
    timestamp: new Date().toISOString(),
    frames: {},
    webglState: {},
    consoleErrors,
    webglWarnings,
    failedRequests,
    success: false
  };

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // --------------------------------------------------------------------------
  // FRAME 1: '100' zooming up and flying past the camera
  // --------------------------------------------------------------------------
  console.log('\n[Phase 1] Monitoring Countdown to 100% and Zoom-Through...');
  
  let frame1Captured = false;
  const zoomStartWait = Date.now();
  while (Date.now() - zoomStartWait < 15000) {
    const pState = await page.evaluate(() => {
      const p = window.__preloader;
      const digits = document.getElementById('preloader-percent-digits');
      return {
        isActive: p ? p.isActive : false,
        percent: p ? p.percent : 0,
        zoomProgress: p ? p.zoomProgress : 0,
        zoomScale: p ? p.zoomScale : 1,
        text: digits ? digits.innerText.replace(/\s+/g, '') : '',
        transform: digits ? digits.style.transform : ''
      };
    });

    if (pState.text === '100' && (pState.zoomScale >= 3.5 || pState.zoomProgress >= 0.35)) {
      await page.screenshot({ path: filePaths.frame1 });
      report.frames.frame1 = {
        name: "Frame 1: '100' zooming up and flying past camera",
        file: filePaths.frame1,
        state: pState,
        timestamp: new Date().toISOString()
      };
      console.log(`-> Captured Frame 1: ${filePaths.frame1}`);
      console.log('   Scale:', pState.zoomScale.toFixed(2), 'Progress:', pState.zoomProgress.toFixed(3));
      frame1Captured = true;
      break;
    }
    await sleep(10);
  }

  if (!frame1Captured) {
    console.warn('Fallback capture for Frame 1');
    await page.screenshot({ path: filePaths.frame1 });
  }

  // --------------------------------------------------------------------------
  // FRAME 2: Real 3D cyber grid tunnel in full flight
  // --------------------------------------------------------------------------
  console.log('\n[Phase 2] Waiting for Intro Warp and Real 3D Cyber Grid Tunnel...');
  
  await page.waitForFunction(() => {
    return window.__properties && window.__properties.isIntroWarp;
  }, { timeout: 10000 });

  let frame2Captured = false;
  const tunnelPollStart = Date.now();
  while (Date.now() - tunnelPollStart < 5000) {
    const s = await page.evaluate(() => {
      const gt = window.__goalTunnels || window.goalTunnels;
      const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : 0;
      const blackTunnel = window.goalBlackTunnel;
      return {
        r,
        isBlackTunnelActive: gt ? gt.isBlackTunnelActive : false,
        blackVisible: blackTunnel && blackTunnel.container ? blackTunnel.container.visible : false,
        bloomAmount: window.__properties ? window.__properties.bloomAmount : 0,
        fov: window.__properties ? window.__properties.cameraFov : 0
      };
    });

    if (s.r >= 0.75 && s.r <= 1.20 && s.isBlackTunnelActive) {
      await page.screenshot({ path: filePaths.frame2 });
      report.frames.frame2 = {
        name: 'Frame 2: Real 3D cyber grid tunnel in full flight',
        file: filePaths.frame2,
        state: s,
        timestamp: new Date().toISOString()
      };
      console.log(`-> Captured Frame 2: ${filePaths.frame2}`);
      console.log('   Elapsed r:', s.r.toFixed(3), 'Bloom:', s.bloomAmount.toFixed(1), 'FOV:', s.fov.toFixed(1));
      frame2Captured = true;
      break;
    }
    await sleep(15);
  }

  // --------------------------------------------------------------------------
  // FRAME 3: 3D glass shattering into fragments
  // --------------------------------------------------------------------------
  console.log('\n[Phase 3] Waiting for 3D Glass Shattering Phase...');
  
  let frame3Captured = false;
  const glassPollStart = Date.now();
  while (Date.now() - glassPollStart < 5000) {
    const s = await page.evaluate(() => {
      const gt = window.__goalTunnels || window.goalTunnels;
      const glass = window.__goalTunnelGlass;
      const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : 0;
      return {
        r,
        glassRatio: glass ? glass.ratio : 0,
        glassVisible: glass && glass.container ? glass.container.visible : false,
        meshVisible: glass && glass.mesh ? glass.mesh.visible : false,
        vertexCount: glass && glass.mesh && glass.mesh.geometry ? glass.mesh.geometry.attributes.position.count : 0
      };
    });

    if (s.r >= 1.88 && s.glassRatio >= 0.15) {
      await page.screenshot({ path: filePaths.frame3 });
      report.frames.frame3 = {
        name: 'Frame 3: 3D glass shattering into fragments',
        file: filePaths.frame3,
        state: s,
        timestamp: new Date().toISOString()
      };
      console.log(`-> Captured Frame 3: ${filePaths.frame3}`);
      console.log('   Elapsed r:', s.r.toFixed(3), 'Glass Ratio:', s.glassRatio.toFixed(3), 'Vertices:', s.vertexCount);
      frame3Captured = true;
      break;
    }
    await sleep(15);
  }

  // --------------------------------------------------------------------------
  // FRAME 4: Pure white flash
  // --------------------------------------------------------------------------
  console.log('\n[Phase 4] Waiting for Pure White Flash at Climax...');
  
  let frame4Captured = false;
  const whitePollStart = Date.now();
  while (Date.now() - whitePollStart < 5000) {
    const s = await page.evaluate(() => {
      const gt = window.__goalTunnels || window.goalTunnels;
      const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : 0;
      const whiteout = document.getElementById('intro-whiteout');
      const bgHex = window.__properties ? window.__properties.bgColorHex : '';
      return {
        r,
        whiteoutOpacity: whiteout ? whiteout.style.opacity : null,
        whiteoutDisplay: whiteout ? whiteout.style.display : null,
        bgHex,
        bloom: window.__properties ? window.__properties.bloomAmount : 0
      };
    });

    if (s.r >= 2.32 && s.r <= 2.65) {
      await page.screenshot({ path: filePaths.frame4 });
      report.frames.frame4 = {
        name: 'Frame 4: Pure white flash',
        file: filePaths.frame4,
        state: s,
        timestamp: new Date().toISOString()
      };
      console.log(`-> Captured Frame 4: ${filePaths.frame4}`);
      console.log('   Elapsed r:', s.r.toFixed(3), 'Whiteout Opacity:', s.whiteoutOpacity, 'Bloom:', s.bloom);
      frame4Captured = true;
      break;
    }
    await sleep(10);
  }

  // --------------------------------------------------------------------------
  // FRAME 5: Hero floating blocks fading in and settling
  // --------------------------------------------------------------------------
  console.log('\n[Phase 5] Waiting for Hero Scene & Alphabet Blocks Settling...');
  
  // Wait for intro warp to end
  await page.waitForFunction(() => {
    return window.__properties && !window.__properties.isIntroWarp;
  }, { timeout: 10000 });

  // Allow hero scene to settle and physics to reach equilibrium
  await sleep(1000);

  const heroState = await page.evaluate(() => {
    const hb = window.__homeBalloons || window.homeBalloons;
    const pCont = document.getElementById('page-container');
    const header = document.getElementById('header');
    const whiteout = document.getElementById('intro-whiteout');
    
    let blockCount = 0;
    let blockDetails = [];
    if (hb && hb.balloons) {
      blockCount = hb.balloons.length;
      blockDetails = hb.balloons.slice(0, 5).map(b => ({
        color: b.color ? b.color.getHexString() : 'unknown',
        pos: b.mesh ? { x: b.mesh.position.x.toFixed(2), y: b.mesh.position.y.toFixed(2), z: b.mesh.position.z.toFixed(2) } : null
      }));
    } else if (hb && hb.container) {
      hb.container.traverse(c => {
        if (c.isMesh) blockCount++;
      });
    }

    return {
      isIntroWarp: window.__properties ? window.__properties.isIntroWarp : false,
      homeBalloonsActive: hb ? hb.isActive : false,
      blockCount,
      sampleBlocks: blockDetails,
      pageContainerOpacity: pCont ? window.getComputedStyle(pCont).opacity : '0',
      headerOpacity: header ? window.getComputedStyle(header).opacity : '0',
      whiteoutDisplay: whiteout ? whiteout.style.display : 'none',
      whiteoutOpacity: whiteout ? whiteout.style.opacity : '0',
      scrollActive: window.scrollManager ? window.scrollManager.isActive : false
    };
  });

  await page.screenshot({ path: filePaths.frame5 });
  report.frames.frame5 = {
    name: 'Frame 5: Hero floating blocks fading in and settling',
    file: filePaths.frame5,
    state: heroState,
    timestamp: new Date().toISOString()
  };
  console.log(`-> Captured Frame 5: ${filePaths.frame5}`);
  console.log('   Hero Active:', heroState.homeBalloonsActive, 'Blocks:', heroState.blockCount, 'Scroll Active:', heroState.scrollActive);

  // --------------------------------------------------------------------------
  // Check WebGL GPU context health
  // --------------------------------------------------------------------------
  console.log('\n[Phase 6] Checking WebGL GPU context health & error state...');
  const webglHealth = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { error: 'No canvas found' };
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return { error: 'No WebGL context' };
    const err = gl.getError();
    return {
      glError: err,
      glErrorName: err === 0 ? 'NO_ERROR' : `GL_ERROR_${err}`,
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION)
    };
  });
  report.webglState = webglHealth;
  console.log('   WebGL Context Health:', JSON.stringify(webglHealth));

  const hasZeroWebglErrors = webglHealth.glError === 0 && webglWarnings.length === 0;
  const hasZeroConsoleErrors = consoleErrors.length === 0;
  report.success = hasZeroWebglErrors && hasZeroConsoleErrors;

  fs.writeFileSync(filePaths.report, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nReport written to: ${filePaths.report}`);

  await browser.close();

  console.log('\n================================================================');
  console.log(`   Verification Finished: Success=${report.success}`);
  console.log(`   Console Errors: ${consoleErrors.length}`);
  console.log(`   WebGL Errors: ${webglHealth.glError} (${webglHealth.glErrorName})`);
  console.log('================================================================');
}

run().catch(err => {
  console.error('Execution failed:', err);
  process.exit(1);
});
