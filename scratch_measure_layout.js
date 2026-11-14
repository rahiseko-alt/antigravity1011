const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  async function measure(viewport, label) {
    const page = await browser.newPage();
    await page.setViewport(viewport);
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 6000)); // wait for preloader

    const data = await page.evaluate(() => {
      const getRect = el => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          top: r.top + window.scrollY,
          bottom: r.bottom + window.scrollY,
          left: r.left,
          right: r.right,
          width: r.width,
          height: r.height
        };
      };

      const reel = document.getElementById('home-reel');
      const cards = Array.from(document.querySelectorAll('.project-item, [class*="project-item"]'));
      const featuredCta = document.getElementById('home-featured-cta');
      const members = document.getElementById('home-members');
      const memberCards = Array.from(document.querySelectorAll('.member-card'));
      const goal = document.getElementById('home-goal');

      return {
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        scrollHeight: document.documentElement.scrollHeight,
        reel: getRect(reel),
        cards: cards.map((c, i) => ({ idx: i + 1, text: c.innerText.slice(0, 30).replace(/\n/g, ' '), rect: getRect(c) })),
        featuredCta: getRect(featuredCta),
        members: getRect(members),
        memberCards: memberCards.map((m, i) => ({ idx: i + 1, rect: getRect(m) })),
        goal: getRect(goal)
      };
    });

    console.log(`=== Layout for ${label} (${viewport.width}x${viewport.height}) ===`);
    console.log(`ScrollHeight: ${data.scrollHeight}`);
    console.log('Reel:', data.reel ? `top: ${data.reel.top.toFixed(0)}, bottom: ${data.reel.bottom.toFixed(0)}` : 'null');
    console.log('Cards count:', data.cards.length);
    data.cards.forEach(c => {
      console.log(`Card ${c.idx} [${c.text}]: top: ${c.rect.top.toFixed(0)}, bottom: ${c.rect.bottom.toFixed(0)}, left: ${c.rect.left.toFixed(0)}, width: ${c.rect.width.toFixed(0)}`);
    });
    console.log('Featured CTA (#home-featured-cta):', data.featuredCta ? `top: ${data.featuredCta.top.toFixed(0)}, bottom: ${data.featuredCta.bottom.toFixed(0)}, left: ${data.featuredCta.left.toFixed(0)}, width: ${data.featuredCta.width.toFixed(0)}` : 'null');
    console.log('Members (#home-members):', data.members ? `top: ${data.members.top.toFixed(0)}, bottom: ${data.members.bottom.toFixed(0)}` : 'null');
    data.memberCards.forEach(m => {
      console.log(`MemberCard ${m.idx}: top: ${m.rect.top.toFixed(0)}, bottom: ${m.rect.bottom.toFixed(0)}, left: ${m.rect.left.toFixed(0)}, width: ${m.rect.width.toFixed(0)}`);
    });
    console.log('Goal:', data.goal ? `top: ${data.goal.top.toFixed(0)}, bottom: ${data.goal.bottom.toFixed(0)}` : 'null');

    await page.close();
  }

  await measure({ width: 1920, height: 1080 }, 'Desktop');
  await measure({ width: 390, height: 844, isMobile: true, hasTouch: true }, 'Mobile');

  await browser.close();
})();
