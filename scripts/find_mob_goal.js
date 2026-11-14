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

  for (let sp = 4800; sp <= 5600; sp += 200) {
    await mobPage.evaluate(y => {
      window.scrollManager.scrollToPixel(y, true);
    }, sp);
    await new Promise(r => setTimeout(r, 600));
    await mobPage.screenshot({ path: path.join(ARTIFACTS_DIR, `mob_goal_sp_${sp}.png`) });
    console.log(`Saved mob_goal_sp_${sp}.png`);
  }

  await browser.close();
})();
