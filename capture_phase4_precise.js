const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureAtTime(targetR, filename) {
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

  await page.waitForFunction(() => {
    return window.__properties && window.__properties.isIntroWarp && window.__goalTunnels && window.__goalTunnels.introStartTime != null;
  }, { timeout: 15000 });

  // Poll until targetR is reached
  await page.waitForFunction(tr => {
    const r = (performance.now() - window.__goalTunnels.introStartTime) / 1000;
    return r >= tr;
  }, { timeout: 10000, polling: 'raf' }, targetR);

  const info = await page.evaluate(() => {
    const r = (performance.now() - window.__goalTunnels.introStartTime) / 1000;
    const w = document.getElementById('intro-whiteout');
    const p = document.getElementById('page-container');
    const h = document.getElementById('header');
    return {
      r: r.toFixed(3),
      whiteoutOpacity: w ? w.style.opacity : null,
      whiteoutDisplay: w ? w.style.display : null,
      pageContainerOpacity: p ? p.style.opacity : null,
      headerOpacity: h ? h.style.opacity : null,
      homeBalloonsActive: window.__homeBalloons ? window.__homeBalloons.isActive : null,
      scrollActive: window.scrollManager ? window.scrollManager.isActive : null,
      bloomAmount: window.__properties ? window.__properties.bloomAmount : null
    };
  });

  console.log(`[Target ${targetR}s -> Captured at r=${info.r}s]:`, info);
  await page.screenshot({ path: filename });

  await browser.close();
  return info;
}

async function main() {
  console.log('Capturing exact Phase 4 milestones...');
  const res1 = await captureAtTime(2.42, 'verify_phase4_pure_whiteout_climax.png');
  const res2 = await captureAtTime(2.65, 'verify_phase4_bloom_dissolve_emerging.png');
  const res3 = await captureAtTime(3.15, 'verify_phase4_hero_settled_clean.png');

  fs.writeFileSync('phase4_verification_data.json', JSON.stringify({ res1, res2, res3 }, null, 2), 'utf8');
  console.log('Done capturing all Phase 4 milestones!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
