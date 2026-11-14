const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__properties && window.__properties.hasStarted, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const el = document.getElementById('home-featured');
    if (el && window.scrollManager) {
      window.scrollManager.scrollPixel = el.offsetTop;
      window.scrollManager.targetScrollPixel = el.offsetTop;
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  const debug = await page.evaluate(() => {
    const card1Img = document.querySelector('[data-id="oryzo_ai"] .project-item-image');
    const card1Main = document.querySelector('[data-id="oryzo_ai"] .project-item-main');
    const card1 = document.querySelector('[data-id="oryzo_ai"]');
    const canvas = document.getElementById('canvas');
    const ui = document.getElementById('ui');
    return {
      card1ImgHtml: card1Img ? card1Img.outerHTML : null,
      card1ImgBg: card1Img ? window.getComputedStyle(card1Img).backgroundImage : null,
      card1ImgRect: card1Img ? card1Img.getBoundingClientRect() : null,
      card1MainDisplay: card1Main ? window.getComputedStyle(card1Main).display : null,
      card1MainVisibility: card1Main ? window.getComputedStyle(card1Main).visibility : null,
      card1MainOpacity: card1Main ? window.getComputedStyle(card1Main).opacity : null,
      card1Rect: card1 ? card1.getBoundingClientRect() : null,
      canvasZIndex: canvas ? window.getComputedStyle(canvas).zIndex : null,
      uiZIndex: ui ? window.getComputedStyle(ui).zIndex : null,
      canvasPosition: canvas ? window.getComputedStyle(canvas).position : null,
      canvasDisplay: canvas ? window.getComputedStyle(canvas).display : null,
    };
  });
  console.log('Debug info:', JSON.stringify(debug, null, 2));
  await browser.close();
})();
