const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  console.log('=== Verifying Mobile Flagship Poster Styling (390x844) ===');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('font-size:0;color:transparent')) {
      console.error('[Console Error]', msg.text());
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  console.log('Waiting for scrollManager...');
  await page.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 25000 });
  await sleep(1500);

  // Measure elements
  const metrics = await page.evaluate(() => {
    const featured = document.getElementById('home-featured');
    const flagship = document.querySelector('.project-item-flagship');
    const flagshipMain = flagship ? flagship.querySelector('.flagship-main') : null;
    const flagshipBadge = flagship ? flagship.querySelector('.flagship-badge') : null;
    const card2 = document.querySelector('.project-list .project-item:nth-child(2)');
    const card2Main = card2 ? card2.querySelector('.project-item-main') : null;

    const sm = window.scrollManager;
    const featuredRange = sm.getDomRange(featured);

    const getStyles = el => {
      if (!el) return null;
      const s = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        width: r.width,
        height: r.height,
        paddingTop: s.paddingTop,
        borderRadius: s.borderRadius,
        borderColor: s.borderColor,
        borderWidth: s.borderWidth,
        top: r.top,
        left: r.left
      };
    };

    return {
      featuredRange,
      flagship: getStyles(flagship),
      flagshipMain: getStyles(flagshipMain),
      flagshipBadge: getStyles(flagshipBadge),
      card2: getStyles(card2),
      card2Main: getStyles(card2Main)
    };
  });

  console.log('Computed metrics on mobile (390px):');
  console.log('Flagship Card Main:', metrics.flagshipMain);
  console.log('Card 2 Main:', metrics.card2Main);

  // 1. Scroll to Flagship Poster Card in full view
  console.log('\n--- 1. Capturing Flagship Poster Card (Centered) ---');
  await page.evaluate(px => {
    window.scrollManager.scrollToPixel(px, true);
  }, metrics.featuredRange.top + 60);

  await sleep(800);
  const shot1 = path.resolve(process.cwd(), 'mobile_flagship_poster.png');
  await page.screenshot({ path: shot1 });
  console.log('Saved:', shot1);

  // 2. Scroll slightly down to capture the contrast between Flagship (tall poster) and Card 2 (horizontal standard)
  console.log('\n--- 2. Capturing Flagship vs Card 2 Comparison ---');
  await page.evaluate(px => {
    window.scrollManager.scrollToPixel(px, true);
  }, metrics.featuredRange.top + 380);

  await sleep(800);
  const shot2 = path.resolve(process.cwd(), 'mobile_flagship_vs_regular_card.png');
  await page.screenshot({ path: shot2 });
  console.log('Saved:', shot2);

  // 3. Scroll to Card 2 Centered to show standard 65% horizontal aspect ratio
  console.log('\n--- 3. Capturing Card 2 (Standard 65% horizontal ratio) ---');
  await page.evaluate(px => {
    window.scrollManager.scrollToPixel(px, true);
  }, metrics.featuredRange.top + 680);

  await sleep(800);
  const shot3 = path.resolve(process.cwd(), 'mobile_regular_card_standard.png');
  await page.screenshot({ path: shot3 });
  console.log('Saved:', shot3);

  await browser.close();
  console.log('All mobile verification captures completed successfully!');
})();
