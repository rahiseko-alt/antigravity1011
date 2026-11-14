import puppeteer from 'puppeteer-core';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for hero
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: 'verify_header_white_top.png' });

  // Scroll to featured initiatives
  await page.evaluate(() => window.scrollManager.scrollToPixel(1500, false));
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'verify_header_white_mid.png' });

  // Mobile check
  const mobPage = await browser.newPage();
  await mobPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4500));
  await mobPage.evaluate(() => window.scrollManager.scrollToPixel(1200, false));
  await new Promise(r => setTimeout(r, 1200));
  await mobPage.screenshot({ path: 'verify_header_white_mob_mid.png' });

  await browser.close();
  console.log("Screenshots captured successfully");
})();
