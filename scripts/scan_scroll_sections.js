import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 7000));

  const testScrolls = [2400, 2700, 3000, 3300, 3600, 3900, 4200];
  for (const sp of testScrolls) {
    await page.evaluate(y => {
      window.scrollManager.scrollPixel = y;
      window.scrollManager.targetScrollPixel = y;
      window.scrollManager.syncDom();
    }, sp);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, `scan_desktop_s${sp}.png`) });
    console.log(`Saved scan_desktop_s${sp}.png`);
  }

  // Also do mobile
  const mobPage = await browser.newPage();
  await mobPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 7000));

  const mobScrolls = [1800, 2200, 2600, 3000, 4200, 4800, 5400];
  for (const sp of mobScrolls) {
    await mobPage.evaluate(y => {
      window.scrollManager.scrollPixel = y;
      window.scrollManager.targetScrollPixel = y;
      window.scrollManager.syncDom();
    }, sp);
    await new Promise(r => setTimeout(r, 600));
    await mobPage.screenshot({ path: path.join(ARTIFACTS_DIR, `scan_mob_s${sp}.png`) });
    console.log(`Saved scan_mob_s${sp}.png`);
  }

  await browser.close();
  console.log("Scan complete");
})();
