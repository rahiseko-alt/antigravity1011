const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  // 1. Desktop Verification
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
  await desktopPage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for scene to start
  for (let i = 0; i < 40; i++) {
    const isStarted = await desktopPage.evaluate(() => window.__properties && window.__properties.hasStarted).catch(() => false);
    if (isStarted) break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1500));

  // Scroll to #home-featured
  await desktopPage.evaluate(() => {
    const el = document.getElementById('home-featured');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1200));

  // Capture Card 1 (Flagship) and section header
  await desktopPage.screenshot({ path: 'verify_desktop_standardized_flagship.png' });
  console.log('Saved verify_desktop_standardized_flagship.png');

  // Scroll down slightly to capture Cards 2 & 3
  await desktopPage.evaluate(() => {
    window.scrollBy({ top: 600, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1200));
  await desktopPage.screenshot({ path: 'verify_desktop_standardized_cards_2_3.png' });
  console.log('Saved verify_desktop_standardized_cards_2_3.png');

  // Scroll down to capture Cards 4, 5, 6
  await desktopPage.evaluate(() => {
    window.scrollBy({ top: 750, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1200));
  await desktopPage.screenshot({ path: 'verify_desktop_standardized_cards_4_5_6.png' });
  console.log('Saved verify_desktop_standardized_cards_4_5_6.png');

  // 2. Mobile Verification (iPhone 14 / 390x844)
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });

  for (let i = 0; i < 40; i++) {
    const isStarted = await mobilePage.evaluate(() => window.__properties && window.__properties.hasStarted).catch(() => false);
    if (isStarted) break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1500));

  // Scroll to #home-featured
  await mobilePage.evaluate(() => {
    const el = document.getElementById('home-featured');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 1200));

  await mobilePage.screenshot({ path: 'verify_mobile_standardized_card1.png' });
  console.log('Saved verify_mobile_standardized_card1.png');

  // Scroll down to Card 2
  await mobilePage.evaluate(() => {
    window.scrollBy({ top: 650, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1200));
  await mobilePage.screenshot({ path: 'verify_mobile_standardized_card2.png' });
  console.log('Saved verify_mobile_standardized_card2.png');

  // Scroll down to Cards 3 & 4
  await mobilePage.evaluate(() => {
    window.scrollBy({ top: 650, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1200));
  await mobilePage.screenshot({ path: 'verify_mobile_standardized_card3_4.png' });
  console.log('Saved verify_mobile_standardized_card3_4.png');

  // Scroll down to Cards 5 & 6
  await mobilePage.evaluate(() => {
    window.scrollBy({ top: 750, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1200));
  await mobilePage.screenshot({ path: 'verify_mobile_standardized_card5_6.png' });
  console.log('Saved verify_mobile_standardized_card5_6.png');

  await browser.close();
  console.log('All verification captures completed successfully!');
})();
