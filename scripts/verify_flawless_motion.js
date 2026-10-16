const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function verifyMotion() {
  console.log('=== LAUNCHING VISUAL VERIFICATION FOR FLAWLESS MOTION ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  console.log('Page loaded. Waiting for intro sequence...');
  await new Promise(r => setTimeout(r, 6500));

  const scrollTargets = [
    { y: 30, name: 'flawless_mobile_01_hero_start.png' },
    { y: 350, name: 'flawless_mobile_02_hero_loop.png' },
    { y: 1100, name: 'flawless_mobile_03_reel_swoop.png' },
    { y: 1450, name: 'flawless_mobile_04_initiatives_loop.png' },
    { y: 2400, name: 'flawless_mobile_05_cards_wave.png' },
    { y: 3600, name: 'flawless_mobile_06_cards_scurve.png' },
    { y: 4800, name: 'flawless_mobile_07_members_wave.png' },
  ];

  for (const t of scrollTargets) {
    await page.evaluate((targetY) => {
      window.scrollTo({ top: targetY, behavior: 'instant' });
      if (window.scrollManager) {
        window.scrollManager.scrollPixel = targetY;
        window.scrollManager.scroll = targetY;
      }
    }, t.y);

    await new Promise(r => setTimeout(r, 500));
    const outPath = path.resolve(t.name);
    await page.screenshot({ path: outPath });
    console.log(`Saved screenshot: ${t.name}`);
  }

  // Also test desktop
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.evaluate(() => {
    window.scrollTo({ top: 1400, behavior: 'instant' });
    if (window.scrollManager) {
      window.scrollManager.scrollPixel = 1400;
      window.scrollManager.scroll = 1400;
    }
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.resolve('flawless_desktop_1400_reel.png') });
  console.log('Saved screenshot: flawless_desktop_1400_reel.png');

  await browser.close();
  console.log('=== VISUAL VERIFICATION COMPLETE ===');
}

verifyMotion().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
