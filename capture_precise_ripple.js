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

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    // Wait until started
    for (let i = 0; i < 80; i++) {
      const ready = await page.evaluate(() => window.properties && window.properties.hasStarted && !window.properties.isIntroWarp).catch(() => false);
      if (ready) break;
      await sleep(200);
    }
    await sleep(800);

    // Scroll to Card 1
    await page.evaluate(() => {
      const el = document.querySelector('.project-item-flagship');
      const sm = window.scrollManager;
      if (el && sm) {
        const rect = el.getBoundingClientRect();
        const current = sm.scrollPixel || 0;
        const target = current + rect.top - 120;
        sm.targetScrollPixel = target;
        sm.scrollPixel = target;
      }
    });
    await sleep(800);

    // Continuous scroll and capture frames to catch ripple peak
    console.log('Capturing ripple motion on Card 1...');
    for (let f = 1; f <= 3; f++) {
      await page.mouse.wheel({ deltaY: 300 });
      await sleep(30);
      await page.screenshot({ path: path.resolve(`verified_card1_ripple_frame_${f}.png`) });
    }

    // Scroll to Card 2
    await page.evaluate(() => {
      const el = document.querySelector('.project-item[data-id="oryzo_ai"]');
      const sm = window.scrollManager;
      if (el && sm) {
        const rect = el.getBoundingClientRect();
        const current = sm.scrollPixel || 0;
        const target = current + rect.top - 120;
        sm.targetScrollPixel = target;
        sm.scrollPixel = target;
      }
    });
    await sleep(800);

    console.log('Capturing ripple motion on Card 2...');
    for (let f = 1; f <= 3; f++) {
      await page.mouse.wheel({ deltaY: 300 });
      await sleep(30);
      await page.screenshot({ path: path.resolve(`verified_card2_ripple_frame_${f}.png`) });
    }

    console.log('Finished capturing high-precision ripple frames.');
    await page.close();
  } finally {
    await browser.close();
  }
})();
