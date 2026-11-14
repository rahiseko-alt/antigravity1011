const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  // 1. DESKTOP RUN
  console.log('=== TARGETED DESKTOP CAPTURES ===');
  const dPage = await browser.newPage();
  await dPage.setViewport({ width: 1920, height: 1080 });
  await dPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await dPage.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 25000 });
  await new Promise(r => setTimeout(r, 1200));

  const desktopCheckpoints = [
    { target: 1200, name: 'desktop_01_reel' },
    { target: 2200, name: 'desktop_02_card1_flagship' },
    { target: 3100, name: 'desktop_03_cards2_3_gap' },
    { target: 3800, name: 'desktop_04_cards4_5_gap' },
    { target: 4500, name: 'desktop_05_card6_open_right' },
    { target: 4950, name: 'desktop_06_blue_cta_button' },
    { target: 5600, name: 'desktop_07_members_behind_cards' }
  ];

  for (const cp of desktopCheckpoints) {
    let current = await dPage.evaluate(() => window.scrollManager.scrollPixel);
    while (current < cp.target - 20) {
      const delta = Math.min(200, cp.target - current);
      await dPage.mouse.wheel({ deltaY: delta });
      await new Promise(r => setTimeout(r, 20));
      current = await dPage.evaluate(() => window.scrollManager.scrollPixel);
    }
    await new Promise(r => setTimeout(r, 500));
    const sc = await dPage.evaluate(() => window.scrollManager.scrollPixel);
    console.log(`[${cp.name}] reached scrollPixel ${sc.toFixed(0)}`);
    await dPage.screenshot({ path: `target_${cp.name}.png` });
  }
  await dPage.close();

  // 2. MOBILE RUN
  console.log('\n=== TARGETED MOBILE CAPTURES ===');
  const mPage = await browser.newPage();
  await mPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await mPage.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 25000 });
  await new Promise(r => setTimeout(r, 1200));

  const mobileCheckpoints = [
    { target: 1000, name: 'mobile_01_reel' },
    { target: 1800, name: 'mobile_02_card1_flagship' },
    { target: 2500, name: 'mobile_03_card2_3' },
    { target: 3000, name: 'mobile_04_card4_5' },
    { target: 3500, name: 'mobile_05_card6' },
    { target: 3800, name: 'mobile_06_blue_cta_button' },
    { target: 4600, name: 'mobile_07_members_behind_cards' }
  ];

  for (const cp of mobileCheckpoints) {
    let current = await mPage.evaluate(() => window.scrollManager.scrollPixel);
    while (current < cp.target - 20) {
      const delta = Math.min(180, cp.target - current);
      await mPage.mouse.wheel({ deltaY: delta });
      await new Promise(r => setTimeout(r, 20));
      current = await mPage.evaluate(() => window.scrollManager.scrollPixel);
    }
    await new Promise(r => setTimeout(r, 500));
    const sc = await mPage.evaluate(() => window.scrollManager.scrollPixel);
    console.log(`[${cp.name}] reached scrollPixel ${sc.toFixed(0)}`);
    await mPage.screenshot({ path: `target_${cp.name}.png` });
  }
  await mPage.close();

  await browser.close();
  console.log('=== TARGETED CAPTURES COMPLETE ===');
})();
