const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const launchArgs = [
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
];

async function testCountdownAndWarp() {
  console.log('=== TEST 1: Countdown 0 to 100 & Warp Dynamics ===');
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: launchArgs
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('font-size:0;color:transparent') && !text.includes('ERR_CONNECTION_CLOSED')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  // Track state in high frequency directly inside the browser using requestAnimationFrame
  await page.evaluateOnNewDocument(() => {
    window.__COUNTDOWN_LOG = [];
    const record = () => {
      const p = window.__preloader;
      const gt = window.__goalTunnels || window.goalTunnels;
      const prop = window.__properties;
      const digits = document.getElementById('preloader-percent-digits');
      if (p) {
        window.__COUNTDOWN_LOG.push({
          time: performance.now(),
          text: digits ? digits.innerText.replace(/\s+/g, '') : '',
          percent: p.percent,
          easedPercent: p.easedPercent,
          zoomProgress: p.zoomProgress,
          zoomScale: p.zoomScale,
          isActive: p.isActive,
          isIntroWarp: prop ? prop.isIntroWarp : false,
          tunnelDeltaTime: gt ? gt.tunnelDeltaTime : null,
          tunnelTime: gt ? gt.tunnelTime : null
        });
      }
      requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait for intro sequence to complete (~5.5 seconds)
  await sleep(5500);

  const logs = await page.evaluate(() => window.__COUNTDOWN_LOG);
  await browser.close();

  console.log(`Collected ${logs.length} high-frequency frames!`);

  // Analyze Countdown
  let prevNumber = -1;
  let backwardsCount = 0;
  let zoomStartedBefore90 = false;
  let zoomStartedAt90 = false;
  let warpTunnelDeltaTimes = [];

  for (let i = 0; i < logs.length; i++) {
    const frame = logs[i];
    const num = parseInt(frame.text, 10);
    if (!isNaN(num)) {
      if (prevNumber !== -1 && num < prevNumber) {
        console.error(`JANK DETECTED: Number went backwards from ${prevNumber} to ${num} at frame ${i}!`);
        backwardsCount++;
      }
      prevNumber = num;
    }

    if (frame.zoomProgress > 0 && frame.easedPercent < 89.9) {
      zoomStartedBefore90 = true;
    }
    if (frame.zoomProgress > 0 && frame.easedPercent >= 90) {
      zoomStartedAt90 = true;
    }

    if (frame.isIntroWarp && frame.tunnelDeltaTime != null && frame.tunnelDeltaTime > 0) {
      warpTunnelDeltaTimes.push(frame.tunnelDeltaTime);
    }
  }

  console.log('--- Countdown Analysis ---');
  console.log(`Backwards count occurrences: ${backwardsCount} (Expected: 0)`);
  console.log(`Zoom started before 90%: ${zoomStartedBefore90} (Expected: false)`);
  console.log(`Zoom started at 90%: ${zoomStartedAt90} (Expected: true)`);

  // Check samples around 85%, 90%, 95%, 100%
  console.log('\n--- Sample Frames Around Zoom Threshold (90%) ---');
  const frame85 = logs.find(f => f.easedPercent >= 84 && f.easedPercent <= 87);
  const frame90 = logs.find(f => f.easedPercent >= 89.5 && f.easedPercent <= 91);
  const frame95 = logs.find(f => f.easedPercent >= 94.5 && f.easedPercent <= 96);
  const frame100 = logs.find(f => f.easedPercent >= 99.8);

  if (frame85) console.log('At ~85%:', { text: frame85.text, eased: frame85.easedPercent.toFixed(1), zoomProgress: frame85.zoomProgress, zoomScale: frame85.zoomScale });
  if (frame90) console.log('At ~90%:', { text: frame90.text, eased: frame90.easedPercent.toFixed(1), zoomProgress: frame90.zoomProgress, zoomScale: frame90.zoomScale });
  if (frame95) console.log('At ~95%:', { text: frame95.text, eased: frame95.easedPercent.toFixed(1), zoomProgress: frame95.zoomProgress, zoomScale: frame95.zoomScale });
  if (frame100) console.log('At ~100%:', { text: frame100.text, eased: frame100.easedPercent.toFixed(1), zoomProgress: frame100.zoomProgress, zoomScale: frame100.zoomScale });

  console.log('\n--- Warp Speed (tunnelDeltaTime) Analysis ---');
  if (warpTunnelDeltaTimes.length > 0) {
    const avgDt = warpTunnelDeltaTimes.reduce((a, b) => a + b, 0) / warpTunnelDeltaTimes.length;
    // Expected: 60fps frame dt is ~0.0166s. e * (1/3) = ~0.0055s
    console.log(`Average tunnelDeltaTime: ${avgDt.toFixed(5)}s (Expected ~0.0055s for 60fps e/3)`);
    console.log(`Min tunnelDeltaTime: ${Math.min(...warpTunnelDeltaTimes).toFixed(5)}s, Max: ${Math.max(...warpTunnelDeltaTimes).toFixed(5)}s`);
  }

  console.log(`\nConsole Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  }

  return {
    backwardsCount,
    zoomStartedBefore90,
    zoomStartedAt90,
    consoleErrors
  };
}

testCountdownAndWarp().then(() => {
  console.log('\nDone test 1.');
});
