const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=390,844']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6500));

  for (let sp = 400; sp <= 2000; sp += 200) {
    const data = await page.evaluate((px) => {
      window.scrollManager.scrollToPixel(px, true);
      // Let's inspect line 0
      const line = window.reelSection ? window.reelSection.lineVisual : null;
      return {
        px,
        scrollPixel: window.scrollManager.scrollPixel,
        viewportWidth: window.properties ? window.properties.viewportWidth : 0,
        viewportHeight: window.properties ? window.properties.viewportHeight : 0,
      };
    }, sp);

    await new Promise(r => setTimeout(r, 400));
    const path = `debug_mob_${sp}.png`;
    await page.screenshot({ path });
    console.log(data, path);
  }

  await browser.close();
})();
