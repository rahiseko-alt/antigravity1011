const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));

  const scrollInfo = await page.evaluate(() => {
    const list = [];
    document.querySelectorAll('section, div[id*="home-"]').forEach(el => {
      list.push({
        id: el.id,
        offsetTop: el.offsetTop,
        offsetHeight: el.offsetHeight
      });
    });
    return {
      contentSizePixel: window.scrollManager.contentSizePixel,
      viewSizePixel: window.scrollManager.viewSizePixel,
      maxScroll: window.scrollManager.contentSizePixel - window.scrollManager.viewSizePixel,
      sections: list
    };
  });
  console.log('Scroll Info:', JSON.stringify(scrollInfo, null, 2));

  await browser.close();
})();
