const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // 1. Wait for preloader to complete and intro warp to start
  console.log('Waiting for properties.isIntroWarp to become true...');
  await page.waitForFunction(() => window.__properties && window.__properties.isIntroWarp, { timeout: 15000 });

  // 2. Sample during black tunnel (around 0.5s into warp, ratio ~0.28)
  await new Promise(r => setTimeout(r, 450));
  const state1 = await page.evaluate(() => {
    return {
      isIntroWarp: window.__properties.isIntroWarp,
      stage: window.visuals ? (window.visuals.currentStage3D === window.goalTunnels ? 'goalTunnels' : 'other') : 'unknown',
      introRatio: window.goalTunnels ? window.goalTunnels.introRatio : -1,
      isBlackTunnelActive: window.goalTunnels ? window.goalTunnels.isBlackTunnelActive : false,
      isWhiteTunnelActive: window.goalTunnels ? window.goalTunnels.isWhiteTunnelActive : false
    };
  });
  console.log('Sample 1 (Black tunnel phase):', state1);
  await page.screenshot({ path: 'verify_engine_black_tunnel.png' });

  // 3. Sample during white tunnel (around 1.45s into warp, ratio ~0.8)
  await new Promise(r => setTimeout(r, 900));
  const state2 = await page.evaluate(() => {
    return {
      isIntroWarp: window.__properties.isIntroWarp,
      stage: window.visuals ? (window.visuals.currentStage3D === window.goalTunnels ? 'goalTunnels' : 'other') : 'unknown',
      introRatio: window.goalTunnels ? window.goalTunnels.introRatio : -1,
      isBlackTunnelActive: window.goalTunnels ? window.goalTunnels.isBlackTunnelActive : false,
      isWhiteTunnelActive: window.goalTunnels ? window.goalTunnels.isWhiteTunnelActive : false
    };
  });
  console.log('Sample 2 (White tunnel phase):', state2);
  await page.screenshot({ path: 'verify_engine_white_tunnel.png' });

  // 4. Wait for warp to complete and hero balloons to restore
  console.log('Waiting for isIntroWarp to become false...');
  await page.waitForFunction(() => window.__properties && !window.__properties.isIntroWarp, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 800));

  const state3 = await page.evaluate(() => {
    return {
      isIntroWarp: window.__properties.isIntroWarp,
      stage: window.visuals ? (window.visuals.currentStage3D === window.homeBalloons ? 'homeBalloons' : 'other') : 'unknown',
      homeBalloonsActive: window.homeBalloons ? window.homeBalloons.isActive : false,
      pageContainerOpacity: getComputedStyle(document.getElementById('page-container')).opacity
    };
  });
  console.log('Sample 3 (Hero Balloons restored):', state3);
  await page.screenshot({ path: 'verify_engine_hero_restored.png' });

  // 5. Test scroll down towards #home-goal
  console.log('Scrolling down towards home-goal...');
  await page.evaluate(() => {
    window.scrollManager && window.scrollManager.scrollTo && window.scrollManager.scrollTo('home-goal', 0, true);
  });
  await new Promise(r => setTimeout(r, 1200));

  const state4 = await page.evaluate(() => {
    return {
      isIntroWarp: window.__properties.isIntroWarp,
      stage: window.visuals ? (window.visuals.currentStage3D === window.goalTunnels ? 'goalTunnels' : window.visuals.currentStage3D === window.homeBalloons ? 'homeBalloons' : 'other') : 'unknown',
      goalTunnelsActive: window.goalTunnels ? window.goalTunnels.isActive : false,
      scrollY: window.scrollManager ? window.scrollManager.scrollPixel : 0
    };
  });
  console.log('Sample 4 (Mid-page scrolled):', state4);
  await page.screenshot({ path: 'verify_engine_mid_page.png' });

  await browser.close();
  console.log('Verification finished successfully!');
})();
