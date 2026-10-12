const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  for (let i = 0; i < 40; i++) {
    const isStarted = await page.evaluate(() => window.__properties && window.__properties.hasStarted).catch(() => false);
    if (isStarted) break;
    await new Promise(r => setTimeout(r, 250));
  }
  await new Promise(r => setTimeout(r, 1500));

  // Small scroll 1
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scroll_seq_1.png' });

  // Small scroll 2
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scroll_seq_2.png' });

  // Small scroll 3
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scroll_seq_3.png' });

  // Small scroll 4
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scroll_seq_4.png' });

  await browser.close();
  console.log('Sequence complete');
})();
