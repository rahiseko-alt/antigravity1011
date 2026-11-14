const puppeteer = require('puppeteer-core');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== CAPTURING OFFICIAL VISUAL QA DELIVERABLES ===');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const rootDir = process.cwd();

  // 1. MOBILE SUITE (iPhone 14, 390x844)
  console.log('\n--- 1. MOBILE SUITE (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for intro warp to complete and settle...');
  await mobilePage.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.5;
  }, { timeout: 60000 });
  await new Promise(r => setTimeout(r, 1000));

  // Function to set scroll position reliably
  async function scrollMobile(sy) {
    await mobilePage.evaluate((y) => {
      window.scrollManager.scrollPixel = y;
      window.scrollManager.targetScrollPixel = y;
      window.scrollTo(0, y);
    }, sy);
    await new Promise(r => setTimeout(r, 600));
  }

  // A. smooth_loop_mobile_closeup.png
  // At scrollY = 1350px (Reel CTA "HOW IT WORKS" / Active Initiatives header)
  console.log('Capturing smooth_loop_mobile_closeup.png at scrollY=1350px...');
  await scrollMobile(1350);
  const closeupPath = path.resolve(rootDir, 'smooth_loop_mobile_closeup.png');
  await mobilePage.screenshot({
    path: closeupPath,
    clip: {
      x: 0,
      y: 0,
      width: 390,
      height: 380
    }
  });
  console.log('Saved: smooth_loop_mobile_closeup.png');

  // B. Mobile Extended Journey:
  // - scrollY = 1000px (Reel, red swoop) -> mobile_journey_1000.png
  // - scrollY = 2200px (Initiatives top, green loop / purple curve) -> mobile_journey_2200.png
  // - scrollY = 3200px (Initiatives mid-cards, purple curve) -> mobile_journey_3200.png
  // - scrollY = 4200px (Initiatives bottom / Members, purple/gold) -> mobile_journey_4200.png
  // - scrollY = 5000px (Members section, gold wave) -> mobile_journey_5000.png
  const mobilePoints = [
    { sy: 1000, file: 'mobile_journey_1000.png', label: 'scrollY = 1000px (Reel, red swoop)' },
    { sy: 2200, file: 'mobile_journey_2200.png', label: 'scrollY = 2200px (Initiatives cards, purple curve)' },
    { sy: 3200, file: 'mobile_journey_3200.png', label: 'scrollY = 3200px (Initiatives mid-cards, gold curve)' },
    { sy: 4200, file: 'mobile_journey_4200.png', label: 'scrollY = 4200px (Initiatives bottom / Members)' },
    { sy: 5000, file: 'mobile_journey_5000.png', label: 'scrollY = 5000px (Members section, gold/aurora wave)' }
  ];

  for (const pt of mobilePoints) {
    await scrollMobile(pt.sy);
    const shotPath = path.resolve(rootDir, pt.file);
    await mobilePage.screenshot({ path: shotPath });
    console.log(`Saved: ${pt.file} (${pt.label})`);
  }

  await mobilePage.close();

  // 2. DESKTOP SUITE (1920x1080)
  console.log('\n--- 2. DESKTOP SUITE (1920x1080) ---');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for desktop intro to settle...');
  await desktopPage.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.5;
  }, { timeout: 60000 });
  await new Promise(r => setTimeout(r, 1000));

  async function scrollDesktop(sy) {
    await desktopPage.evaluate((y) => {
      window.scrollManager.scrollPixel = y;
      window.scrollManager.targetScrollPixel = y;
      window.scrollTo(0, y);
    }, sy);
    await new Promise(r => setTimeout(r, 600));
  }

  // Desktop Test Points:
  // - scrollY = 1500px -> desktop_smooth_journey_1500.png
  // - scrollY = 3000px -> desktop_smooth_journey_3000.png
  // - scrollY = 4500px -> desktop_smooth_journey_4500.png
  const desktopPoints = [
    { sy: 1500, file: 'desktop_smooth_journey_1500.png', label: 'scrollY = 1500px (Reel / Red swoop)' },
    { sy: 3000, file: 'desktop_smooth_journey_3000.png', label: 'scrollY = 3000px (Initiatives cards, green/purple loop)' },
    { sy: 4500, file: 'desktop_smooth_journey_4500.png', label: 'scrollY = 4500px (Members / Gold wave extended)' }
  ];

  for (const pt of desktopPoints) {
    await scrollDesktop(pt.sy);
    const shotPath = path.resolve(rootDir, pt.file);
    await desktopPage.screenshot({ path: shotPath });
    console.log(`Saved: ${pt.file} (${pt.label})`);
  }

  await desktopPage.close();
  await browser.close();

  console.log('\n=== ALL DELIVERABLES CAPTURED SUCCESSFULLY ===');
})();
