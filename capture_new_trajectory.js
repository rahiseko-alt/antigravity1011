const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=1920,1080']
  });

  // 1. Desktop captures
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 9000)); // wait for intro settle

  // Stage 1: Top of reel
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel({ deltaY: 150 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'reel_new_01_top.png' });
  console.log('Saved reel_new_01_top.png');

  // Stage 2: Mid reel (showing tapered tip & new curve)
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel({ deltaY: 150 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'reel_new_02_mid.png' });
  console.log('Saved reel_new_02_mid.png');

  // Stage 3: Deep scroll into Featured section (showing extended distance)
  for (let i = 0; i < 15; i++) {
    await page.mouse.wheel({ deltaY: 180 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'reel_new_03_deep.png' });
  console.log('Saved reel_new_03_deep.png');

  // 2. Mobile capture
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 9000));

  for (let i = 0; i < 14; i++) {
    await mobilePage.mouse.wheel({ deltaY: 150 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1000));
  await mobilePage.screenshot({ path: 'reel_new_mobile.png' });
  console.log('Saved reel_new_mobile.png');

  await browser.close();
})();
