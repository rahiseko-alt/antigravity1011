const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  // --- 1. DESKTOP (1440 x 900) ---
  console.log('Capturing Desktop 1440px...');
  const pageDesktop = await browser.newPage();
  await pageDesktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await pageDesktop.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  await pageDesktop.waitForFunction(() => window.scrollManager && window.homePage, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 6500)); // wait for intro tunnel & landing to fully settle

  // Check offsetTop of #home-featured
  const desktopOffset = await pageDesktop.evaluate(() => {
    const el = document.getElementById('home-featured');
    return el ? { offsetTop: el.offsetTop, offsetHeight: el.offsetHeight } : null;
  });
  console.log('Desktop #home-featured bounds:', desktopOffset);

  // Scroll to featured section cards
  const desktopScrollY = 2200;
  await pageDesktop.evaluate((y) => {
    window.scrollManager.scrollPixel = y;
    window.scrollTo(0, y);
  }, desktopScrollY);
  await new Promise(r => setTimeout(r, 1200));

  const desktopViewPath = path.join(ARTIFACT_DIR, 'featured_flagship_pc_1440.png');
  await pageDesktop.screenshot({ path: desktopViewPath });
  console.log('Saved:', desktopViewPath);

  // Also capture with full flagship card and cards 2-3 row below
  const desktopScrollY2 = 2450;
  await pageDesktop.evaluate((y) => {
    window.scrollManager.scrollPixel = y;
    window.scrollTo(0, y);
  }, desktopScrollY2);
  await new Promise(r => setTimeout(r, 1200));

  const desktopViewPath2 = path.join(ARTIFACT_DIR, 'featured_flagship_pc_1440_scroll.png');
  await pageDesktop.screenshot({ path: desktopViewPath2 });
  console.log('Saved:', desktopViewPath2);

  await pageDesktop.close();

  // --- 2. MOBILE (390 x 844) ---
  console.log('\nCapturing Mobile 390px...');
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await pageMobile.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  await pageMobile.waitForFunction(() => window.scrollManager && window.homePage, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 6500)); // wait for intro to settle

  const mobileScrollY = 2050;
  await pageMobile.evaluate((y) => {
    window.scrollManager.scrollPixel = y;
    window.scrollTo(0, y);
  }, mobileScrollY);
  await new Promise(r => setTimeout(r, 1200));

  const mobileViewPath = path.join(ARTIFACT_DIR, 'featured_flagship_mobile_390.png');
  await pageMobile.screenshot({ path: mobileViewPath });
  console.log('Saved:', mobileViewPath);

  const mobileScrollY2 = 2500;
  await pageMobile.evaluate((y) => {
    window.scrollManager.scrollPixel = y;
    window.scrollTo(0, y);
  }, mobileScrollY2);
  await new Promise(r => setTimeout(r, 1200));

  const mobileViewPath2 = path.join(ARTIFACT_DIR, 'featured_flagship_mobile_390_card2.png');
  await pageMobile.screenshot({ path: mobileViewPath2 });
  console.log('Saved:', mobileViewPath2);

  await pageMobile.close();
  await browser.close();

  console.log('\nAll captures successfully finished!');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
