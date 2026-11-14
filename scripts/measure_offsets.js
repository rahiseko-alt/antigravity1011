const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new', args: ['--no-sandbox'] });
  
  for (const vp of [{ name: 'mobile', w: 390, h: 844 }, { name: 'desktop', w: 1920, h: 1080 }]) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: vp.h });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    
    const offsets = await page.evaluate(() => {
      const getRect = sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top + window.scrollY), bottom: Math.round(r.bottom + window.scrollY), height: Math.round(r.height) };
      };
      return {
        docHeight: document.documentElement.scrollHeight,
        hero: getRect('#home-hero'),
        reel: getRect('#home-reel'),
        howItWorks: getRect('.home-reel-how-it-works') || getRect('[href*="how-it-works"]') || getRect('#home-reel button') || getRect('#home-reel a'),
        featured: getRect('#home-featured'),
        members: getRect('#home-members'),
        goal: getRect('#home-goal')
      };
    });
    console.log(`=== ${vp.name.toUpperCase()} (w=${vp.w}, h=${vp.h}) ===`);
    console.log(JSON.stringify(offsets, null, 2));
  }
  await browser.close();
})();
