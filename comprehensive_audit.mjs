import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function auditEnvironment(url, envName) {
  console.log(`\n======================================================`);
  console.log(`  RUNNING COMPREHENSIVE AUDIT: [${envName.toUpperCase()}]`);
  console.log(`  URL: ${url}`);
  console.log(`======================================================\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--enable-gpu-rasterization',
      '--enable-zero-copy',
      '--ignore-gpu-blocklist',
      '--window-size=1440,900'
    ],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  const cdp = await page.target().createCDPSession();
  await cdp.send('Performance.enable');

  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', err => {
    consoleLogs.push({ type: 'pageerror', text: err.toString() });
  });

  // Inject measurement hooks into page
  await page.evaluateOnNewDocument(() => {
    window.__audit = {
      fpsSamples: [],
      longTasks: [],
      rafDetails: [],
      timeline: [],
      scrollInteractions: [],
      threeInfoSamples: [],
      webglCalls: {
        texSubImage2D: 0,
        drawElements: 0,
        drawArrays: 0,
        useProgram: 0,
        bindTexture: 0
      }
    };

    // Track Long Tasks (> 50ms)
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__audit.longTasks.push({
            startTime: Math.round(entry.startTime),
            duration: Math.round(entry.duration),
            name: entry.name
          });
        }
      });
      observer.observe({ type: 'longtask', buffered: true });
    } catch (e) {}

    // Hook WebGL context to measure GPU calls
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      const gl = origGetContext.apply(this, [type, ...args]);
      if (gl && (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl')) {
        const wrap = (fnName, counterName) => {
          if (gl[fnName]) {
            const orig = gl[fnName];
            gl[fnName] = function (...a) {
              window.__audit.webglCalls[counterName]++;
              return orig.apply(this, a);
            };
          }
        };
        wrap('texSubImage2D', 'texSubImage2D');
        wrap('drawElements', 'drawElements');
        wrap('drawArrays', 'drawArrays');
        wrap('useProgram', 'useProgram');
        wrap('bindTexture', 'bindTexture');
      }
      return gl;
    };

    // Hook rAF to compute FPS and execution time
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let fpsTimer = performance.now();

    const origRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) {
      return origRAF.call(window, function (timestamp) {
        const t0 = performance.now();
        frameCount++;
        if (t0 - fpsTimer >= 500) {
          const fps = Math.round((frameCount * 1000) / (t0 - fpsTimer));
          window.__audit.fpsSamples.push({ time: Math.round(t0), fps });
          frameCount = 0;
          fpsTimer = t0;
        }

        try {
          cb(timestamp);
        } finally {
          const t1 = performance.now();
          const frameDur = t1 - t0;
          if (frameDur > 10) {
            window.__audit.rafDetails.push({
              time: Math.round(t0),
              duration: Math.round(frameDur * 10) / 10
            });
          }
        }
      });
    };
  });

  const tStartNav = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const domLoadedAt = Date.now() - tStartNav;
  console.log(`[${envName}] DOMContentLoaded in ${domLoadedAt}ms`);

  // Timeline sampling loop for 10 seconds
  const timeline = [];
  const startAudit = Date.now();
  let wheelTested = false;
  let touchTested = false;

  while (Date.now() - startAudit < 10000) {
    const elapsed = Date.now() - startAudit;

    // Send wheel at 2.5s and 5.0s and 7.5s
    if (elapsed >= 2500 && !wheelTested) {
      wheelTested = true;
      console.log(`[${envName} @ ${elapsed}ms] Sending WHEEL event (deltaY: 500)...`);
      await page.mouse.wheel({ deltaY: 500 });
    }

    if (elapsed >= 5000 && !touchTested) {
      touchTested = true;
      console.log(`[${envName} @ ${elapsed}ms] Sending TOUCHMOVE event (deltaY: -300)...`);
      await page.evaluate(() => {
        const touchObj = new Touch({
          identifier: Date.now(),
          target: document.body,
          clientX: 200,
          clientY: 400,
          screenX: 200,
          screenY: 400,
          pageX: 200,
          pageY: 400
        });
        const touchEvent = new TouchEvent('touchmove', {
          cancelable: true,
          bubbles: true,
          touches: [touchObj],
          targetTouches: [touchObj],
          changedTouches: [touchObj]
        });
        const dispatched = document.dispatchEvent(touchEvent);
        window.__audit.scrollInteractions.push({
          time: Math.round(performance.now()),
          type: 'touchmove_dispatched',
          defaultPrevented: touchEvent.defaultPrevented,
          returnedFalse: !dispatched
        });
      });
    }

    if (elapsed >= 7500 && !page.__wheel2) {
      page.__wheel2 = true;
      console.log(`[${envName} @ ${elapsed}ms] Sending second WHEEL event (deltaY: 1000)...`);
      await page.mouse.wheel({ deltaY: 1000 });
    }

    // Sample states
    const state = await page.evaluate(() => {
      const sm = window.scrollManager;
      const sp = window.scrollPane;
      const body = document.body;
      const doc = document.documentElement;

      // Check Three.js renderer info if available
      let threeInfo = null;
      if (window.app && window.app.renderer) {
        threeInfo = {
          calls: window.app.renderer.info.render.calls,
          triangles: window.app.renderer.info.render.triangles,
          textures: window.app.renderer.info.memory.textures,
          programs: window.app.renderer.info.programs ? window.app.renderer.info.programs.length : null
        };
      }

      return {
        timestamp: Math.round(performance.now()),
        scrollManager: sm ? {
          isActive: sm.isActive,
          scrollY: Math.round(sm.scrollY || 0),
          targetY: Math.round(sm.targetY || 0),
          scrollPixel: Math.round(sm.scrollPixel || 0),
          targetScrollPixel: Math.round(sm.targetScrollPixel || 0),
          maxScroll: Math.round(sm.maxScroll || sm.maxScrollPixel || 0)
        } : null,
        scrollPane: sp ? {
          isMoveable: sp.isMoveable,
          isActive: sp.isActive,
          targetY: sp.targetY,
          currentY: sp.currentY
        } : null,
        documentBodyOverflow: body ? body.style.overflow : null,
        documentBodyOverflowY: body ? body.style.overflowY : null,
        documentElementOverflow: doc ? doc.style.overflow : null,
        windowScrollY: Math.round(window.scrollY),
        docScrollTop: Math.round(doc ? doc.scrollTop : 0),
        threeInfo
      };
    });

    timeline.push({ elapsed, ...state });
    await new Promise(r => setTimeout(r, 200));
  }

  // Get metrics from CDP
  const metrics = await cdp.send('Performance.getMetrics');
  const metricMap = {};
  metrics.metrics.forEach(m => { metricMap[m.name] = m.value; });

  const clientAudit = await page.evaluate(() => window.__audit);
  await browser.close();

  return {
    envName,
    url,
    domLoadedAt,
    metrics: metricMap,
    clientAudit,
    timeline,
    consoleLogs
  };
}

async function run() {
  const ghReport = await auditEnvironment('https://rahiseko-alt.github.io/antigravity1011/', 'github_pages');
  const localReport = await auditEnvironment('http://localhost:3000', 'local_build');

  fs.writeFileSync('audit_comparison.json', JSON.stringify({ ghReport, localReport }, null, 2));
  console.log('\nAudit comparison saved to audit_comparison.json!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
