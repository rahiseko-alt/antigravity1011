const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));
  
  // Scroll down a bit to see the section before the video card
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'reel_before_card.png' });

  // Scroll down more to see the video card itself
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'reel_card_itself.png' });

  // Scroll down more to see after the card
  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'reel_after_card.png' });

  await browser.close();
  console.log('Saved screenshots around reel section');
})();
