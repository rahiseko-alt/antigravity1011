const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6500));

  const sections = await page.evaluate(() => {
    const ids = ['home-hero', 'home-reel', 'home-featured', 'home-initiatives', 'home-members', 'home-goal', 'end-section'];
    return ids.map(id => {
      const el = document.getElementById(id);
      if (!el) return { id, notFound: true };
      const r = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        id,
        offsetTop: el.offsetTop,
        rectTop: r.top,
        height: el.offsetHeight,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        transform: style.transform
      };
    });
  });

  console.log(JSON.stringify(sections, null, 2));
  await browser.close();
})();
