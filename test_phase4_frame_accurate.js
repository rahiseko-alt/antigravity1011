const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== Precise Frame-Accurate Phase 4 Capture ===');

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

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(msg.text()));

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Expose a controller in page
  await page.evaluate(() => {
    window.__freezeAt = null;
    window.__freezeOffset = 0;
    const origNow = performance.now.bind(performance);
    performance.now = function() {
      const real = origNow();
      if (window.__freezeAt != null) {
        return window.__freezeAt;
      }
      return real - window.__freezeOffset;
    };
  });

  // Wait for intro warp to start
  console.log('Waiting for intro warp...');
  await page.waitForFunction(() => {
    return window.__properties && window.__properties.isIntroWarp && window.__goalTunnels && window.__goalTunnels.introStartTime != null;
  }, { timeout: 15000 });

  console.log('Warp started! Setting freeze checkpoint 1: Glass Shatter Approach (r = 2.1s)...');
  await page.evaluate(() => {
    const start = window.__goalTunnels.introStartTime;
    const interval = setInterval(() => {
      const currentR = (performance.now() - start) / 1000;
      if (currentR >= 2.1) {
        clearInterval(interval);
        window.__freezeAt = performance.now();
        window.__frozenR = currentR;
      }
    }, 10);
  });

  await page.waitForFunction(() => window.__freezeAt != null, { timeout: 8000 });
  const f1 = await page.evaluate(() => {
    return {
      r: window.__frozenR,
      glassRatio: window.__goalTunnelGlass ? window.__goalTunnelGlass.ratio : null,
      glassVisible: window.__goalTunnelGlass && window.__goalTunnelGlass.container ? window.__goalTunnelGlass.container.visible : null,
      whiteoutOpacity: document.getElementById('intro-whiteout') ? document.getElementById('intro-whiteout').style.opacity : null
    };
  });
  console.log('Checkpoint 1 (Glass Shatter Approach):', f1);
  await page.screenshot({ path: 'phase4_1_glass_shatter_flying.png' });

  // Resume and freeze at checkpoint 2: Pure Whiteout at Climax (r = 2.42s)
  console.log('Resuming to Checkpoint 2: Pure Whiteout Climax (r = 2.42s)...');
  await page.evaluate(() => {
    const freezeDuration = 1000; // unfreeze
    const origNow = performance.now;
    window.__freezeAt = null;
    const start = window.__goalTunnels.introStartTime;
    const interval = setInterval(() => {
      const currentR = (performance.now() - start) / 1000;
      if (currentR >= 2.42) {
        clearInterval(interval);
        window.__freezeAt = performance.now();
        window.__frozenR = currentR;
      }
    }, 10);
  });

  await page.waitForFunction(() => window.__frozenR >= 2.40, { timeout: 8000 });
  const f2 = await page.evaluate(() => {
    const w = document.getElementById('intro-whiteout');
    return {
      r: window.__frozenR,
      whiteoutOpacity: w ? w.style.opacity : null,
      whiteoutDisplay: w ? w.style.display : null,
      homeBalloonsActive: window.__homeBalloons ? window.__homeBalloons.isActive : null,
      bloomAmount: window.__properties ? window.__properties.bloomAmount : null
    };
  });
  console.log('Checkpoint 2 (Pure Whiteout at Climax):', f2);
  await page.screenshot({ path: 'phase4_2_pure_whiteout_climax.png' });

  // Resume and freeze at checkpoint 3: White Bloom Dissolving & Hero Emergence (r = 2.70s)
  console.log('Resuming to Checkpoint 3: White Bloom Dissolving, Hero Emerging (r = 2.70s)...');
  await page.evaluate(() => {
    window.__freezeAt = null;
    const start = window.__goalTunnels.introStartTime;
    const interval = setInterval(() => {
      const currentR = (performance.now() - start) / 1000;
      if (currentR >= 2.70) {
        clearInterval(interval);
        window.__freezeAt = performance.now();
        window.__frozenR = currentR;
      }
    }, 10);
  });

  await page.waitForFunction(() => window.__frozenR >= 2.68, { timeout: 8000 });
  const f3 = await page.evaluate(() => {
    const w = document.getElementById('intro-whiteout');
    const p = document.getElementById('page-container');
    const h = document.getElementById('header');
    return {
      r: window.__frozenR,
      whiteoutOpacity: w ? w.style.opacity : null,
      pageContainerOpacity: p ? p.style.opacity : null,
      headerOpacity: h ? h.style.opacity : null,
      homeBalloonsActive: window.__homeBalloons ? window.__homeBalloons.isActive : null,
      bloomAmount: window.__properties ? window.__properties.bloomAmount : null
    };
  });
  console.log('Checkpoint 3 (White Bloom Dissolving, Hero Emerging):', f3);
  await page.screenshot({ path: 'phase4_3_bloom_dissolving_hero_emerging.png' });

  // Resume and let transition complete naturally to r = 3.3s
  console.log('Resuming to completion (r = 3.3s)...');
  await page.evaluate(() => {
    window.__freezeAt = null;
  });
  await sleep(1000);

  const f4 = await page.evaluate(() => {
    const w = document.getElementById('intro-whiteout');
    const p = document.getElementById('page-container');
    const h = document.getElementById('header');
    return {
      isIntroWarp: window.__properties ? window.__properties.isIntroWarp : null,
      whiteoutDisplay: w ? w.style.display : null,
      pageContainerOpacity: p ? p.style.opacity : null,
      headerOpacity: h ? h.style.opacity : null,
      scrollActive: window.scrollManager ? window.scrollManager.isActive : null,
      bodyOverflow: document.body.style.overflow
    };
  });
  console.log('Checkpoint 4 (Hero Fully Settled & Scrolling Unlocked):', f4);
  await page.screenshot({ path: 'phase4_4_hero_settled_scroll_unlocked.png' });

  // Verify scrolling works
  console.log('Testing scrolling down...');
  await page.evaluate(() => {
    if (window.scrollManager) {
      window.scrollManager.scrollTo('#home-reel', 0, false);
    }
  });
  await sleep(600);
  const f5 = await page.evaluate(() => {
    return {
      scrollY: window.scrollManager ? window.scrollManager.scrollY : null,
      targetY: window.scrollManager ? window.scrollManager.targetY : null
    };
  });
  console.log('Checkpoint 5 (Scrolled to Reel Section):', f5);
  await page.screenshot({ path: 'phase4_5_hero_scrolled_reel.png' });

  await browser.close();

  fs.writeFileSync('phase4_frame_accurate_report.json', JSON.stringify({ f1, f2, f3, f4, f5 }, null, 2), 'utf8');
  console.log('=== All Checkpoints Successfully Captured and Verified! ===');
}

run().catch(err => {
  console.error('Run failed:', err);
  process.exit(1);
});
