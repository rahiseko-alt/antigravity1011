const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. DESKTOP 1440 x 900
  console.log('Generating Desktop screenshots...');
  const pageDesktop = await browser.newPage();
  await pageDesktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await pageDesktop.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await pageDesktop.waitForFunction(() => window.scrollManager && window.homePage, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 6500)); // wait for intro to settle

  // Position 1: Flagship panoramic card
  await pageDesktop.evaluate(() => {
    window.scrollManager.scrollPixel = 1750;
    window.scrollTo(0, 1750);
  });
  await new Promise(r => setTimeout(r, 1000));
  await pageDesktop.screenshot({ path: 'verify_desktop_standardized_card1.png' });
  console.log('Saved verify_desktop_standardized_card1.png');

  // Position 2: Cards 2 & 3
  await pageDesktop.evaluate(() => {
    window.scrollManager.scrollPixel = 2300;
    window.scrollTo(0, 2300);
  });
  await new Promise(r => setTimeout(r, 1000));
  await pageDesktop.screenshot({ path: 'verify_desktop_standardized_cards_2_3.png' });
  console.log('Saved verify_desktop_standardized_cards_2_3.png');

  // Position 3: Cards 4, 5, 6
  await pageDesktop.evaluate(() => {
    window.scrollManager.scrollPixel = 2850;
    window.scrollTo(0, 2850);
  });
  await new Promise(r => setTimeout(r, 1000));
  await pageDesktop.screenshot({ path: 'verify_desktop_standardized_cards_4_5_6.png' });
  console.log('Saved verify_desktop_standardized_cards_4_5_6.png');

  await pageDesktop.close();

  // 2. MOBILE 390 x 844
  console.log('\nGenerating Mobile screenshots...');
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await pageMobile.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await pageMobile.waitForFunction(() => window.scrollManager && window.homePage, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 6500)); // wait for intro to settle

  // Position 1: Card 1 (Flagship)
  await pageMobile.evaluate(() => {
    window.scrollManager.scrollPixel = 1750;
    window.scrollTo(0, 1750);
  });
  await new Promise(r => setTimeout(r, 1000));
  await pageMobile.screenshot({ path: 'verify_mobile_standardized_card1.png' });
  console.log('Saved verify_mobile_standardized_card1.png');

  // Position 2: Card 2 (AI Tips)
  await pageMobile.evaluate(() => {
    window.scrollManager.scrollPixel = 2350;
    window.scrollTo(0, 2350);
  });
  await new Promise(r => setTimeout(r, 1000));
  await pageMobile.screenshot({ path: 'verify_mobile_standardized_card2.png' });
  console.log('Saved verify_mobile_standardized_card2.png');

  // Position 3: Cards 3 & 4
  await pageMobile.evaluate(() => {
    window.scrollManager.scrollPixel = 2950;
    window.scrollTo(0, 2950);
  });
  await new Promise(r => setTimeout(r, 1000));
  await pageMobile.screenshot({ path: 'verify_mobile_standardized_card3_4.png' });
  console.log('Saved verify_mobile_standardized_card3_4.png');

  // Position 4: Cards 5 & 6
  await pageMobile.evaluate(() => {
    window.scrollManager.scrollPixel = 3550;
    window.scrollTo(0, 3550);
  });
  await new Promise(r => setTimeout(r, 1000));
  await pageMobile.screenshot({ path: 'verify_mobile_standardized_card5_6.png' });
  console.log('Saved verify_mobile_standardized_card5_6.png');

  await browser.close();
  console.log('All screenshots captured successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
