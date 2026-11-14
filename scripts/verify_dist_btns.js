const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const distPath = path.resolve(__dirname, '..', 'dist', 'index.html');
  await page.goto('file:///' + distPath.replace(/\\/g, '/'), { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Reel Button (Red)
  const reelBtn = await page.$('#home-reel-cta');
  if (reelBtn) {
    await reelBtn.scrollIntoView();
    await new Promise(r => setTimeout(r, 400));
    await reelBtn.screenshot({ path: 'verify_dist_reel_idle.png' });
    console.log('Saved verify_dist_reel_idle.png');

    await reelBtn.hover();
    await new Promise(r => setTimeout(r, 400));
    await reelBtn.screenshot({ path: 'verify_dist_reel_hover.png' });
    console.log('Saved verify_dist_reel_hover.png');
  }

  // Move away
  await page.mouse.move(0, 0);
  await new Promise(r => setTimeout(r, 300));

  // 2. Featured Button (Blue)
  const featBtn = await page.$('#home-featured-cta');
  if (featBtn) {
    await featBtn.scrollIntoView();
    await new Promise(r => setTimeout(r, 400));
    await featBtn.screenshot({ path: 'verify_dist_featured_idle.png' });
    console.log('Saved verify_dist_featured_idle.png');

    await featBtn.hover();
    await new Promise(r => setTimeout(r, 400));
    await featBtn.screenshot({ path: 'verify_dist_featured_hover.png' });
    console.log('Saved verify_dist_featured_hover.png');
  }

  await browser.close();
  console.log('Dist verification complete!');
})();
