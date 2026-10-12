const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const url = 'https://rahiseko-alt.github.io/antigravity1011/';

  // 1. Mobile verification
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  for (let i = 0; i < 40; i++) {
    const isStarted = await mobilePage.evaluate(() => window.__properties && window.__properties.hasStarted).catch(() => false);
    if (isStarted) break;
    await new Promise(r => setTimeout(r, 250));
  }
  await new Promise(r => setTimeout(r, 2000));
  await mobilePage.screenshot({ path: 'live_mobile_verified_hero.png' });

  // Scroll mobile slowly to Bold Ideas and Featured Work
  for (let i = 0; i < 8; i++) {
    await mobilePage.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 800));
  await mobilePage.screenshot({ path: 'live_mobile_verified_boldideas.png' });

  for (let i = 0; i < 8; i++) {
    await mobilePage.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 800));
  await mobilePage.screenshot({ path: 'live_mobile_verified_featured.png' });

  // 2. Desktop verification
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900 });
  await desktopPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  for (let i = 0; i < 40; i++) {
    const isStarted = await desktopPage.evaluate(() => window.__properties && window.__properties.hasStarted).catch(() => false);
    if (isStarted) break;
    await new Promise(r => setTimeout(r, 250));
  }
  await new Promise(r => setTimeout(r, 2000));

  for (let i = 0; i < 10; i++) {
    await desktopPage.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 800));
  await desktopPage.screenshot({ path: 'live_desktop_verified_boldideas.png' });

  await browser.close();
  console.log('Live verification screenshots captured successfully!');
})();
