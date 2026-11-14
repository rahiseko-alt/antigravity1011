const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const DESKTOP_TARGETS = [
  { s: 650, file: 'final_verify_dt_650_reel.png', label: 'Reel headline & button swooping curve' },
  { s: 1500, file: 'final_verify_dt_1500_card1.png', label: 'Initiatives Header & Flagship card' },
  { s: 2500, file: 'final_verify_dt_2500_cards2_3.png', label: 'Initiatives Cards 2 & 3' },
  { s: 3500, file: 'final_verify_dt_3500_cards4_5_6.png', label: 'Initiatives Cards 4, 5, 6' },
  { s: 4800, file: 'final_verify_dt_4800_members.png', label: 'Core Players Members' },
  { s: 5800, file: 'final_verify_dt_5800_goal.png', label: 'Goal arrival' }
];

const MOBILE_TARGETS = [
  { s: 550, file: 'final_verify_mb_550_reel.png', label: 'Reel headline & button swooping curve' },
  { s: 1800, file: 'final_verify_mb_1800_card1.png', label: 'Initiatives Card 1' },
  { s: 2800, file: 'final_verify_mb_2800_cards2_3.png', label: 'Initiatives Cards 2 & 3' },
  { s: 3800, file: 'final_verify_mb_3800_cards5_6.png', label: 'Initiatives Cards 5 & 6' },
  { s: 5000, file: 'final_verify_mb_5000_members.png', label: 'Members' },
  { s: 6200, file: 'final_verify_mb_6200_goal.png', label: 'Goal arrival' }
];

async function capture() {
  console.log('Launching browser with Chrome at:', chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const results = {
    desktop: [],
    mobile: []
  };

  try {
    // 1. DESKTOP RUN (1440x900)
    console.log('\n================ DESKTOP (1440x900) ================');
    const pageDt = await browser.newPage();
    await pageDt.setViewport({ width: 1440, height: 900 });

    console.log('Navigating to http://localhost:3000/ ...');
    await pageDt.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for window.scrollManager && window.scrollManager.isActive ...');
    await pageDt.waitForFunction(() => {
      return window.scrollManager && window.scrollManager.isActive;
    }, { timeout: 20000 });

    console.log('Executing window.__unlockNow() ...');
    await pageDt.evaluate(() => {
      if (window.__unlockNow) window.__unlockNow();
    });
    await sleep(1200);

    for (const target of DESKTOP_TARGETS) {
      console.log(`Desktop: Scrolling to s = ${target.s} (${target.label})...`);
      await pageDt.evaluate((px) => {
        window.scrollManager.scrollToPixel(px, true);
      }, target.s);
      await sleep(600);

      const filePath = path.resolve(__dirname, target.file);
      await pageDt.screenshot({ path: filePath, fullPage: false });

      const fileStats = fs.statSync(filePath);
      console.log(`Saved screenshot: ${target.file} (${fileStats.size} bytes)`);

      // Inspect elements on screen
      const info = await pageDt.evaluate(() => {
        return {
          scrollY: window.scrollManager ? window.scrollManager.scrollY : null,
          targetY: window.scrollManager ? window.scrollManager.targetY : null,
          bodyScrollY: window.scrollY
        };
      });

      results.desktop.push({
        ...target,
        size: fileStats.size,
        exists: true,
        info
      });
    }

    await pageDt.close();

    // 2. MOBILE RUN (390x844)
    console.log('\n================ MOBILE (390x844) ================');
    const pageMb = await browser.newPage();
    await pageMb.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    console.log('Navigating to http://localhost:3000/ (Mobile)...');
    await pageMb.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for window.scrollManager && window.scrollManager.isActive (Mobile)...');
    await pageMb.waitForFunction(() => {
      return window.scrollManager && window.scrollManager.isActive;
    }, { timeout: 20000 });

    console.log('Executing window.__unlockNow() (Mobile)...');
    await pageMb.evaluate(() => {
      if (window.__unlockNow) window.__unlockNow();
    });
    await sleep(1200);

    for (const target of MOBILE_TARGETS) {
      console.log(`Mobile: Scrolling to s = ${target.s} (${target.label})...`);
      await pageMb.evaluate((px) => {
        window.scrollManager.scrollToPixel(px, true);
      }, target.s);
      await sleep(600);

      const filePath = path.resolve(__dirname, target.file);
      await pageMb.screenshot({ path: filePath, fullPage: false });

      const fileStats = fs.statSync(filePath);
      console.log(`Saved screenshot: ${target.file} (${fileStats.size} bytes)`);

      const info = await pageMb.evaluate(() => {
        return {
          scrollY: window.scrollManager ? window.scrollManager.scrollY : null,
          targetY: window.scrollManager ? window.scrollManager.targetY : null,
          bodyScrollY: window.scrollY
        };
      });

      results.mobile.push({
        ...target,
        size: fileStats.size,
        exists: true,
        info
      });
    }

    await pageMb.close();

  } finally {
    await browser.close();
  }

  console.log('\n================ SUMMARY ================');
  console.log('Desktop screenshots:');
  for (const r of results.desktop) {
    console.log(` - ${r.file}: ${r.size} bytes (s=${r.s}, ${r.label})`);
  }
  console.log('Mobile screenshots:');
  for (const r of results.mobile) {
    console.log(` - ${r.file}: ${r.size} bytes (s=${r.s}, ${r.label})`);
  }
  console.log('All captures completed successfully.');
}

capture().catch(err => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
