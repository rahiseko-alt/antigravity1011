const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const outputDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

async function waitForHeroSettled(page) {
  console.log('Waiting for intro animation and hero to settle...');
  await page.waitForFunction(() => {
    const gt = window.__goalTunnels;
    if (gt && gt.introStartTime) {
      return (performance.now() - gt.introStartTime) / 1000 >= 9.5;
    }
    const prop = window.__properties;
    return prop && prop.hasStarted && !prop.isIntroWarp;
  }, { timeout: 35000 });
  console.log('Intro completed! Page settled.');
  await new Promise(r => setTimeout(r, 1200));
}

async function capture() {
  console.log('=== Starting Screenshot Capture ===');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--window-size=1440,1080']
  });

  try {
    // --- 1. DESKTOP VIEW ---
    console.log('Capturing Desktop (1440x960)...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

    await waitForHeroSettled(page);

    // Scroll to #home-featured on Desktop
    await page.evaluate(() => {
      const feat = document.getElementById('home-featured');
      if (feat && window.scrollManager) {
        window.scrollManager.scrollToPixel(feat.offsetTop - 50, true);
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    // Full viewport shot of section with both cards side by side
    const desktopViewPath = path.join(outputDir, 'flagship_art_desktop.png');
    await page.screenshot({ path: desktopViewPath });
    console.log('Saved:', desktopViewPath);

    // Closeup of flagship card
    const cardEl = await page.$('.project-item-flagship');
    if (cardEl) {
      const desktopCardPath = path.join(outputDir, 'flagship_art_card_desktop.png');
      await cardEl.screenshot({ path: desktopCardPath });
      console.log('Saved:', desktopCardPath);
    }

    await page.close();

    // --- 2. MOBILE VIEW ---
    console.log('Capturing Mobile (390x844)...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

    await waitForHeroSettled(mobilePage);

    // On mobile, first capture section header + card 1 + card 2 approach
    await mobilePage.evaluate(() => {
      const feat = document.getElementById('home-featured');
      if (feat && window.scrollManager) {
        window.scrollManager.scrollToPixel(feat.offsetTop - 30, true);
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    const mobileSectionPath = path.join(outputDir, 'flagship_art_mobile_section.png');
    await mobilePage.screenshot({ path: mobileSectionPath });
    console.log('Saved:', mobileSectionPath);

    // Scroll so card 2 is perfectly centered in mobile viewport
    await mobilePage.evaluate(() => {
      const card = document.querySelector('.project-item-flagship');
      if (card && window.scrollManager) {
        // Place card top at ~120px in viewport
        window.scrollManager.scrollToPixel(card.offsetTop - 120, true);
      }
    });
    await new Promise(r => setTimeout(r, 1500));

    const mobileCenteredPath = path.join(outputDir, 'flagship_art_mobile.png');
    await mobilePage.screenshot({ path: mobileCenteredPath });
    console.log('Saved:', mobileCenteredPath);

    const mobileCardEl = await mobilePage.$('.project-item-flagship');
    if (mobileCardEl) {
      const mobileCardPath = path.join(outputDir, 'flagship_art_card_mobile.png');
      await mobileCardEl.screenshot({ path: mobileCardPath });
      console.log('Saved:', mobileCardPath);
    }

    await mobilePage.close();
    console.log('All screenshots captured successfully!');
  } finally {
    await browser.close();
  }
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
