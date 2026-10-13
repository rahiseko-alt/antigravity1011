const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('================================================================');
  console.log('   QA & Browser Validation: Master 5-Frame Verification');
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
    // Filter out external third-party tracker noises if any
    if (type === 'error') {
      if (!text.includes('font-size:0;color:transparent')) {
        consoleErrors.push(text);
        console.error(`[Browser Error]: ${text}`);
      }
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

  let captured = {
    frame1: false,
    frame2: false,
    frame3: false,
    frame4: false,
    frame5: false
  };

  const masterStart = Date.now();
  const masterTimeout = 25000;

  console.log('\nStarting single-pass state monitor loop...');

  while (Date.now() - masterStart < masterTimeout) {
    const state = await page.evaluate(() => {
      const p = window.__preloader;
      const gt = window.__goalTunnels || window.goalTunnels;
      const glass = window.__goalTunnelGlass;
      const hb = window.__homeBalloons || window.homeBalloons;
      const prop = window.__properties;
      const digits = document.getElementById('preloader-percent-digits');
      const whiteout = document.getElementById('intro-whiteout');
      const pCont = document.getElementById('page-container');
      const header = document.getElementById('header');

      const isWarp = prop ? prop.isIntroWarp : false;
      const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : -1;

      return {
        // Preloader
        preloaderText: digits ? digits.innerText.replace(/\s+/g, '') : '',
        zoomProgress: p ? p.zoomProgress : 0,
        zoomScale: p ? p.zoomScale : 1,
        
        // Intro Warp & GoalTunnels
        isIntroWarp: isWarp,
        r,
        isBlackActive: gt ? gt.isBlackTunnelActive : false,
        isWhiteActive: gt ? gt.isWhiteTunnelActive : false,
        bloom: prop ? prop.bloomAmount : 0,
        fov: prop ? prop.cameraFov : 0,
        bgColor: prop ? prop.bgColorHex : '',

        // GoalTunnelGlass
        glassRatio: glass ? glass.ratio : 0,
        glassVisible: glass && glass.container ? glass.container.visible : false,

        // Whiteout
        whiteoutOpacity: whiteout ? whiteout.style.opacity : null,
        whiteoutDisplay: whiteout ? whiteout.style.display : null,

        // Hero
        homeBalloonsActive: hb ? hb.isActive : false,
        pageContainerOpacity: pCont ? window.getComputedStyle(pCont).opacity : '0',
        headerOpacity: header ? window.getComputedStyle(header).opacity : '0',
        scrollActive: window.scrollManager ? window.scrollManager.isActive : false
      };
    });

    // -------------------------------------------------------------
    // FRAME 1: '100' zooming up and flying past the camera
    // -------------------------------------------------------------
    if (!captured.frame1) {
      if (state.preloaderText === '100' && (state.zoomScale >= 3.0 || state.zoomProgress >= 0.25)) {
        await page.screenshot({ path: filePaths.frame1 });
        captured.frame1 = true;
        report.frames.frame1 = {
          name: "Frame 1: '100' zooming up and flying past the camera",
          file: filePaths.frame1,
          state: {
            text: state.preloaderText,
            zoomScale: state.zoomScale,
            zoomProgress: state.zoomProgress
          },
          timestamp: new Date().toISOString()
        };
        console.log(`[Captured Frame 1] '100' zoom-through (Scale: ${state.zoomScale.toFixed(2)}, Progress: ${state.zoomProgress.toFixed(3)})`);
      }
    }

    // -------------------------------------------------------------
    // FRAME 2: Real 3D cyber grid tunnel in full flight
    // -------------------------------------------------------------
    if (captured.frame1 && !captured.frame2) {
      if (state.isIntroWarp && state.r >= 0.70 && state.r <= 1.25 && state.isBlackActive) {
        await page.screenshot({ path: filePaths.frame2 });
        captured.frame2 = true;
        report.frames.frame2 = {
          name: 'Frame 2: Real 3D cyber grid tunnel in full flight',
          file: filePaths.frame2,
          state: {
            r: state.r,
            isBlackActive: state.isBlackActive,
            bloom: state.bloom,
            fov: state.fov
          },
          timestamp: new Date().toISOString()
        };
        console.log(`[Captured Frame 2] Real 3D cyber grid tunnel (r: ${state.r.toFixed(3)}s, Bloom: ${state.bloom.toFixed(1)}, FOV: ${state.fov.toFixed(1)})`);
      }
    }

    // -------------------------------------------------------------
    // FRAME 3: 3D glass shattering into fragments
    // -------------------------------------------------------------
    if (captured.frame2 && !captured.frame3) {
      if (state.isIntroWarp && state.r >= 1.85 && state.glassRatio >= 0.10) {
        await page.screenshot({ path: filePaths.frame3 });
        captured.frame3 = true;
        report.frames.frame3 = {
          name: 'Frame 3: 3D glass shattering into fragments',
          file: filePaths.frame3,
          state: {
            r: state.r,
            glassRatio: state.glassRatio,
            glassVisible: state.glassVisible
          },
          timestamp: new Date().toISOString()
        };
        console.log(`[Captured Frame 3] 3D glass shattering (r: ${state.r.toFixed(3)}s, Glass Ratio: ${state.glassRatio.toFixed(3)}, Visible: ${state.glassVisible})`);
      }
    }

    // -------------------------------------------------------------
    // FRAME 4: Pure white flash
    // -------------------------------------------------------------
    if (captured.frame3 && !captured.frame4) {
      if (state.isIntroWarp && state.r >= 2.30) {
        await page.screenshot({ path: filePaths.frame4 });
        captured.frame4 = true;
        report.frames.frame4 = {
          name: 'Frame 4: Pure white flash',
          file: filePaths.frame4,
          state: {
            r: state.r,
            whiteoutOpacity: state.whiteoutOpacity,
            bgColor: state.bgColor,
            bloom: state.bloom
          },
          timestamp: new Date().toISOString()
        };
        console.log(`[Captured Frame 4] Pure white flash (r: ${state.r.toFixed(3)}s, Whiteout Opacity: ${state.whiteoutOpacity}, Bloom: ${state.bloom.toFixed(1)})`);
      }
    }

    // -------------------------------------------------------------
    // FRAME 5: Hero floating blocks fading in and settling
    // -------------------------------------------------------------
    if (captured.frame4 && !captured.frame5) {
      if (!state.isIntroWarp && state.r >= 3.0 && state.homeBalloonsActive) {
        // Wait a small moment for floating blocks to gently settle
        await sleep(600);
        await page.screenshot({ path: filePaths.frame5 });
        captured.frame5 = true;
        report.frames.frame5 = {
          name: 'Frame 5: Hero floating blocks fading in and settling',
          file: filePaths.frame5,
          state: {
            r: state.r,
            isIntroWarp: state.isIntroWarp,
            homeBalloonsActive: state.homeBalloonsActive,
            pageContainerOpacity: state.pageContainerOpacity,
            headerOpacity: state.headerOpacity,
            scrollActive: state.scrollActive
          },
          timestamp: new Date().toISOString()
        };
        console.log(`[Captured Frame 5] Hero floating blocks settling (HomeBalloons Active: ${state.homeBalloonsActive}, Scroll: ${state.scrollActive})`);
        break; // All 5 frames captured!
      }
    }

    await sleep(15);
  }

  // --------------------------------------------------------------------------
  // WebGL GPU context health & error check
  // --------------------------------------------------------------------------
  console.log('\nChecking WebGL GPU context health & error state...');
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
  console.log('WebGL Context Health:', JSON.stringify(webglHealth));

  const hasZeroWebglErrors = webglHealth.glError === 0 && webglWarnings.length === 0;
  const hasZeroConsoleErrors = consoleErrors.length === 0;
  const allFiveCaptured = captured.frame1 && captured.frame2 && captured.frame3 && captured.frame4 && captured.frame5;
  report.success = hasZeroWebglErrors && hasZeroConsoleErrors && allFiveCaptured;

  fs.writeFileSync(filePaths.report, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nReport written to: ${filePaths.report}`);

  await browser.close();

  console.log('\n================================================================');
  console.log(`   Verification Result: Success=${report.success}`);
  console.log(`   Frames Captured: ${Object.keys(report.frames).length}/5`);
  console.log(`   Console Errors: ${consoleErrors.length}`);
  console.log(`   WebGL Errors: ${webglHealth.glError} (${webglHealth.glErrorName})`);
  console.log('================================================================\n');

  if (!report.success) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Execution failed:', err);
  process.exit(1);
});
