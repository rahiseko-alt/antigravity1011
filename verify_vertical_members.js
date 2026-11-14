const puppeteer = require('puppeteer-core');
const fs = require('fs');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runVerification(viewport, prefix) {
  console.log(`\n========================================`);
  console.log(`Testing vertical scroll: ${viewport.width}x${viewport.height} (${prefix})`);
  console.log(`========================================`);

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--no-sandbox',
      `--window-size=${viewport.width},${viewport.height}`
    ]
  });

  const page = await browser.newPage();
  await page.setViewport(viewport);

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  await page.waitForFunction(() => {
    return window.scrollManager && window.scrollManager.isActive;
  }, { timeout: 20000 });

  await sleep(1500);

  const checkElements = await page.evaluate(() => {
    const members = document.getElementById('home-members');
    const pin = document.getElementById('home-members-pin');
    const track = document.getElementById('home-members-track');
    const grid = document.querySelector('.members-grid');
    const cards = Array.from(document.querySelectorAll('.member-card')).map(c => {
      const name = c.querySelector('.member-card-name')?.textContent;
      const role = c.querySelector('.member-card-role-title')?.textContent;
      const id = c.getAttribute('data-id');
      return { id, name, role };
    });
    const featured = document.getElementById('home-featured');
    const goal = document.getElementById('home-goal');

    const sm = window.scrollManager;
    const membersRange = sm.getDomRange(members);
    const featuredRange = sm.getDomRange(featured);
    const goalRange = sm.getDomRange(goal);

    return {
      pinExists: !!pin,
      trackExists: !!track,
      membersClientHeight: members ? members.clientHeight : 0,
      cardsCount: cards.length,
      cards,
      featuredRangeTop: featuredRange.top,
      featuredRangeHeight: featuredRange.height,
      membersRangeTop: membersRange.top,
      membersRangeHeight: membersRange.height,
      goalRangeTop: goalRange.top,
      goalRangeHeight: goalRange.height
    };
  });

  console.log('Structure checks:', JSON.stringify(checkElements, null, 2));

  // Step 1: Scroll to home-featured
  console.log('\n--- Scrolling to #home-featured ---');
  await page.evaluate(px => {
    window.scrollManager.scrollToPixel(px, true);
  }, checkElements.featuredRangeTop + 100);
  await sleep(800);
  await page.screenshot({ path: `verify_${prefix}_1_featured.png`, fullPage: false });
  console.log(`Captured verify_${prefix}_1_featured.png`);

  // Step 2: Scroll into #home-members (top of section)
  console.log('\n--- Scrolling to #home-members top ---');
  await page.evaluate(px => {
    window.scrollManager.scrollToPixel(px, true);
  }, checkElements.membersRangeTop);
  await sleep(800);
  await page.screenshot({ path: `verify_${prefix}_2_members_top.png`, fullPage: false });
  console.log(`Captured verify_${prefix}_2_members_top.png`);

  // Step 3: Scroll further down #home-members (cards mid)
  console.log('\n--- Scrolling inside #home-members (mid cards) ---');
  await page.evaluate(px => {
    window.scrollManager.scrollToPixel(px, true);
  }, checkElements.membersRangeTop + (checkElements.membersRangeHeight * 0.45));
  await sleep(800);
  await page.screenshot({ path: `verify_${prefix}_3_members_mid.png`, fullPage: false });
  console.log(`Captured verify_${prefix}_3_members_mid.png`);

  // Step 4: Scroll down into #home-goal
  console.log('\n--- Scrolling to #home-goal ---');
  await page.evaluate(px => {
    window.scrollManager.scrollToPixel(px, true);
  }, checkElements.goalRangeTop + 50);
  await sleep(800);
  await page.screenshot({ path: `verify_${prefix}_4_goal.png`, fullPage: false });
  console.log(`Captured verify_${prefix}_4_goal.png`);

  await browser.close();
  console.log(`Done verification for ${prefix}. Errors: ${errors.length}`);
}

(async () => {
  try {
    await runVerification({ width: 1920, height: 1080, deviceScaleFactor: 1 }, 'desktop');
    await runVerification({ width: 390, height: 844, deviceScaleFactor: 1 }, 'mobile');
    console.log('\nAll tests completed successfully!');
  } catch (err) {
    console.error('Error running verification:', err);
    process.exit(1);
  }
})();
