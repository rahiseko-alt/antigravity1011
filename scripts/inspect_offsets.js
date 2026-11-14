const puppeteer = require('puppeteer-core');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function measureViewport(width, height, isMobile) {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: isMobile ? 2 : 1,
      isMobile,
      hasTouch: isMobile
    });

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    // Wait for hero to settle
    await page.waitForFunction(() => {
      const gt = window.__goalTunnels;
      return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 8.5;
    }, { timeout: 35000 });

    // Measure exact DOM offsets
    const measurements = await page.evaluate(() => {
      function getOffsetRect(el) {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const scrollX = window.scrollX || window.pageXOffset || 0;
        return {
          top: rect.top + scrollY,
          bottom: rect.bottom + scrollY,
          left: rect.left + scrollX,
          right: rect.right + scrollX,
          width: rect.width,
          height: rect.height,
          clientTop: el.clientTop,
          clientHeight: el.clientHeight,
          scrollHeight: el.scrollHeight
        };
      }

      const hero = document.querySelector('#home-hero');
      const reel = document.querySelector('#home-reel');
      const reelTitle = document.querySelector('#home-reel-title');
      const reelContent = document.querySelector('#home-reel-content');
      const reelCta = document.querySelector('#home-reel-cta'); // HOW IT WORKS button
      const featured = document.querySelector('#home-featured');
      const featuredTitle = document.querySelector('#home-featured-title');
      const cards = Array.from(document.querySelectorAll('#home-featured .project-item')).map((el, i) => ({
        index: i + 1,
        id: el.getAttribute('data-id') || ('card-' + (i + 1)),
        title: el.querySelector('.project-item-line-2-inner')?.innerText?.trim() || '',
        rect: getOffsetRect(el)
      }));
      const members = document.querySelector('#home-members');
      const memberCards = Array.from(document.querySelectorAll('#home-members .member-card')).map((el, i) => ({
        index: i + 1,
        id: el.getAttribute('data-id') || ('member-' + (i + 1)),
        name: el.querySelector('.member-card-name')?.innerText?.trim() || '',
        rect: getOffsetRect(el)
      }));
      const goal = document.querySelector('#home-goal');

      const docScrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.offsetHeight,
        document.body.offsetHeight
      );

      const maxScroll = window.scrollManager ? window.scrollManager.maxScroll : docScrollHeight - window.innerHeight;

      return {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio
        },
        hero: {
          rect: getOffsetRect(hero),
          height: hero?.offsetHeight,
          bottom: hero ? getOffsetRect(hero).bottom : null
        },
        reel: {
          rect: getOffsetRect(reel),
          top: reel ? getOffsetRect(reel).top : null,
          bottom: reel ? getOffsetRect(reel).bottom : null,
          titleRect: getOffsetRect(reelTitle),
          contentRect: getOffsetRect(reelContent),
          ctaRect: getOffsetRect(reelCta)
        },
        featured: {
          rect: getOffsetRect(featured),
          top: featured ? getOffsetRect(featured).top : null,
          bottom: featured ? getOffsetRect(featured).bottom : null,
          titleRect: getOffsetRect(featuredTitle),
          cards
        },
        members: {
          rect: getOffsetRect(members),
          top: members ? getOffsetRect(members).top : null,
          bottom: members ? getOffsetRect(members).bottom : null,
          cards: memberCards
        },
        goal: {
          rect: getOffsetRect(goal),
          top: goal ? getOffsetRect(goal).top : null,
          bottom: goal ? getOffsetRect(goal).bottom : null
        },
        docScrollHeight,
        maxScroll
      };
    });

    return measurements;
  } finally {
    await browser.close();
  }
}

(async () => {
  console.log('Measuring Mobile (390x844)...');
  const mobile = await measureViewport(390, 844, true);

  console.log('Measuring Desktop (1920x1080)...');
  const desktop = await measureViewport(1920, 1080, false);

  console.log('\n=== MOBILE (390x844) RESULTS ===');
  console.log(JSON.stringify(mobile, null, 2));

  console.log('\n=== DESKTOP (1920x1080) RESULTS ===');
  console.log(JSON.stringify(desktop, null, 2));
})();
