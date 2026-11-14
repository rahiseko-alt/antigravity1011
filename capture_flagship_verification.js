const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  async function waitForPageReady(page) {
    for (let i = 0; i < 80; i++) {
      const ready = await page.evaluate(() => {
        return window.properties && window.properties.hasStarted && !window.properties.isIntroWarp;
      }).catch(() => false);
      if (ready) break;
      await sleep(200);
    }
    await sleep(800);
  }

  // 1. Desktop (1440x950)
  console.log('Capturing Desktop...');
  const desktop = await browser.newPage();
  await desktop.setViewport({ width: 1440, height: 950, deviceScaleFactor: 2 });
  await desktop.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(desktop);

  // Position flagship card cleanly in view below header
  await desktop.evaluate(() => {
    const el = document.querySelector('.project-item-flagship');
    const sm = window.scrollManager;
    if (el && sm) {
      const rect = el.getBoundingClientRect();
      const current = sm.scrollPixel || 0;
      // Leave 100px headroom so the header doesn't overlap the eyebrow badge
      const target = current + rect.top - 100;
      sm.targetScrollPixel = target;
      sm.scrollPixel = target;
    }
  });
  await sleep(1000);
  await desktop.screenshot({ path: path.resolve('verified_desktop_outside.png') });
  console.log('Saved verified_desktop_outside.png');
  await desktop.close();

  // 2. Mobile (390x844 iPhone 14)
  console.log('Capturing Mobile...');
  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobile.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(mobile);

  // Position flagship card cleanly in view below header
  await mobile.evaluate(() => {
    const el = document.querySelector('.project-item-flagship');
    const sm = window.scrollManager;
    if (el && sm) {
      const rect = el.getBoundingClientRect();
      const current = sm.scrollPixel || 0;
      // Leave 80px headroom
      const target = current + rect.top - 80;
      sm.targetScrollPixel = target;
      sm.scrollPixel = target;
    }
  });
  await sleep(1000);
  await mobile.screenshot({ path: path.resolve('verified_mobile_outside.png') });
  console.log('Saved verified_mobile_outside.png');
  await mobile.close();

  await browser.close();
  console.log('ALL COMPLETE');
})();
