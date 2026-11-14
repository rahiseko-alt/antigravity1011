const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=1920,1080']
  });

  // 1. Desktop Test (1920x1080)
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // wait for intro settle
  await new Promise(r => setTimeout(r, 8500));

  // scroll to home-reel with wheel events
  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel({ deltaY: 180 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: 'line_designer_desktop.png' });
  console.log('Saved line_designer_desktop.png');

  // 2. Mobile Test (390x844, touch device)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // wait for intro settle
  await new Promise(r => setTimeout(r, 8500));

  // scroll on mobile using mouse wheel (simulating touch scroll in browser)
  for (let i = 0; i < 10; i++) {
    await mobilePage.mouse.wheel({ deltaY: 140 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1200));

  await mobilePage.screenshot({ path: 'line_designer_mobile.png' });
  console.log('Saved line_designer_mobile.png');

  await browser.close();
})();
