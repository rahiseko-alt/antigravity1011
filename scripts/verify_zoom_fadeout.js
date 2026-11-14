const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait for countdown to finish (countdown takes ~1.5s)
  await page.waitForFunction(() => {
    return window.properties && window.properties.hasStarted && window.properties.isIntroWarp;
  }, { timeout: 10000 });

  console.log('Intro warp started! Capturing zoom-in while fade-out frames...');

  // Phase 1: tP1 = 2.2s.
  // r = 0.5s: entry
  // r = 1.3s: (p1 = 0.6) zoom in starting, opacity = 1
  // r = 2.05s: (p1 = 0.93) zoom in huge, opacity fading out!
  // r = 2.18s: (p1 = 0.99) zoom in 11x, opacity nearly 0!
  // r = 3.5s: Phase 2 zooming in
  // r = 4.25s: Phase 2 peak rush while fading out!

  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'verify_p1_steady.png' });

  await new Promise(r => setTimeout(r, 900)); // r ~ 1.5s
  await page.screenshot({ path: 'verify_p1_zooming.png' });

  await new Promise(r => setTimeout(r, 600)); // r ~ 2.1s (p1 ~ 0.95: huge scale + fadeout)
  await page.screenshot({ path: 'verify_p1_zoom_fadeout.png' });

  await new Promise(r => setTimeout(r, 900)); // r ~ 3.0s (Phase 2 cyber tunnel)
  await page.screenshot({ path: 'verify_p2_steady.png' });

  await new Promise(r => setTimeout(r, 1100)); // r ~ 4.1s (Phase 2 zoom + fadeout into white)
  await page.screenshot({ path: 'verify_p2_zoom_fadeout.png' });

  console.log('Verification screenshots captured!');
  await browser.close();
})();
