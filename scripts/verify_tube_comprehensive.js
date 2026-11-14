const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== STARTING COMPREHENSIVE TUBE VERIFICATION ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=1920,1080']
  });

  // 1. DESKTOP TEST
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6500)); // wait for intro to settle

  const desktopSteps = [
    { p: 1000, name: 'desktop_1_reel_blue' },
    { p: 1500, name: 'desktop_2_reel_red' },
    { p: 2400, name: 'desktop_3_flagship_yellow' },
    { p: 3500, name: 'desktop_4_cards_green' },
    { p: 4800, name: 'desktop_5_cards_purple' },
    { p: 5800, name: 'desktop_6_members_orange' },
    { p: 6400, name: 'desktop_7_members_complete' }
  ];

  for (const step of desktopSteps) {
    await page.evaluate((px) => {
      window.scrollManager.scrollToPixel(px, true);
    }, step.p);
    await new Promise(r => setTimeout(r, 600));

    const path = `verified_${step.name}.png`;
    await page.screenshot({ path });
    console.log(`[DESKTOP] Pixel ${step.p}: saved ${path}`);
  }

  // 2. MOBILE TEST
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6500));

  const mobileSteps = [
    { p: 900, name: 'mobile_1_reel_blue_red' },
    { p: 1800, name: 'mobile_2_flagship_yellow' },
    { p: 2800, name: 'mobile_3_cards_green' },
    { p: 4000, name: 'mobile_4_cards_purple' },
    { p: 5200, name: 'mobile_5_members_orange' },
    { p: 6000, name: 'mobile_6_members_complete' }
  ];

  for (const step of mobileSteps) {
    await mobilePage.evaluate((px) => {
      window.scrollManager.scrollToPixel(px, true);
    }, step.p);
    await new Promise(r => setTimeout(r, 600));

    const path = `verified_${step.name}.png`;
    await mobilePage.screenshot({ path });
    console.log(`[MOBILE] Pixel ${step.p}: saved ${path}`);
  }

  await browser.close();

  console.log('=== VERIFICATION SCRIPT FINISHED ===');
  console.log('Console Errors caught:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }
})();
