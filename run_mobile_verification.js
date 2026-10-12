const puppeteer = require('puppeteer-core');
const fs = require('fs');

const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const USER_AGENTS = {
  iPhone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  Android: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
};

async function inspectTarget(targetName, url, uaName, trackSeconds = 12) {
  console.log(`\n======================================================================`);
  console.log(`TESTING: ${targetName} (${url}) [Emulating: ${uaName}]`);
  console.log(`======================================================================`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  await page.setUserAgent(USER_AGENTS[uaName]);

  const report = {
    target: targetName,
    url,
    userAgent: uaName,
    consoleErrors: [],
    consoleWarnings: [],
    network404s: [],
    pageErrors: [],
    unhandledRejections: [],
    preloaderTimeline: []
  };

  await page.evaluateOnNewDocument(() => {
    window.__capturedErrors = [];
    window.addEventListener('error', e => {
      window.__capturedErrors.push({
        type: 'window_error',
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error ? (e.error.stack || e.error.toString()) : null
      });
    });
    window.addEventListener('unhandledrejection', e => {
      window.__capturedErrors.push({
        type: 'unhandledrejection',
        reason: e.reason ? (e.reason.stack || e.reason.toString()) : String(e.reason)
      });
    });
  });

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`[CONSOLE ERROR]`, text);
      report.consoleErrors.push({ text, location: msg.location() });
    } else if (type === 'warn') {
      report.consoleWarnings.push({ text, location: msg.location() });
    }
  });

  page.on('pageerror', err => {
    console.error(`[PAGE UNCAUGHT ERROR]`, err.message);
    console.error(`[STACK TRACE]`, err.stack);
    report.pageErrors.push({ message: err.message, stack: err.stack });
  });

  page.on('response', res => {
    if (res.status() === 404) {
      console.warn(`[NETWORK 404] ${res.url()}`);
      report.network404s.push({ status: 404, url: res.url() });
    }
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (err) {
    console.error(`Navigation error: ${err.message}`);
  }

  const samples = Math.floor(trackSeconds * 5); // 200ms per sample
  console.log(`Tracking preloader values every 200ms for ${trackSeconds}s (${samples} samples)...`);

  for (let i = 0; i <= samples; i++) {
    const data = await page.evaluate(() => {
      const el = document.getElementById('preloader-percent-digits');
      const p = window.__properties;
      const loader = p ? p.loader : null;
      return {
        digits: el ? el.innerText.replace(/\n/g, ' ') : null,
        hasStarted: p ? p.hasStarted : null,
        hasInitialized: p ? p.hasInitialized : null,
        loaderWeight: loader ? `${loader.loadedWeight} / ${loader.totalWeight}` : null,
        activeItems: loader && loader.activeItems ? loader.activeItems.map(a => a.url || a.name || a) : null,
        capturedErrors: window.__capturedErrors || []
      };
    }).catch(e => ({ evalError: e.message }));

    report.preloaderTimeline.push({
      timeSec: (i * 0.2).toFixed(1),
      digits: data.digits,
      hasStarted: data.hasStarted,
      loaderWeight: data.loaderWeight,
      activeItems: data.activeItems
    });

    if (i % 5 === 0 || i === samples || (data.digits && data.digits !== report.preloaderTimeline[i - 1]?.digits)) {
      console.log(`[T=${(i * 0.2).toFixed(1)}s] digits="${data.digits}" | activeItems=${JSON.stringify(data.activeItems)} | started=${data.hasStarted}`);
    }

    if (data.capturedErrors && data.capturedErrors.length > report.unhandledRejections.length) {
      report.unhandledRejections = data.capturedErrors;
    }

    if (i < samples) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  const screenshotFile = `screenshot_${targetName}_${uaName}.png`;
  await page.screenshot({ path: screenshotFile });
  console.log(`Captured screenshot: ${screenshotFile}`);

  fs.writeFileSync(`report_${targetName}_${uaName}.json`, JSON.stringify(report, null, 2));
  await browser.close();
  return report;
}

(async () => {
  // Test 1: GitHub Pages with iPhone Safari (30 seconds to allow network load)
  await inspectTarget('github_pages', 'https://rahiseko-alt.github.io/antigravity1011/', 'iPhone', 30);

  // Test 2: Localhost 3000 with iPhone Safari (10 seconds)
  await inspectTarget('localhost', 'http://localhost:3000/', 'iPhone', 10);

  console.log('\n======================================================================');
  console.log('ALL TESTS COMPLETED');
  console.log('======================================================================');
})();
