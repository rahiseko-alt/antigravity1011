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
  await new Promise(r => setTimeout(r, 6000));

  const scrollInfo = await page.evaluate(() => {
    const list = [];
    document.querySelectorAll('section, div[id="home-reel"], div[id="home-featured"], div[id="home-members"], div[id="home-goal"]').forEach(el => {
      list.push({
        id: el.id,
        offsetTop: el.offsetTop,
        offsetHeight: el.offsetHeight
      });
    });
    return {
      contentSizePixel: window.scrollManager.contentSizePixel,
      viewSizePixel: window.scrollManager.viewSizePixel,
      sections: list
    };
  });
  console.log('Mobile Scroll Info:', JSON.stringify(scrollInfo, null, 2));

  await browser.close();
})();
