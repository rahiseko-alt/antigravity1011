const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new', args: ['--no-sandbox'] });
  
  for (const isMobile of [false, true]) {
    const page = await browser.newPage();
    if (isMobile) {
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    } else {
      await page.setViewport({ width: 1920, height: 1080 });
    }
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    
    const layout = await page.evaluate(() => {
      const getBox = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          top: rect.top + window.scrollY,
          bottom: rect.bottom + window.scrollY,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height
        };
      };
      
      const cards = Array.from(document.querySelectorAll('.project-item')).map((el, i) => {
        const rect = el.getBoundingClientRect();
        return {
          index: i + 1,
          title: el.querySelector('h3')?.innerText?.trim() || '',
          top: Math.round(rect.top + window.scrollY),
          bottom: Math.round(rect.bottom + window.scrollY),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      });

      const memberCards = Array.from(document.querySelectorAll('#home-members [class*="item"], #home-members article, #home-members li')).map((el, i) => {
        const rect = el.getBoundingClientRect();
        return {
          index: i + 1,
          top: Math.round(rect.top + window.scrollY),
          bottom: Math.round(rect.bottom + window.scrollY),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      });

      return {
        viewport: { w: window.innerWidth, h: window.innerHeight },
        reel: getBox('#home-reel'),
        initiatives: getBox('#home-initiatives'),
        cards,
        cta: getBox('#home-featured-cta'),
        members: getBox('#home-members'),
        memberCards: memberCards.slice(0, 6),
        totalHeight: document.documentElement.scrollHeight
      };
    });
    console.log(isMobile ? '=== MOBILE LAYOUT ===' : '=== DESKTOP LAYOUT ===');
    console.log(JSON.stringify(layout, null, 2));
    await page.close();
  }
  await browser.close();
})();
