const puppeteer = require('puppeteer-core');
const fs = require('fs');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

function getExecutablePath() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No browser executable found!');
}

async function verifyChips() {
  const execPath = getExecutablePath();
  console.log('Using browser:', execPath);

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  // ==========================================
  // 1. DESKTOP VERIFICATION (1920x1080)
  // ==========================================
  console.log('\n--- 1. DESKTOP CAPTURE (1920x1080) ---');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  await desktopPage.waitForFunction(() => {
    return window.scrollManager && window.scrollManager.isActive;
  }, { timeout: 25000 });

  await sleep(2000);

  // Desktop metrics
  const dMetrics = await desktopPage.evaluate(() => {
    const sm = window.scrollManager;
    const flagship = document.querySelector('.project-item-flagship');
    const card2 = document.querySelector('.project-item:nth-child(2)');
    const card4 = document.querySelector('.project-item:nth-child(4)');

    return {
      flagshipTop: sm.getDomRange(flagship).top,
      flagshipHeight: sm.getDomRange(flagship).height,
      card2Top: sm.getDomRange(card2).top,
      card4Top: sm.getDomRange(card4).top,
    };
  });

  console.log('Desktop scroll metrics:', dMetrics);

  // Desktop shot 1: Flagship Card 1 fully framed with chips clearly visible
  // Scroll to roughly halfway through Card 1 so footer and image are in comfortable view
  await desktopPage.evaluate(px => window.scrollManager.scrollToPixel(px, true), dMetrics.flagshipTop + 240);
  await sleep(1200);
  await desktopPage.screenshot({ path: 'verify_desktop_chips_card1_flagship.png' });
  console.log('Saved verify_desktop_chips_card1_flagship.png');

  // Desktop shot 2: Cards 2 & 3
  await desktopPage.evaluate(px => window.scrollManager.scrollToPixel(px, true), dMetrics.card2Top);
  await sleep(1200);
  await desktopPage.screenshot({ path: 'verify_desktop_chips_cards_2_3.png' });
  console.log('Saved verify_desktop_chips_cards_2_3.png');

  // Desktop shot 3: Cards 4, 5, 6
  await desktopPage.evaluate(px => window.scrollManager.scrollToPixel(px, true), dMetrics.card4Top);
  await sleep(1200);
  await desktopPage.screenshot({ path: 'verify_desktop_chips_cards_4_5_6.png' });
  console.log('Saved verify_desktop_chips_cards_4_5_6.png');

  await desktopPage.close();

  // ==========================================
  // 2. MOBILE VERIFICATION (390x844)
  // ==========================================
  console.log('\n--- 2. MOBILE CAPTURE (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  await mobilePage.waitForFunction(() => {
    return window.scrollManager && window.scrollManager.isActive;
  }, { timeout: 25000 });

  await sleep(2000);

  const mMetrics = await mobilePage.evaluate(() => {
    const sm = window.scrollManager;
    const flagship = document.querySelector('.project-item-flagship');
    const card2 = document.querySelector('.project-item:nth-child(2)');
    const card3 = document.querySelector('.project-item:nth-child(3)');
    const card5 = document.querySelector('.project-item:nth-child(5)');

    return {
      flagshipTop: sm.getDomRange(flagship).top,
      card2Top: sm.getDomRange(card2).top,
      card3Top: sm.getDomRange(card3).top,
      card5Top: sm.getDomRange(card5).top,
    };
  });

  console.log('Mobile scroll metrics:', mMetrics);

  // Mobile shot 1: Flagship Card 1 with footer chips centered
  await mobilePage.evaluate(px => window.scrollManager.scrollToPixel(px, true), mMetrics.flagshipTop + 140);
  await sleep(1200);
  await mobilePage.screenshot({ path: 'verify_mobile_chips_card1.png' });
  console.log('Saved verify_mobile_chips_card1.png');

  // Mobile shot 2: Card 2
  await mobilePage.evaluate(px => window.scrollManager.scrollToPixel(px, true), mMetrics.card2Top);
  await sleep(1200);
  await mobilePage.screenshot({ path: 'verify_mobile_chips_card2.png' });
  console.log('Saved verify_mobile_chips_card2.png');

  // Mobile shot 3: Cards 3 & 4
  await mobilePage.evaluate(px => window.scrollManager.scrollToPixel(px, true), mMetrics.card3Top);
  await sleep(1200);
  await mobilePage.screenshot({ path: 'verify_mobile_chips_cards_3_4.png' });
  console.log('Saved verify_mobile_chips_cards_3_4.png');

  // Mobile shot 4: Cards 5 & 6
  await mobilePage.evaluate(px => window.scrollManager.scrollToPixel(px, true), mMetrics.card5Top);
  await sleep(1200);
  await mobilePage.screenshot({ path: 'verify_mobile_chips_cards_5_6.png' });
  console.log('Saved verify_mobile_chips_cards_5_6.png');

  await mobilePage.close();
  await browser.close();
  console.log('\nAll captures completed successfully!');
}

verifyChips().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
