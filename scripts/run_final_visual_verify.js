const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== RUNNING FINAL HIGH-PRECISION VERIFICATION OF SMOOTH CURVE & EXTENDED LIFESPAN ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  // 1. MOBILE VERIFICATION (iPhone 14, 390x844)
  console.log('\n--- 1. MOBILE VERIFICATION (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForFunction(() => window.scrollManager && window.homePage, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 6500)); // wait for intro to settle

  const mobileScrolls = [
    { y: 350, name: 'final_mobile_01_hero_balloon_cyan' },
    { y: 1050, name: 'final_mobile_02_reel_red_swoop' },
    { y: 1350, name: 'final_mobile_03_exact_user_position_green_loop' },
    { y: 1450, name: 'final_mobile_04_green_loop_full' },
    { y: 2200, name: 'final_mobile_05_initiatives_cards_purple' },
    { y: 3400, name: 'final_mobile_06_initiatives_deep_gold' },
    { y: 4600, name: 'final_mobile_07_members_aurora_wave' },
    { y: 5400, name: 'final_mobile_08_goal_warp_entrance' }
  ];

  for (const s of mobileScrolls) {
    await mobilePage.evaluate((y) => {
      window.scrollManager.scrollPixel = y;
      window.scrollTo(0, y);
    }, s.y);
    await new Promise(r => setTimeout(r, 500));

    const file = `${s.name}.png`;
    await mobilePage.screenshot({ path: file, fullPage: false });
    console.log(`[Captured] ${file} at scrollY=${s.y}px`);
  }

  // 2. DESKTOP VERIFICATION (1920x1080)
  console.log('\n--- 2. DESKTOP VERIFICATION (1920x1080) ---');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await desktopPage.waitForFunction(() => window.scrollManager && window.homePage, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 6500));

  const desktopScrolls = [
    { y: 400, name: 'final_desktop_01_hero_cyan' },
    { y: 1200, name: 'final_desktop_02_reel_red' },
    { y: 1800, name: 'final_desktop_03_initiatives_green_loop' },
    { y: 2800, name: 'final_desktop_04_cards_purple' },
    { y: 4200, name: 'final_desktop_05_members_gold' },
    { y: 5200, name: 'final_desktop_06_goal_aurora' }
  ];

  for (const s of desktopScrolls) {
    await desktopPage.evaluate((y) => {
      window.scrollManager.scrollPixel = y;
      window.scrollTo(0, y);
    }, s.y);
    await new Promise(r => setTimeout(r, 500));

    const file = `${s.name}.png`;
    await desktopPage.screenshot({ path: file, fullPage: false });
    console.log(`[Captured] ${file} at scrollY=${s.y}px`);
  }

  await browser.close();
  console.log('\n=== ALL CAPTURES COMPLETED ===');
})();
