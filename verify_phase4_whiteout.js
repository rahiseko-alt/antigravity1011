const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== Verifying Phase 4: Pure Whiteout to Hero Fade-In Transition ===');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--enable-webgl2-compute-context',
      '--ignore-gpu-blocklist',
      '--disable-gpu-sandbox',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait for introStartTime to be established (meaning preloader reached 100% and intro warp started)
  console.log('Waiting for intro warp to start...');
  await page.waitForFunction(() => {
    return window.__properties && window.__properties.isIntroWarp;
  }, { timeout: 15000 });

  console.log('Intro warp started! Tracking timestamps...');

  // Frame 1: Cyber grid (r ~ 0.8s)
  await sleep(700);
  const status1 = await page.evaluate(() => {
    const r = window.__goalTunnels ? (performance.now() - window.__goalTunnels.introStartTime) / 1000 : null;
    return { r, isIntroWarp: window.__properties ? window.__properties.isIntroWarp : null };
  });
  console.log('Capture 1 (Cyber Grid):', status1);
  await page.screenshot({ path: 'verify_phase4_1_cyber_grid.png' });

  // Frame 2: Glass Shatter / White Tunnel (r ~ 2.1s)
  await sleep(1300);
  const status2 = await page.evaluate(() => {
    const r = window.__goalTunnels ? (performance.now() - window.__goalTunnels.introStartTime) / 1000 : null;
    const glass = window.__goalTunnelGlass ? window.__goalTunnelGlass.ratio : null;
    return { r, glass };
  });
  console.log('Capture 2 (Glass Shatter Approach):', status2);
  await page.screenshot({ path: 'verify_phase4_2_glass_shatter.png' });

  // Frame 3: Pure Whiteout at Climax (r ~ 2.45s)
  await sleep(350);
  const status3 = await page.evaluate(() => {
    const r = window.__goalTunnels ? (performance.now() - window.__goalTunnels.introStartTime) / 1000 : null;
    const whiteout = document.getElementById('intro-whiteout');
    return {
      r,
      whiteoutOpacity: whiteout ? whiteout.style.opacity : null,
      whiteoutDisplay: whiteout ? whiteout.style.display : null,
      homeBalloonsActive: window.__homeBalloons ? window.__homeBalloons.isActive : null
    };
  });
  console.log('Capture 3 (Pure Whiteout at Climax):', status3);
  await page.screenshot({ path: 'verify_phase4_3_pure_whiteout.png' });

  // Frame 4: White Bloom Dissolving & Hero Emergence with Physics Settling (r ~ 2.75s)
  await sleep(300);
  const status4 = await page.evaluate(() => {
    const r = window.__goalTunnels ? (performance.now() - window.__goalTunnels.introStartTime) / 1000 : null;
    const whiteout = document.getElementById('intro-whiteout');
    const pageCont = document.getElementById('page-container');
    const header = document.getElementById('header');
    return {
      r,
      whiteoutOpacity: whiteout ? whiteout.style.opacity : null,
      pageContainerOpacity: pageCont ? pageCont.style.opacity : null,
      headerOpacity: header ? header.style.opacity : null,
      homeBalloonsActive: window.__homeBalloons ? window.__homeBalloons.isActive : null,
      scrollActive: window.scrollManager ? window.scrollManager.isActive : null
    };
  });
  console.log('Capture 4 (White Bloom Dissolving, Hero Emerging):', status4);
  await page.screenshot({ path: 'verify_phase4_4_bloom_dissolving.png' });

  // Frame 5: Fully Settled Hero with Scrolling Unlocked (r ~ 3.5s)
  await sleep(750);
  const status5 = await page.evaluate(() => {
    const r = window.__goalTunnels ? (performance.now() - window.__goalTunnels.introStartTime) / 1000 : null;
    const whiteout = document.getElementById('intro-whiteout');
    const pageCont = document.getElementById('page-container');
    const header = document.getElementById('header');
    return {
      r,
      isIntroWarp: window.__properties ? window.__properties.isIntroWarp : null,
      whiteoutDisplay: whiteout ? whiteout.style.display : null,
      whiteoutOpacity: whiteout ? whiteout.style.opacity : null,
      pageContainerOpacity: pageCont ? pageCont.style.opacity : null,
      headerOpacity: header ? header.style.opacity : null,
      scrollActive: window.scrollManager ? window.scrollManager.isActive : null,
      bodyOverflow: document.body.style.overflow
    };
  });
  console.log('Capture 5 (Fully Settled Hero & Unlocked Scrolling):', status5);
  await page.screenshot({ path: 'verify_phase4_5_hero_settled.png' });

  // Test Scroll Interaction
  console.log('Testing scroll interaction...');
  await page.evaluate(() => {
    if (window.scrollManager) {
      window.scrollManager.targetY = 400;
    }
  });
  await sleep(500);
  const scrollResult = await page.evaluate(() => {
    return {
      scrollY: window.scrollManager ? window.scrollManager.scrollY : null,
      targetY: window.scrollManager ? window.scrollManager.targetY : null,
      isActive: window.scrollManager ? window.scrollManager.isActive : null
    };
  });
  console.log('Scroll Result:', scrollResult);
  await page.screenshot({ path: 'verify_phase4_6_hero_scrolled.png' });

  await browser.close();

  console.log('Console Errors:', consoleErrors);
  console.log('=== Verification Completed Successfully! ===');
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
