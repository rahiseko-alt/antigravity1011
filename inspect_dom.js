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

  const details = await page.evaluate(() => {
    const res = {};
    
    // Featured section cards
    const featured = document.getElementById('home-featured');
    if (featured) {
      // Find all project items or cards
      const items = featured.querySelectorAll('.featured-list-item, .project-item, .initiative-card, li, .project-card');
      res.featured = Array.from(items).map((el, i) => {
        const rect = el.getBoundingClientRect();
        return {
          i,
          tag: el.tagName,
          cls: el.className,
          text: (el.innerText || '').slice(0, 50).replace(/\n/g, ' '),
          top: rect.top + window.scrollY,
          bottom: rect.bottom + window.scrollY,
          height: rect.height
        };
      });
      // CTA button
      const btn = featured.querySelector('.pill-cta-btn');
      if (btn) {
        const rect = btn.getBoundingClientRect();
        res.ctaBtn = {
          text: btn.innerText,
          top: rect.top + window.scrollY,
          bottom: rect.bottom + window.scrollY
        };
      }
    }

    // Members section
    const members = document.getElementById('home-members');
    if (members) {
      const mCards = members.querySelectorAll('.member-card, .team-item, [class*="member"], [class*="card"]');
      res.memberCards = Array.from(mCards).filter(el => el.className.includes('member-card') || el.className.includes('card')).map((el, i) => {
        const rect = el.getBoundingClientRect();
        return {
          i,
          cls: el.className,
          text: (el.innerText || '').slice(0, 50).replace(/\n/g, ' '),
          top: rect.top + window.scrollY,
          bottom: rect.bottom + window.scrollY,
          height: rect.height
        };
      });
    }

    return res;
  });

  console.log('DOM Details:', JSON.stringify(details, null, 2));
  await browser.close();
})();
