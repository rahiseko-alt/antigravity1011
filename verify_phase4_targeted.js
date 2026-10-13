const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function captureMilestoneByR(name, targetR) {
  console.log(`\n=== Capturing ${name} (at r >= ${targetR}s) ===`);

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

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Poll until targetR is reached via RAF
  await page.waitForFunction(tr => {
    if (!window.__goalTunnels || window.__goalTunnels.introStartTime == null) return false;
    const r = (performance.now() - window.__goalTunnels.introStartTime) / 1000;
    return r >= tr;
  }, { timeout: 15000, polling: 'raf' }, targetR);

  const state = await page.evaluate(() => {
    const r = window.__goalTunnels ? (performance.now() - window.__goalTunnels.introStartTime) / 1000 : null;
    const w = document.getElementById('intro-whiteout');
    const p = document.getElementById('page-container');
    const h = document.getElementById('header');
    return {
      r: r != null ? r.toFixed(3) : null,
      isIntroWarp: window.__properties ? window.__properties.isIntroWarp : null,
      whiteoutOpacity: w ? w.style.opacity : null,
      whiteoutDisplay: w ? w.style.display : null,
      pageContainerOpacity: p ? p.style.opacity : null,
      headerOpacity: h ? h.style.opacity : null,
      homeBalloonsActive: window.__homeBalloons ? window.__homeBalloons.isActive : null,
      scrollActive: window.scrollManager ? window.scrollManager.isActive : null,
      bloomAmount: window.__properties ? window.__properties.bloomAmount : null
    };
  });

  console.log(`State at capture [${name}]:`, state);
  const screenshotPath = `${name}.png`;
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved screenshot to ${screenshotPath}`);

  await browser.close();
  return state;
}

async function main() {
  // 1. Climax of Glass Shatter (Pure Whiteout): r = 2.42s
  const s1 = await captureMilestoneByR('phase4_1_pure_whiteout_climax', 2.42);

  // 2. Dissolving Bloom & Hero Emergence with Physics Settling: r = 2.70s
  const s2 = await captureMilestoneByR('phase4_2_bloom_dissolve_emerging', 2.70);

  // 3. Fully Settled Hero with Unlocked Scrolling: r = 3.20s
  const s3 = await captureMilestoneByR('phase4_3_hero_settled_scroll_unlocked', 3.20);

  const report = { s1, s2, s3 };
  fs.writeFileSync('phase4_verification_final_report.json', JSON.stringify(report, null, 2), 'utf8');
  console.log('\n=== Targeted Verification Complete ===\n', report);
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
