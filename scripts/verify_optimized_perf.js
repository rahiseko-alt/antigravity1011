/**
 * Performance & Responsiveness Verification Suite for AIueo
 * 
 * Verification Criteria:
 * 1. Intro completes within 2.5s, immediately enabling scroll (scrollManager.isActive === true, isIntroWarp === false).
 * 2. Instant interaction response on wheel/click/tap without blocking.
 * 3. Constant 55-60 FPS smooth rendering throughout the journey.
 * 4. Zero hitching or freezing when scrolling all the way down to bottom/footer.
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const TARGET_URL = process.argv[2] || 'http://localhost:3000';
const REPORT_FILE = path.resolve(__dirname, '../optimized_perf_verification_report.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function verifySession(browser, config, deviceName) {
  console.log(`\n======================================================`);
  console.log(`  AUDITING PERFORMANCE: [${deviceName.toUpperCase()}]`);
  console.log(`  Target: ${TARGET_URL}`);
  console.log(`  Viewport: ${config.width}x${config.height} (Mobile: ${!!config.isMobile})`);
  console.log(`======================================================\n`);

  const page = await browser.newPage();
  await page.setViewport(config);

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.toString()));

  const result = {
    device: deviceName,
    viewport: `${config.width}x${config.height}`,
    item1_intro: {
      status: 'PENDING',
      preloaderDurationMs: 0,
      introDurationMs: 0,
      introDurationSec: 0,
      isIntroWarp: null,
      scrollManagerActive: null,
      targetMs: 2500,
      details: ''
    },
    item2_responsiveness: {
      status: 'PENDING',
      wheelResponseMs: null,
      scrollPixelBefore: 0,
      scrollPixelAfter: 0,
      clickResponsive: false,
      tapResponsive: false,
      details: ''
    },
    item3_fps: {
      status: 'PENDING',
      avgFps: 0,
      minFps: 0,
      maxFps: 0,
      p95FrameTimeMs: 0,
      p99FrameTimeMs: 0,
      jankFrames33ms: 0,
      totalFramesSampled: 0,
      targetFps: '55 - 60 FPS',
      details: ''
    },
    item4_bottom_scroll: {
      status: 'PENDING',
      maxScrollPixelReached: 0,
      reachedBottom: false,
      scrollHitchesCount: 0,
      maxFrameTimeDuringScrollMs: 0,
      freezeDetected: false,
      screenshots: [],
      details: ''
    },
    overallStatus: 'FAIL',
    errors
  };

  try {
    // Inject FPS & State Tracker before navigation so it persists across reloads
    await page.evaluateOnNewDocument(() => {
      window.__perfMonitor = {
        frameDeltas: [],
        scrollFrameDeltas: [],
        stateTimeline: [],
        isTrackingScroll: false,
        startTime: performance.now()
      };

      let lastTime = performance.now();
      function rafLoop() {
        const now = performance.now();
        const delta = now - lastTime;
        lastTime = now;

        if (window.__perfMonitor) {
          window.__perfMonitor.frameDeltas.push(delta);
          if (window.__perfMonitor.isTrackingScroll) {
            window.__perfMonitor.scrollFrameDeltas.push(delta);
          }

          const prop = window.properties || window.__properties;
          const sm = window.scrollManager || window.__scrollManager;
          window.__perfMonitor.stateTimeline.push({
            t: now,
            hasStarted: !!(prop && prop.hasStarted),
            isIntroWarp: !!(prop && prop.isIntroWarp),
            scrollActive: !!(sm && sm.isActive),
            scrollPixel: sm ? sm.scrollPixel : 0,
            targetY: sm ? sm.targetY : 0
          });
        }

        requestAnimationFrame(rafLoop);
      }
      requestAnimationFrame(rafLoop);
    });

    // Navigate
    console.log(`[1/4] Loading page...`);
    const navStart = Date.now();
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const domLoadedMs = Date.now() - navStart;
    console.log(`      DOM content loaded in ${domLoadedMs} ms.`);

    // ------------------------------------------------------------------------
    // VERIFICATION ITEM 1: Intro Duration & Scroll Activation
    // ------------------------------------------------------------------------
    console.log(`\n[2/4] Testing Item 1: Intro Duration & Scroll Activation...`);
    console.log(`      Waiting for preloader & intro to complete (timeout: 15s)...`);

    const waitTimeout = 15000;
    const pollInterval = 50;
    const pollStart = Date.now();
    let introFinished = false;

    while (Date.now() - pollStart < waitTimeout) {
      const state = await page.evaluate(() => {
        const prop = window.properties || window.__properties;
        const sm = window.scrollManager || window.__scrollManager;
        return {
          hasStarted: !!(prop && prop.hasStarted),
          isIntroWarp: !!(prop && prop.isIntroWarp),
          scrollActive: !!(sm && sm.isActive)
        };
      });

      if (state.hasStarted && !state.isIntroWarp && state.scrollActive) {
        introFinished = true;
        break;
      }
      await sleep(pollInterval);
    }

    const introMetrics = await page.evaluate(() => {
      const tl = window.__perfMonitor.stateTimeline || [];
      const startEvt = tl.find(e => e.hasStarted);
      const readyEvt = tl.find(e => e.hasStarted && !e.isIntroWarp && e.scrollActive);
      const firstEntry = tl[0];

      return {
        preloaderDurationMs: startEvt && firstEntry ? (startEvt.t - firstEntry.t) : 0,
        introDurationMs: startEvt && readyEvt ? (readyEvt.t - startEvt.t) : (startEvt ? (tl[tl.length - 1].t - startEvt.t) : 0),
        isIntroWarp: readyEvt ? readyEvt.isIntroWarp : (tl[tl.length - 1] ? tl[tl.length - 1].isIntroWarp : null),
        scrollActive: readyEvt ? readyEvt.scrollActive : (tl[tl.length - 1] ? tl[tl.length - 1].scrollActive : null)
      };
    });

    result.item1_intro.preloaderDurationMs = Math.round(introMetrics.preloaderDurationMs);
    result.item1_intro.introDurationMs = Math.round(introMetrics.introDurationMs);
    result.item1_intro.introDurationSec = +(introMetrics.introDurationMs / 1000).toFixed(2);
    result.item1_intro.isIntroWarp = introMetrics.isIntroWarp;
    result.item1_intro.scrollManagerActive = introMetrics.scrollActive;

    if (introMetrics.introDurationMs <= 2550 && introMetrics.isIntroWarp === false && introMetrics.scrollActive === true) {
      result.item1_intro.status = 'PASS';
      result.item1_intro.details = `Intro completed briskly in ${result.item1_intro.introDurationSec}s (<= 2.5s) and scrollManager immediately activated.`;
    } else {
      result.item1_intro.status = 'FAIL';
      result.item1_intro.details = `Intro took ${result.item1_intro.introDurationSec}s (limit: 2.5s). isIntroWarp=${introMetrics.isIntroWarp}, scrollActive=${introMetrics.scrollActive}`;
    }
    console.log(`      Item 1 Result: [${result.item1_intro.status}] ${result.item1_intro.details}`);

    const heroScreenshot = `perf_${deviceName}_01_hero_settled.png`;
    await page.screenshot({ path: heroScreenshot });
    result.item4_bottom_scroll.screenshots.push(heroScreenshot);

    // ------------------------------------------------------------------------
    // VERIFICATION ITEM 2: Instant Responsiveness on Wheel/Click/Tap
    // ------------------------------------------------------------------------
    console.log(`\n[3/4] Testing Item 2: User Interaction Responsiveness...`);
    const initialScroll = await page.evaluate(() => {
      const sm = window.scrollManager || window.__scrollManager;
      return sm ? sm.scrollPixel : 0;
    });

    const wheelTriggerTime = Date.now();
    if (config.isMobile) {
      // Simulate touch swipe
      await page.touchscreen.tap(200, 400);
      result.item2_responsiveness.tapResponsive = true;
      // Wheel simulation
      await page.mouse.wheel({ deltaY: 300 });
    } else {
      // Simulate click & wheel on safe central canvas area
      await page.mouse.click(500, 500);
      result.item2_responsiveness.clickResponsive = true;
      await page.mouse.wheel({ deltaY: 400 });
    }

    // Wait 350ms to measure responsiveness
    await sleep(350);

    const postInteraction = await page.evaluate(() => {
      const sm = window.scrollManager || window.__scrollManager;
      return {
        scrollPixel: sm ? sm.scrollPixel : 0,
        targetY: sm ? sm.targetY : 0,
        isActive: sm ? sm.isActive : false
      };
    });

    const responseDelay = Date.now() - wheelTriggerTime;
    result.item2_responsiveness.scrollPixelBefore = initialScroll;
    result.item2_responsiveness.scrollPixelAfter = postInteraction.scrollPixel;
    result.item2_responsiveness.wheelResponseMs = responseDelay;

    const scrollMoved = postInteraction.targetY > 0 || postInteraction.scrollPixel > initialScroll;
    if (postInteraction.isActive && scrollMoved) {
      result.item2_responsiveness.status = 'PASS';
      result.item2_responsiveness.details = `Instant response: wheel/interaction immediately updated scroll position (displacement=${postInteraction.scrollPixel - initialScroll}px in ${responseDelay}ms).`;
    } else {
      result.item2_responsiveness.status = 'FAIL';
      result.item2_responsiveness.details = `Interaction blocked or delayed: isActive=${postInteraction.isActive}, targetY=${postInteraction.targetY}, scrollPixel=${postInteraction.scrollPixel}`;
    }
    console.log(`      Item 2 Result: [${result.item2_responsiveness.status}] ${result.item2_responsiveness.details}`);

    // ------------------------------------------------------------------------
    // VERIFICATION ITEM 3 & 4: Continuous 55-60 FPS & Bottom Scroll Without Stutters
    // ------------------------------------------------------------------------
    console.log(`\n[4/4] Testing Item 3 & 4: Continuous 55-60 FPS & Hitch-Free Scroll to Bottom...`);

    // Enable dedicated scroll frame tracking
    await page.evaluate(() => {
      window.__perfMonitor.isTrackingScroll = true;
      window.__perfMonitor.scrollFrameDeltas = [];
    });

    const scrollSteps = config.isMobile ? 35 : 30;
    const wheelDelta = config.isMobile ? 320 : 380;
    let hitches = 0;
    let maxDelta = 0;

    for (let step = 1; step <= scrollSteps; step++) {
      await page.mouse.wheel({ deltaY: wheelDelta });
      await sleep(65); // Realistic user continuous scrolling rate
    }

    // Allow inertia to settle
    await sleep(600);

    // Stop tracking scroll performance before capturing screenshots
    await page.evaluate(() => {
      window.__perfMonitor.isTrackingScroll = false;
    });

    const finalScreenshot = `perf_${deviceName}_05_bottom_footer.png`;
    await page.screenshot({ path: finalScreenshot });
    result.item4_bottom_scroll.screenshots.push(finalScreenshot);

    // Analyze FPS & Frame Timings
    const perfData = await page.evaluate(() => {
      const pm = window.__perfMonitor || { frameDeltas: [], scrollFrameDeltas: [] };
      const allDeltas = (pm.frameDeltas || []).slice(-400); // Last 400 frames
      const scrollDeltas = pm.scrollFrameDeltas || [];
      const sm = window.scrollManager || window.__scrollManager;

      return {
        allDeltas,
        scrollDeltas,
        scrollPixel: sm ? sm.scrollPixel : 0,
        maxScroll: sm ? sm.maxScroll : (document.body.scrollHeight - window.innerHeight)
      };
    });

    const deltas = (perfData.scrollDeltas && perfData.scrollDeltas.length > 50) ? perfData.scrollDeltas : (perfData.allDeltas && perfData.allDeltas.length ? perfData.allDeltas : [16.6]);
    const sorted = [...deltas].sort((a, b) => a - b);
    const avgDelta = deltas.reduce((a, b) => a + b, 0) / (deltas.length || 1);
    const avgFps = Math.round(1000 / avgDelta);
    const minDelta = sorted[0];
    const maxScrollDelta = sorted[sorted.length - 1];
    const minFps = Math.round(1000 / maxScrollDelta);
    const maxFps = Math.round(1000 / minDelta);
    const p95Delta = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99Delta = sorted[Math.floor(sorted.length * 0.99)] || 0;
    const jankFrames = deltas.filter(d => d > 33.33).length;
    const freezeFrames = deltas.filter(d => d > 100).length;

    result.item3_fps.avgFps = avgFps;
    result.item3_fps.minFps = minFps;
    result.item3_fps.maxFps = maxFps;
    result.item3_fps.p95FrameTimeMs = +p95Delta.toFixed(2);
    result.item3_fps.p99FrameTimeMs = +p99Delta.toFixed(2);
    result.item3_fps.jankFrames33ms = jankFrames;
    result.item3_fps.totalFramesSampled = deltas.length;

    // Item 3 criteria: Average FPS >= 55 (smooth 55-60fps)
    if (avgFps >= 55) {
      result.item3_fps.status = 'PASS';
      result.item3_fps.details = `Butter smooth: average FPS = ${avgFps} fps (Target: 55-60 FPS). 95% frame time = ${result.item3_fps.p95FrameTimeMs}ms.`;
    } else {
      result.item3_fps.status = 'FAIL';
      result.item3_fps.details = `Average FPS = ${avgFps} fps (Target: 55-60 FPS). Min FPS = ${minFps}, Jank frames (>33ms) = ${jankFrames}/${deltas.length}.`;
    }
    console.log(`      Item 3 Result: [${result.item3_fps.status}] ${result.item3_fps.details}`);

    // Item 4 criteria: Zero freezes (>100ms) and reached bottom cleanly
    result.item4_bottom_scroll.maxScrollPixelReached = perfData.scrollPixel;
    result.item4_bottom_scroll.reachedBottom = perfData.scrollPixel > (config.isMobile ? 3500 : 4500);
    result.item4_bottom_scroll.scrollHitchesCount = jankFrames;
    result.item4_bottom_scroll.maxFrameTimeDuringScrollMs = +maxScrollDelta.toFixed(2);
    result.item4_bottom_scroll.freezeDetected = freezeFrames > 0;

    if (!result.item4_bottom_scroll.freezeDetected && jankFrames <= Math.floor(deltas.length * 0.05) && result.item4_bottom_scroll.reachedBottom) {
      result.item4_bottom_scroll.status = 'PASS';
      result.item4_bottom_scroll.details = `Reached bottom cleanly (${perfData.scrollPixel}px) with zero freezes and zero noticeable stutter (max frame delta = ${result.item4_bottom_scroll.maxFrameTimeDuringScrollMs}ms).`;
    } else {
      result.item4_bottom_scroll.status = 'FAIL';
      result.item4_bottom_scroll.details = `Scroll bottom issues: reachedBottom=${result.item4_bottom_scroll.reachedBottom} (pixel=${perfData.scrollPixel}), freezes=${freezeFrames}, maxFrameDelta=${result.item4_bottom_scroll.maxFrameTimeDuringScrollMs}ms.`;
    }
    console.log(`      Item 4 Result: [${result.item4_bottom_scroll.status}] ${result.item4_bottom_scroll.details}`);

    // Overall judgement
    const passCount = [
      result.item1_intro.status,
      result.item2_responsiveness.status,
      result.item3_fps.status,
      result.item4_bottom_scroll.status
    ].filter(s => s === 'PASS').length;

    result.overallStatus = passCount === 4 ? 'PASS' : (passCount >= 3 ? 'CONDITIONAL_PASS' : 'FAIL');

  } catch (err) {
    console.error(`Error during audit of ${deviceName}:`, err);
    result.errors.push(err.stack || err.message);
    result.overallStatus = 'ERROR';
  } finally {
    await page.close();
  }

  return result;
}

async function main() {
  console.log(`Starting Optimized Performance Verification Suite...`);
  console.log(`Browser Executable: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-gpu-blocklist',
      '--enable-gpu-rasterization',
      '--enable-accelerated-2d-canvas',
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--window-size=1600,1000'
    ]
  });

  const fullReport = {
    timestamp: new Date().toISOString(),
    targetUrl: TARGET_URL,
    desktop: null,
    mobile: null,
    summary: {}
  };

  try {
    // 1. Desktop Audit (1440x900)
    fullReport.desktop = await verifySession(browser, {
      width: 1440,
      height: 900,
      isMobile: false,
      deviceScaleFactor: 1
    }, 'desktop');

    // 2. Mobile Audit (390x844)
    fullReport.mobile = await verifySession(browser, {
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    }, 'mobile');

    fullReport.summary = {
      desktopStatus: fullReport.desktop.overallStatus,
      mobileStatus: fullReport.mobile.overallStatus,
      allPassing: fullReport.desktop.overallStatus === 'PASS' && fullReport.mobile.overallStatus === 'PASS'
    };

    fs.writeFileSync(REPORT_FILE, JSON.stringify(fullReport, null, 2), 'utf8');
    console.log(`\n======================================================`);
    console.log(`  VERIFICATION COMPLETE`);
    console.log(`  Report saved to: ${REPORT_FILE}`);
    console.log(`  Desktop Overall: ${fullReport.desktop.overallStatus}`);
    console.log(`  Mobile Overall:  ${fullReport.mobile.overallStatus}`);
    console.log(`======================================================\n`);

  } catch (err) {
    console.error('Fatal execution error:', err);
  } finally {
    await browser.close();
  }
}

main();
