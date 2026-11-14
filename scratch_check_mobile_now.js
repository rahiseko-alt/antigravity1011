const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 1000));

  const scrollTargets = [800, 1600, 2400, 3200, 4000, 4800, 5600, 6200];

  for (const s of scrollTargets) {
    await page.evaluate((target) => {
      window.scrollManager.scrollPixel = target;
      window.scrollManager.targetScrollPixel = target;
      window.scrollTo(0, target);
    }, s);
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: `current_mobile_${s}.png` });
    console.log(`Saved current_mobile_${s}.png`);
  }

  await browser.close();
})();
