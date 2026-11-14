import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://rahiseko-alt.github.io/antigravity1011/';

async function profile(url, label) {
  console.log(`\n======================================================`);
  console.log(`PROFILING: ${label} (${url})`);
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

  // Inject early monitoring before page scripts execute
  await page.evaluateOnNewDocument(() => {
    window.__profileData = {
      longTasks: [],
      rafCount: 0,
      rafDurations: [],
      scrollTimeline: [],
      webglContexts: 0,
      canvasCount: 0,
      eventLog: []
    };

    // Track Long Tasks via PerformanceObserver
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__profileData.longTasks.push({
            startTime: Math.round(entry.startTime),
            duration: Math.round(entry.duration),
            name: entry.name,
            attribution: entry.attribution ? entry.attribution.map(a => ({
              name: a.name,
              entryType: a.entryType,
              containerType: a.containerType,
              containerSrc: a.containerSrc,
              containerId: a.containerId,
              containerName: a.containerName
            })) : []
          });
        }
      });
      observer.observe({ type: 'longtask', buffered: true });
    } catch (e) {
      console.warn('Longtask observer failed', e);
    }

    // Intercept WebGL context creation
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        window.__profileData.webglContexts++;
        console.log(`[WebGL Intercept] getContext('${type}') called! Total contexts: ${window.__profileData.webglContexts}`);
      }
      return origGetContext.apply(this, [type, ...args]);
    };

    // Intercept rAF to measure frame durations and identify heavy loops
    const origRAF = window.requestAnimationFrame;
    let frameTimes = [];
    window.requestAnimationFrame = function (cb) {
      return origRAF.call(window, function (timestamp) {
        const tStart = performance.now();
        try {
          cb(timestamp);
        } finally {
          const tEnd = performance.now();
          const dur = tEnd - tStart;
          window.__profileData.rafCount++;
          if (dur > 5) {
            window.__profileData.rafDurations.push({
              time: Math.round(timestamp),
              duration: Math.round(dur * 100) / 100
            });
          }
        }
      });
    };

    // Listen to wheel and touch events to see if preventDefault is called
    ['wheel', 'touchstart', 'touchmove', 'scroll'].forEach(evtName => {
      window.addEventListener(evtName, (e) => {
        window.__profileData.eventLog.push({
          time: Math.round(performance.now()),
          type: evtName,
          defaultPrevented: e.defaultPrevented,
          scrollY: window.scrollY,
          pageYOffset: window.pageYOffset
        });
      }, { passive: false, capture: true });
    });
  });

  console.log('Navigating to target...');
  const navStart = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  const loadDuration = Date.now() - navStart;
  console.log(`Page 'load' event fired in ${loadDuration}ms`);

  // Sample timeline every 250ms for 10 seconds
  const timelineSamples = [];
  const startTime = Date.now();

  // We will also send wheel events at 3s, 5s, 7s
  let wheelFired = {};

  while (Date.now() - startTime < 10000) {
    const elapsed = Date.now() - startTime;

    // Test wheel events at 3s and 6s
    if (elapsed > 3000 && !wheelFired['3s']) {
      wheelFired['3s'] = true;
      console.log(`[Timeline ${elapsed}ms] Simulating mouse wheel scroll deltaY=600...`);
      await page.mouse.wheel({ deltaY: 600 });
    }
    if (elapsed > 6000 && !wheelFired['6s']) {
      wheelFired['6s'] = true;
      console.log(`[Timeline ${elapsed}ms] Simulating second mouse wheel scroll deltaY=1200...`);
      await page.mouse.wheel({ deltaY: 1200 });
    }

    const state = await page.evaluate(() => {
      const sp = window.scrollPane;
      const sm = window.scrollManager;
      const docEl = document.documentElement;
      const body = document.body;

      return {
        now: Math.round(performance.now()),
        scrollY: window.scrollY || window.pageYOffset,
        scrollTopDoc: docEl ? docEl.scrollTop : null,
        scrollTopBody: body ? body.scrollTop : null,
        bodyOverflow: body ? body.style.overflow : null,
        bodyOverflowY: body ? body.style.overflowY : null,
        docOverflow: docEl ? docEl.style.overflow : null,
        docOverflowY: docEl ? docEl.style.overflowY : null,
        scrollManager: sm ? {
          exists: true,
          isActive: sm.isActive,
          currentScroll: sm.currentScroll,
          targetScroll: sm.targetScroll,
          maxScroll: sm.maxScroll,
          isLocked: sm.isLocked
        } : (window.ScrollManager ? { exists: 'ClassExistsOnly' } : null),
        scrollPane: sp ? {
          exists: true,
          isMoveable: sp.isMoveable,
          targetY: sp.targetY,
          currentY: sp.currentY,
          position: sp.position
        } : null,
        canvasElementsCount: document.querySelectorAll('canvas').length,
        // Check window global objects
        globals: {
          hasTHREE: typeof window.THREE !== 'undefined',
          hasScrollManager: typeof window.scrollManager !== 'undefined',
          hasScrollPane: typeof window.scrollPane !== 'undefined',
          hasApp: typeof window.app !== 'undefined',
          hasLenis: typeof window.lenis !== 'undefined'
        }
      };
    });

    timelineSamples.push({ elapsed, state });
    await new Promise(r => setTimeout(r, 250));
  }

  // Get metrics from CDP
  const metrics = await cdp.send('Performance.getMetrics');
  const metricMap = {};
  metrics.metrics.forEach(m => { metricMap[m.name] = m.value; });

  // Extract collected in-page data
  const clientData = await page.evaluate(() => {
    return {
      profile: window.__profileData,
      // Check event listeners attached to window/document/body if possible
      title: document.title,
      domNodes: document.querySelectorAll('*').length
    };
  });

  await browser.close();

  const report = {
    label,
    url,
    loadDuration,
    metrics: metricMap,
    clientData,
    timelineSamples,
    consoleLogs
  };

  const filename = `profile_report_${label.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  fs.writeFileSync(filename, JSON.stringify(report, null, 2));
  console.log(`Saved report to ${filename}`);
  return report;
}

async function main() {
  const ghReport = await profile(TARGET_URL, 'github_pages');
  console.log('\n===== GH Pages Summary =====');
  console.log('Total Long Tasks:', ghReport.clientData.profile.longTasks.length);
  console.log('Total WebGL Contexts created:', ghReport.clientData.profile.webglContexts);
  console.log('Total rAF executions:', ghReport.clientData.profile.rafCount);
  console.log('rAF executions taking > 5ms:', ghReport.clientData.profile.rafDurations.length);
  console.log('Console Logs count:', ghReport.consoleLogs.length);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
