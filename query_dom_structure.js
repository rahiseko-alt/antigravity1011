const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  
  await page.waitForFunction(() => {
    return window.scrollManager && window.scrollManager.isActive;
  }, { timeout: 25000 });

  const domElements = await page.evaluate(() => {
    function getSummary(sel) {
      const el = document.querySelector(sel);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        selector: sel,
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom },
        offsetTop: el.offsetTop,
        offsetHeight: el.offsetHeight
      };
    }
    
    // Find sections
    const sections = Array.from(document.querySelectorAll('section, [id*="reel"], [id*="featured"], [id*="initiative"], [id*="member"], [id*="goal"]'))
      .map(el => ({ id: el.id, className: el.className, tag: el.tagName }));

    // Reel specifics
    const reel = getSummary('#home-reel');
    const reelTitle = getSummary('#home-reel-title');
    const reelHeadline = getSummary('#home-reel-title-line-1');
    const reelBtn = getSummary('#home-reel-cta') || getSummary('#home-reel-video-watch-btn');
    
    // Initiatives / Featured cards
    const featured = getSummary('#home-featured');
    const cards = Array.from(document.querySelectorAll('.home-featured-card, [class*="card"], .initiatives-card, [data-initiative]'))
      .map(c => ({ id: c.id, className: c.className, text: c.textContent.trim().substring(0, 30), offsetTop: c.offsetTop, offsetHeight: c.offsetHeight }));

    // Members
    const members = getSummary('#home-members');
    const memberCards = Array.from(document.querySelectorAll('.member-card, [class*="member"]'))
      .map(m => ({ id: m.id, className: m.className, text: m.textContent.trim().substring(0, 30), offsetTop: m.offsetTop, offsetHeight: m.offsetHeight }));

    // Goal
    const goal = getSummary('#home-goal');

    return {
      sections,
      reel,
      reelTitle,
      reelHeadline,
      reelBtn,
      featured,
      cards: cards.slice(0, 10),
      members,
      memberCards: memberCards.slice(0, 10),
      goal
    };
  });

  console.log('DOM summary:', JSON.stringify(domElements, null, 2));
  await browser.close();
})();
