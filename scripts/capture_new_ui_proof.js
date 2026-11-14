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

  // 1. Desktop Test (1440x900)
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 6500));

  // Snap to Initiatives CTA group (Dual LINE & Email buttons)
  await page.evaluate(() => {
    // 3053 is cta absolute top, offset by 350 to center in 900px viewport
    window.scrollManager.scrollToPixel(2700, true);
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'proof_desktop_initiatives_cta.png') });
  console.log("Saved proof_desktop_initiatives_cta.png");

  // Snap to Compact Home Goal section (with details button)
  await page.evaluate(() => {
    // Scroll to bottom near home-goal
    window.scrollManager.scrollToPixel(window.scrollManager.contentSizePixel, true);
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'proof_desktop_compact_goal.png') });
  console.log("Saved proof_desktop_compact_goal.png");

  // 2. Mobile Test (390x844)
  const mobPage = await browser.newPage();
  await mobPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 6500));

  // On mobile, blue_button was at 3595
  await mobPage.evaluate(() => {
    window.scrollManager.scrollToPixel(3595, true);
  });
  await new Promise(r => setTimeout(r, 1200));
  await mobPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'proof_mobile_initiatives_cta.png') });
  console.log("Saved proof_mobile_initiatives_cta.png");

  // On mobile, scroll to goal section
  await mobPage.evaluate(() => {
    window.scrollManager.scrollToPixel(window.scrollManager.contentSizePixel, true);
  });
  await new Promise(r => setTimeout(r, 1200));
  await mobPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'proof_mobile_compact_goal.png') });
  console.log("Saved proof_mobile_compact_goal.png");

  await browser.close();
  console.log("All proof captures completed successfully!");
})();
