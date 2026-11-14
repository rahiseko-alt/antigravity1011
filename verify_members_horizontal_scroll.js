const puppeteer = require('puppeteer-core');
const fs = require('fs');

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log('Launching browser for horizontal scroll verification...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--no-sandbox',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for intro and scrollManager to be ready...');
  await page.waitForFunction(() => {
    return window.scrollManager && window.scrollManager.isActive;
  }, { timeout: 20000 });

  await sleep(1500);

  // Inspect layout info
  const layout = await page.evaluate(() => {
    const featured = document.getElementById('home-featured');
    const members = document.getElementById('home-members');
    const goal = document.getElementById('home-goal');
    const pin = document.getElementById('home-members-pin');
    const track = document.getElementById('home-members-track');
    const bar = document.getElementById('home-members-progress-bar');
    const cards = document.querySelectorAll('.member-card');

    const sm = window.scrollManager;
    const featuredRange = sm.getDomRange(featured);
    const membersRange = sm.getDomRange(members);
    const goalRange = sm.getDomRange(goal);

    return {
      windowHeight: window.innerHeight,
      featuredRange: { top: featuredRange.top, height: featuredRange.height },
      membersRange: { top: membersRange.top, height: membersRange.height },
      goalRange: { top: goalRange.top, height: goalRange.height },
      cardsCount: cards.length,
      trackScrollWidth: track ? track.scrollWidth : 0,
      trackOffsetWidth: track ? track.offsetWidth : 0
    };
  });

  console.log('Layout Info:', JSON.stringify(layout, null, 2));

  const vh = layout.windowHeight;
  const membersTop = layout.membersRange.top;
  const membersHeight = layout.membersRange.height;
  const scrollable = membersHeight - vh;

  console.log(`membersTop: ${membersTop}, scrollable: ${scrollable}`);

  // Test Points
  const points = [
    { name: '01_entry', px: membersTop, desc: 'Entry to #home-members (progress = 0%)' },
    { name: '02_33pct', px: membersTop + scrollable * 0.33, desc: 'Mid 33% (cards sliding right)' },
    { name: '02_mid', px: membersTop + scrollable * 0.50, desc: 'Mid 50% (halfway)' },
    { name: '02_66pct', px: membersTop + scrollable * 0.66, desc: 'Mid 66%' },
    { name: '03_end', px: membersTop + scrollable * 0.98, desc: 'End of #home-members (cards fully scrolled)' },
    { name: '04_goal', px: membersTop + scrollable + 600, desc: 'Scrolled into #home-goal' }
  ];

  for (const pt of points) {
    console.log(`\nScrolling to ${pt.desc} at ${Math.round(pt.px)}px...`);
    await page.evaluate(val => {
      window.scrollManager.scrollToPixel(val, true);
    }, pt.px);

    await sleep(800);

    const state = await page.evaluate(() => {
      const container = document.getElementById('home-members');
      const pin = document.getElementById('home-members-pin');
      const track = document.getElementById('home-members-track');
      const bar = document.getElementById('home-members-progress-bar');
      const cards = Array.from(document.querySelectorAll('.member-card')).map(c => {
        const r = c.getBoundingClientRect();
        return {
          id: c.getAttribute('data-id'),
          left: Math.round(r.left),
          right: Math.round(r.right),
          top: Math.round(r.top)
        };
      });
      const range = window.scrollManager.getDomRange(container);

      return {
        screenY: Math.round(range.screenY),
        isActive: range.isActive,
        pinTransform: pin.style.transform,
        trackTransform: track.style.transform,
        barTransform: bar.style.transform,
        isBlackBg: document.documentElement.classList.contains('is-black-bg'),
        cards
      };
    });

    console.log(`State at ${pt.name}:`, JSON.stringify(state, null, 2));

    let filename = '';
    if (pt.name === '01_entry') filename = 'members_scroll_01_entry.png';
    else if (pt.name === '02_mid') filename = 'members_scroll_02_mid.png';
    else if (pt.name === '03_end') filename = 'members_scroll_03_end.png';
    else if (pt.name === '04_goal') filename = 'members_scroll_04_goal.png';

    if (filename) {
      console.log(`Capturing screenshot ${filename}...`);
      await page.screenshot({ path: filename, fullPage: false });
    }
  }

  await browser.close();
  console.log('\nVerification completed successfully!');
})();
