const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 20000 });
  
  const result = await page.evaluate(() => {
    // 1. Reel
    const reel = document.querySelector('#home-reel');
    const reelHeadline = document.querySelector('#home-reel-title-line-1');
    const reelBtn = document.querySelector('#home-reel-cta') || document.querySelector('#home-reel-video-watch-btn');
    
    // 2. Featured / Initiatives
    const feat = document.querySelector('#home-featured');
    // Let's find all cards inside feat
    const featCards = Array.from(feat.querySelectorAll('[class*="card"], [class*="project"], [class*="initiative"], [data-project], [data-id]'))
      .filter(el => {
        // filter down to main card containers
        const cls = el.className;
        return typeof cls === 'string' && (cls.includes('card') || cls.includes('project')) && !cls.includes('inner') && !cls.includes('header') && !cls.includes('body') && !cls.includes('meta') && !cls.includes('glow');
      }).map(c => ({
        tag: c.tagName,
        id: c.id,
        className: c.className,
        text: c.textContent.trim().replace(/\s+/g, ' ').substring(0, 40),
        offsetTop: c.offsetTop,
        offsetHeight: c.offsetHeight
      }));

    // If none found with that filter, let's list all elements inside feat with class
    const featElements = Array.from(feat.querySelectorAll('*')).map(el => ({
      tag: el.tagName,
      id: el.id,
      className: typeof el.className === 'string' ? el.className : ''
    })).filter(x => x.id || (x.className && !x.className.includes('svg')));

    // 3. Members
    const members = document.querySelector('#home-members');
    const memberCards = Array.from(members.querySelectorAll('.member-card')).map(c => ({
      tag: c.tagName,
      id: c.getAttribute('data-id') || c.id,
      className: c.className,
      name: c.querySelector('.member-card-name')?.textContent.trim(),
      role: c.querySelector('.member-card-role-title')?.textContent.trim(),
      offsetTop: c.offsetTop,
      offsetHeight: c.offsetHeight
    }));

    // 4. Goal
    const goal = document.querySelector('#home-goal');
    const goalTitle = document.querySelector('#home-goal-title');
    const goalTexts = document.querySelector('#home-goal-texts');

    return {
      featCards,
      featElements: featElements.slice(0, 30),
      memberCards,
      goalTitle: goalTitle ? { text: goalTitle.textContent.trim(), offsetTop: goalTitle.offsetTop } : null
    };
  });

  console.log('Inspection result:', JSON.stringify(result, null, 2));
  await browser.close();
})();
