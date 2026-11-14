const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. DESKTOP 1440 x 900
  console.log('Generating Desktop 1440px screenshots...');
  const pageDesktop = await browser.newPage();
  await pageDesktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await pageDesktop.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await pageDesktop.waitForFunction(() => window.scrollManager && window.homePage, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 6500)); // wait for intro to settle

  // Position A: Section title + full wide flagship banner
  await pageDesktop.evaluate(() => {
    window.scrollManager.scrollPixel = 1580;
    window.scrollTo(0, 1580);
  });
  await new Promise(r => setTimeout(r, 800));
  const pathDesktopHeader = path.join(ARTIFACT_DIR, 'featured_flagship_pc_overview.png');
  await pageDesktop.screenshot({ path: pathDesktopHeader });
  console.log('Saved:', pathDesktopHeader);

  // Position B: Primary flagship wide card + row 2 entry
  await pageDesktop.evaluate(() => {
    window.scrollManager.scrollPixel = 1700;
    window.scrollTo(0, 1700);
  });
  await new Promise(r => setTimeout(r, 800));
  const pathDesktopMain = path.join(ARTIFACT_DIR, 'featured_flagship_desktop_1440.png');
  await pageDesktop.screenshot({ path: pathDesktopMain });
  console.log('Saved:', pathDesktopMain);

  await pageDesktop.close();

  // 2. MOBILE 390 x 844
  console.log('\nGenerating Mobile 390px screenshots...');
  const pageMobile = await browser.newPage();
  await pageMobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await pageMobile.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await pageMobile.waitForFunction(() => window.scrollManager && window.homePage, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 6500)); // wait for intro to settle

  // Position: Card 1 (flagship) + Card 2 (oryzo_ai)
  await pageMobile.evaluate(() => {
    window.scrollManager.scrollPixel = 1750;
    window.scrollTo(0, 1750);
  });
  await new Promise(r => setTimeout(r, 800));
  const pathMobileMain = path.join(ARTIFACT_DIR, 'featured_flagship_mobile_390.png');
  await pageMobile.screenshot({ path: pathMobileMain });
  console.log('Saved:', pathMobileMain);

  await pageMobile.close();
  await browser.close();

  console.log('\nAll official artifacts saved successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
