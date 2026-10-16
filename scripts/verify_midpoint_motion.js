const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('=== VERIFYING MIDPOINT SPEED MOTION ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const artifactDir = 'C:/Users/user/.gemini/antigravity/brain/cb92c570-076e-4e99-8ce2-9b5a61751c86';

  // Desktop
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 6500));

  const desktopScrolls = [600, 1100, 1400, 2000, 2800, 3800];
  for (const s of desktopScrolls) {
    await page.evaluate((pos) => {
      window.scrollTo({ top: pos, behavior: 'instant' });
      if (window.scrollManager) {
        window.scrollManager.scrollPixel = pos;
        window.scrollManager.scroll = pos;
      }
    }, s);
    await new Promise(r => setTimeout(r, 600));
    const outPath = path.join(artifactDir, `midpoint_desktop_${s}.png`);
    await page.screenshot({ path: outPath });
    console.log(`Desktop S=${s} saved: ${outPath}`);
  }

  // Mobile
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 6500));

  const mobileScrolls = [500, 900, 1300, 2000, 3000];
  for (const s of mobileScrolls) {
    await mobilePage.evaluate((pos) => {
      window.scrollTo({ top: pos, behavior: 'instant' });
      if (window.scrollManager) {
        window.scrollManager.scrollPixel = pos;
        window.scrollManager.scroll = pos;
      }
    }, s);
    await new Promise(r => setTimeout(r, 600));
    const outPath = path.join(artifactDir, `midpoint_mobile_${s}.png`);
    await mobilePage.screenshot({ path: outPath });
    console.log(`Mobile S=${s} saved: ${outPath}`);
  }

  await browser.close();
  console.log('All midpoint screenshots successfully generated!');
}

run().catch(console.error);
