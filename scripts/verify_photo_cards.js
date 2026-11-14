import puppeteer from 'puppeteer-core';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  // 1. Desktop Test (1920x1080)
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Wait for intro warp and hero to settle
  await new Promise(r => setTimeout(r, 9000));

  const pcTop = await page.evaluate(() => document.getElementById('home-members')?.offsetTop || 0);
  console.log("Desktop members offsetTop:", pcTop);

  // Scroll to members top (cards 1 & 2)
  await page.evaluate((y) => window.scrollManager.scrollToPixel(y + 80, false), pcTop);
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'verify_cards_photo_pc1.png' });
  console.log("Saved verify_cards_photo_pc1.png");

  // Scroll to members middle (cards 3 & 4)
  await page.evaluate((y) => window.scrollManager.scrollToPixel(y + 600, false), pcTop);
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'verify_cards_photo_pc2.png' });
  console.log("Saved verify_cards_photo_pc2.png");

  // 2. Mobile Test (390x844)
  const mobPage = await browser.newPage();
  await mobPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 9000));

  const mobTop = await mobPage.evaluate(() => document.getElementById('home-members')?.offsetTop || 0);
  console.log("Mobile members offsetTop:", mobTop);

  await mobPage.evaluate((y) => window.scrollManager.scrollToPixel(y + 60, false), mobTop);
  await new Promise(r => setTimeout(r, 1500));
  await mobPage.screenshot({ path: 'verify_cards_photo_mob1.png' });
  console.log("Saved verify_cards_photo_mob1.png");

  await mobPage.evaluate((y) => window.scrollManager.scrollToPixel(y + 550, false), mobTop);
  await new Promise(r => setTimeout(r, 1500));
  await mobPage.screenshot({ path: 'verify_cards_photo_mob2.png' });
  console.log("Saved verify_cards_photo_mob2.png");

  await browser.close();
  console.log("Verification finished successfully!");
})();
