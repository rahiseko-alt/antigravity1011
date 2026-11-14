const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[BROWSER ERROR]', msg.text());
  });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // 1. Check opening warp
  console.log('Capturing opening warp frames...');
  await new Promise(r => setTimeout(r, 1200)); // during black tunnel
  await page.screenshot({ path: 'verify_pure_warp_1.png' });

  await new Promise(r => setTimeout(r, 2200)); // white tunnel / burst
  await page.screenshot({ path: 'verify_pure_warp_2.png' });

  await new Promise(r => setTimeout(r, 3500)); // hero settled
  await page.screenshot({ path: 'verify_hero_landing.png' });

  // 2. Check vertical scroll through members
  console.log('Scrolling down to members section...');
  await page.evaluate(() => {
    const mem = document.getElementById('home-members');
    if (mem && window.scrollManager) {
      window.scrollManager.scrollY = mem.offsetTop - 100;
      window.scrollManager.targetY = mem.offsetTop - 100;
      window.scrollManager.scrollPixel = mem.offsetTop - 100;
    }
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'verify_vertical_members_desktop.png' });

  // Check mobile viewport
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'verify_vertical_members_mobile.png' });

  console.log('All verification screenshots captured successfully!');
  await browser.close();
})();
