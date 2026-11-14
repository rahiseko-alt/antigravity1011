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

  const mobPage = await browser.newPage();
  await mobPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 10000));

  for (const sp of [4200, 4400, 4550, 4700]) {
    await mobPage.evaluate(y => {
      window.scrollManager.scrollToPixel(y, true);
    }, sp);
    await new Promise(r => setTimeout(r, 800));
    await mobPage.screenshot({ path: path.join(ARTIFACTS_DIR, `mob_test_sp_${sp}.png`) });
    console.log(`Saved mob_test_sp_${sp}.png`);
  }

  await browser.close();
})();
