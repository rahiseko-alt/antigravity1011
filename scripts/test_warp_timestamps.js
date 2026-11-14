const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== Capturing Bold Arial Warp Text Stages (1920x1080) ===');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--no-sandbox',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.goalTunnels && window.goalTunnels.hasIntroInitialized, { timeout: 35000 });

  // Test various timestamps in Phase 1 (0.50s to 2.60s)
  // 1.5s, 1.8s, 2.0s
  for (const t of [1.4, 1.6, 1.8, 2.0]) {
    await page.evaluate((elapsed) => {
      window.goalTunnels.introStartTime = performance.now() - (elapsed * 1000);
      window.visuals.syncProperties(1/60);
      window.visuals.update(1/60);
    }, t);
    await sleep(100);
    const shot = `test_bold_p1_${t}s.png`;
    await page.screenshot({ path: shot });
    console.log(`Saved ${shot}`);
  }

  // Test various timestamps in Phase 2 (2.60s to 5.80s)
  // 3.4s, 3.8s, 4.2s, 4.6s
  for (const t of [3.4, 3.8, 4.2, 4.6]) {
    await page.evaluate((elapsed) => {
      window.goalTunnels.introStartTime = performance.now() - (elapsed * 1000);
      window.visuals.syncProperties(1/60);
      window.visuals.update(1/60);
    }, t);
    await sleep(100);
    const shot = `test_bold_p2_${t}s.png`;
    await page.screenshot({ path: shot });
    console.log(`Saved ${shot}`);
  }

  await browser.close();
  console.log('Test capture completed.');
})();
