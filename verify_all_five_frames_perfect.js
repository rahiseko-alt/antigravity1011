const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('================================================================');
  console.log('   QA & Browser Validation: 5-Frame High-Fidelity Capture');
  console.log('================================================================\n');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;
  console.log(`Using browser: ${executablePath}`);

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

  const cwd = process.cwd();
  const filePaths = {
    frame1: path.join(cwd, 'verify_frame_1_100_zooming_past.png'),
    frame1_hold: path.join(cwd, 'verify_frame_1_hold_100.png'),
    frame2: path.join(cwd, 'verify_frame_2_cyber_grid_tunnel.png'),
    frame3: path.join(cwd, 'verify_frame_3_glass_shattering.png'),
    frame4: path.join(cwd, 'verify_frame_4_pure_white_flash.png'),
    frame5: path.join(cwd, 'verify_frame_5_hero_floating_blocks_settling.png'),
    report: path.join(cwd, 'five_frames_verification_report.json')
  };

  const consoleErrors = [];
  const webglWarnings = [];
  const failedRequests = [];

  function attachListeners(page) {
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      if (type === 'error') {
        if (!text.includes('font-size:0;color:transparent') && !text.includes('ERR_CONNECTION_CLOSED')) {
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
  }

  const report = {
    timestamp: new Date().toISOString(),
    frames: {},
    webglState: {},
    consoleErrors,
    webglWarnings,
    failedRequests,
    success: false
  };

  // ==========================================================================
  // PASS 1: Frame 1 ('100' Zooming Up / Approach: scale 2.0 - 3.5)
  // ==========================================================================
  console.log('\n--- Pass 1: Capturing Frame 1 (\'100\' Zoom-In Approach) ---');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    attachListeners(page);
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

    const start = Date.now();
    while (Date.now() - start < 15000) {
      const pState = await page.evaluate(() => {
        const p = window.__preloader;
        const digits = document.getElementById('preloader-percent-digits');
        return {
          text: digits ? digits.innerText.replace(/\s+/g, '') : '',
          zoomTime: p ? p.zoomTime : 0,
          zoomProgress: p ? p.zoomProgress : 0,
          zoomScale: p ? p.zoomScale : 1
        };
      });

      // Capture right when 100 begins expanding towards camera (scale 2.0 - 3.5)
      if (pState.text === '100' && pState.zoomScale >= 2.0 && pState.zoomScale <= 3.5) {
        await page.screenshot({ path: filePaths.frame1 });
        report.frames.frame1 = {
          name: "Frame 1: '100' zooming up towards camera (Approach)",
          file: filePaths.frame1,
          state: pState,
          timestamp: new Date().toISOString()
        };
        console.log(`-> Captured Frame 1: Scale=${pState.zoomScale.toFixed(2)}, Time=${pState.zoomTime.toFixed(3)}s, Progress=${pState.zoomProgress.toFixed(3)}`);
        break;
      }
      await sleep(5);
    }
    await page.close();
  }

  // ==========================================================================
  // PASS 1B: Frame 1_hold ('100' Hold / Freeze Dead Center for ~1.0s)
  // ==========================================================================
  console.log('\n--- Pass 1B: Capturing Frame 1_hold (\'100\' Dead Center 1.0s Hold) ---');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    attachListeners(page);
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

    const start = Date.now();
    while (Date.now() - start < 15000) {
      const pState = await page.evaluate(() => {
        const p = window.__preloader;
        const digits = document.getElementById('preloader-percent-digits');
        return {
          text: digits ? digits.innerText.replace(/\s+/g, '') : '',
          zoomTime: p ? p.zoomTime : 0,
          zoomProgress: p ? p.zoomProgress : 0,
          zoomScale: p ? p.zoomScale : 1
        };
      });

      // Capture during the dead center hold phase (0.6s <= zoomTime <= 1.4s)
      if (pState.text === '100' && pState.zoomTime >= 0.7 && pState.zoomTime <= 1.3) {
        await page.screenshot({ path: filePaths.frame1_hold });
        report.frames.frame1_hold = {
          name: "Frame 1_hold: '100' holding dead center for ~1.0s (Hold Phase)",
          file: filePaths.frame1_hold,
          state: pState,
          timestamp: new Date().toISOString()
        };
        console.log(`-> Captured Frame 1_hold: Scale=${pState.zoomScale.toFixed(2)}, Time=${pState.zoomTime.toFixed(3)}s, Hold Progress=${((pState.zoomTime - 0.5) / 1.0).toFixed(2)}`);
        break;
      }
      await sleep(10);
    }
    await page.close();
  }

  // ==========================================================================
  // PASS 2: Frame 2 (Real 3D cyber grid tunnel in full flight)
  // ==========================================================================
  console.log('\n--- Pass 2: Capturing Frame 2 (Real 3D Cyber Grid Tunnel) ---');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    attachListeners(page);
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.__properties && window.__properties.isIntroWarp, { timeout: 15000 });

    const start = Date.now();
    while (Date.now() - start < 8000) {
      const s = await page.evaluate(() => {
        const gt = window.__goalTunnels || window.goalTunnels;
        const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : -1;
        return {
          r,
          isBlackActive: gt ? gt.isBlackTunnelActive : false,
          bloom: window.__properties ? window.__properties.bloomAmount : 0,
          fov: window.__properties ? window.__properties.cameraFov : 0
        };
      });

      if (s.r >= 0.70 && s.r <= 1.25 && s.isBlackActive) {
        await page.screenshot({ path: filePaths.frame2 });
        report.frames.frame2 = {
          name: 'Frame 2: Real 3D cyber grid tunnel in full flight',
          file: filePaths.frame2,
          state: s,
          timestamp: new Date().toISOString()
        };
        console.log(`-> Captured Frame 2: r=${s.r.toFixed(3)}s, Bloom=${s.bloom.toFixed(1)}, FOV=${s.fov.toFixed(1)}`);
        break;
      }
      await sleep(15);
    }
    await page.close();
  }

  // ==========================================================================
  // PASS 3: Frame 3 (3D glass shattering into fragments)
  // ==========================================================================
  console.log('\n--- Pass 3: Capturing Frame 3 (3D Glass Shattering into Fragments) ---');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    attachListeners(page);
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.__properties && window.__properties.isIntroWarp, { timeout: 15000 });

    const start = Date.now();
    while (Date.now() - start < 8000) {
      const s = await page.evaluate(() => {
        const gt = window.__goalTunnels || window.goalTunnels;
        const glass = window.__goalTunnelGlass;
        const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : -1;
        return {
          r,
          glassRatio: glass ? glass.ratio : 0,
          glassVisible: glass && glass.container ? glass.container.visible : false,
          meshVisible: glass && glass.mesh ? glass.mesh.visible : false
        };
      });

      // Window for visible shattered glass shards across screen (r ~ 1.88 - 2.12)
      if (s.r >= 1.88 && s.r <= 2.12 && s.glassRatio >= 0.10) {
        await page.screenshot({ path: filePaths.frame3 });
        report.frames.frame3 = {
          name: 'Frame 3: 3D glass shattering into fragments',
          file: filePaths.frame3,
          state: s,
          timestamp: new Date().toISOString()
        };
        console.log(`-> Captured Frame 3: r=${s.r.toFixed(3)}s, Glass Ratio=${s.glassRatio.toFixed(3)}, Visible=${s.glassVisible}`);
        break;
      }
      await sleep(5);
    }
    await page.close();
  }

  // ==========================================================================
  // PASS 4: Frame 4 (Pure white flash)
  // ==========================================================================
  console.log('\n--- Pass 4: Capturing Frame 4 (Pure White Flash) ---');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    attachListeners(page);
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForFunction(() => window.__properties && window.__properties.isIntroWarp, { timeout: 15000 });

    const start = Date.now();
    while (Date.now() - start < 8000) {
      const s = await page.evaluate(() => {
        const gt = window.__goalTunnels || window.goalTunnels;
        const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : -1;
        const whiteout = document.getElementById('intro-whiteout');
        return {
          r,
          whiteoutOpacity: whiteout ? whiteout.style.opacity : null,
          bloom: window.__properties ? window.__properties.bloomAmount : 0
        };
      });

      if (s.r >= 2.42 && s.r <= 2.65) {
        await page.screenshot({ path: filePaths.frame4 });
        report.frames.frame4 = {
          name: 'Frame 4: Pure white flash',
          file: filePaths.frame4,
          state: s,
          timestamp: new Date().toISOString()
        };
        console.log(`-> Captured Frame 4: r=${s.r.toFixed(3)}s, Whiteout Opacity=${s.whiteoutOpacity}, Bloom=${s.bloom.toFixed(1)}`);
        break;
      }
      await sleep(10);
    }
    await page.close();
  }

  // ==========================================================================
  // PASS 5: Frame 5 (Hero floating blocks fading in and settling)
  // ==========================================================================
  console.log('\n--- Pass 5: Capturing Frame 5 (Hero Floating Blocks Settling) ---');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    attachListeners(page);
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // First wait for warp to start
    await page.waitForFunction(() => window.__properties && window.__properties.isIntroWarp, { timeout: 15000 });
    console.log('Intro warp active in Pass 5, waiting for completion...');
    // Then wait for warp to cleanly finish
    await page.waitForFunction(() => window.__properties && !window.__properties.isIntroWarp, { timeout: 15000 });
    console.log('Intro warp finished, letting floating blocks settle...');
    await sleep(1500); // Allow alphabet blocks (A, I, u, e, o) to settle into physics equilibrium

    const heroState = await page.evaluate(() => {
      const hb = window.__homeBalloons || window.homeBalloons;
      const pCont = document.getElementById('page-container');
      const header = document.getElementById('header');
      const whiteout = document.getElementById('intro-whiteout');

      let blockCount = 0;
      let blockPositions = [];
      const balloons = (hb && hb.balloonList) ? hb.balloonList : (hb && hb.balloons) ? hb.balloons : null;
      if (balloons) {
        blockCount = balloons.length;
        blockPositions = balloons.slice(0, 5).map(b => ({
          color: (b.color && typeof b.color.getHexString === 'function') ? b.color.getHexString() : (b.color != null ? String(b.color) : ''),
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
        blockPositions,
        pageContainerOpacity: pCont ? window.getComputedStyle(pCont).opacity : '0',
        headerOpacity: header ? window.getComputedStyle(header).opacity : '0',
        whiteoutDisplay: whiteout ? whiteout.style.display : 'none',
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
    console.log(`-> Captured Frame 5: Blocks=${heroState.blockCount}, Scroll Active=${heroState.scrollActive}`);

    // Check WebGL context health
    console.log('\n--- Checking WebGL GPU context health & error state ---');
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

    await page.close();
  }

  const hasZeroWebglErrors = report.webglState.glError === 0 && webglWarnings.length === 0;
  const hasZeroConsoleErrors = consoleErrors.length === 0;
  const allCaptured = report.frames.frame1 && report.frames.frame1_hold && report.frames.frame2 && report.frames.frame3 && report.frames.frame4 && report.frames.frame5;
  report.success = hasZeroWebglErrors && hasZeroConsoleErrors && !!allCaptured;

  fs.writeFileSync(filePaths.report, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nReport written to: ${filePaths.report}`);

  await browser.close();

  console.log('\n================================================================');
  console.log(`   Final Verification Result: Success=${report.success}`);
  console.log(`   Frames Captured: ${Object.keys(report.frames).length}/6`);
  console.log(`   Console Errors: ${consoleErrors.length}`);
  console.log(`   WebGL Errors: ${report.webglState.glError} (${report.webglState.glErrorName})`);
  console.log('================================================================\n');

  if (!report.success) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Execution failed:', err);
  process.exit(1);
});
