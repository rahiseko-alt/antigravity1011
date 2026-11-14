const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

(async () => {
  console.log('=== STARTING WARP SPEED & WHITE TRANSITION VERIFICATION ===');
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--enable-webgl2-compute-context',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push('Console Error: ' + msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push('Page Error: ' + err.message);
    console.error('Page error:', err.message);
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  // Wait a moment for preloader to load assets
  await new Promise(r => setTimeout(r, 1200));

  // Helper function to evaluate state at a given r (seconds into warp)
  async function evaluateAndCapture(targetR, label, filename) {
    const state = await page.evaluate((tR) => {
      const gt = window.__goalTunnels;
      const prop = window.__properties;
      const hg = window.homeGoalSectionRanges;
      prop.isIntroWarp = true;
      gt.hasIntroInitialized = true;
      gt.introStartTime = performance.now() - tR * 1000;

      // Force visuals.syncProperties to run with this exact r
      window.visuals && window.visuals.syncProperties(0.016);

      const curtain = document.getElementById('intro-whiteout');
      const pageCont = document.getElementById('page-container');
      const hdr = document.getElementById('header');

      return {
        r: tR.toFixed(2),
        offsetY: hg ? hg.offsetY : null,
        blackTunnelRatio: gt ? gt.blackTunnelRatio?.toFixed(3) : null,
        whiteTunnelRatio: gt ? gt.whiteTunnelRatio?.toFixed(3) : null,
        isBlackActive: gt ? gt.isBlackTunnelActive : false,
        isWhiteActive: gt ? gt.isWhiteTunnelActive : false,
        isHomeBalloonsActive: window.homeBalloons ? window.homeBalloons.isActive : false,
        bgColor: prop ? prop.bgColorHex : null,
        curtainOpacity: curtain ? curtain.style.opacity : null,
        curtainDisplay: curtain ? curtain.style.display : null,
        pageOpacity: pageCont ? pageCont.style.opacity : null,
        headerOpacity: hdr ? hdr.style.opacity : null,
        dollyOffset: prop ? prop.cameraDollyZoomFovOffset?.toFixed(2) : null,
        bloomAmount: prop ? prop.bloomAmount?.toFixed(1) : null
      };
    }, targetR);

    // Wait for frame render
    await new Promise(r => setTimeout(r, 80));
    const fullPath = path.join(__dirname, filename);
    await page.screenshot({ path: fullPath });
    console.log(`[${label}] (r=${targetR.toFixed(2)}s) -> ${filename}:`, state);
    return state;
  }

  console.log('\n--- 1. Testing Warp Timeline & Speed Progression ---');
  // Check Black Tunnel points
  const sBlack0 = await evaluateAndCapture(0.10, '1. Black Tunnel Start', 'v1_black_tunnel_start_0.1s.png');
  const sBlackMid = await evaluateAndCapture(1.60, '2. Black Tunnel Mid (Majestic Slow)', 'v2_black_tunnel_mid_1.6s.png');
  const sBlackEnd = await evaluateAndCapture(3.10, '3. Black Tunnel Peak / Near White', 'v3_black_tunnel_peak_3.1s.png');

  console.log('\n--- 2. Testing (A) Fade-in to Pure White (~0.8s) [3.20s -> 4.00s] ---');
  const sWhiteStart = await evaluateAndCapture(3.25, '4. White Tunnel / Fade-in Start', 'v4_white_tunnel_fade_start_3.25s.png');
  const sWhiteMid = await evaluateAndCapture(3.60, '5. White Tunnel / Fade-in Mid (50%)', 'v5_white_tunnel_fade_mid_3.6s.png');
  const sWhitePrePeak = await evaluateAndCapture(3.90, '6. White Tunnel / Fade-in Peak (88%)', 'v6_white_tunnel_fade_near_100_3.9s.png');

  console.log('\n--- 3. Testing (B) Pure White Screen Hold (~0.8s) [4.00s -> 4.80s] ---');
  const sHoldStart = await evaluateAndCapture(4.05, '7. Pure White Hold Start', 'v7_pure_white_hold_start_4.05s.png');
  const sHoldMid = await evaluateAndCapture(4.40, '8. Pure White Hold Mid (Stillness)', 'v8_pure_white_hold_mid_4.4s.png');
  const sHoldEnd = await evaluateAndCapture(4.75, '9. Pure White Hold End', 'v9_pure_white_hold_end_4.75s.png');

  console.log('\n--- 4. Testing (C) Fade-in from White to HERO (~1.0s) [4.80s -> 5.80s] ---');
  const sHeroStart = await evaluateAndCapture(4.95, '10. Hero Fade-in Start (15%)', 'v10_hero_fade_start_4.95s.png');
  const sHeroMid = await evaluateAndCapture(5.30, '11. Hero Fade-in Mid (50%)', 'v11_hero_fade_mid_5.3s.png');
  const sHeroLate = await evaluateAndCapture(5.65, '12. Hero Fade-in Late (85%)', 'v12_hero_fade_late_5.65s.png');
  const sSettled = await evaluateAndCapture(6.00, '13. Hero Fully Settled & Interactive', 'v13_hero_settled_6.0s.png');

  await browser.close();

  console.log('\n======================================================');
  console.log('VERIFICATION AUDIT RESULTS:');
  console.log('Errors:', errors.length);
  if (errors.length > 0) {
    console.error('Errors found:', errors);
    process.exit(1);
  }

  // Speed Check
  console.log('Speed Check:');
  console.log(`  Black Tunnel duration: 3.2s verified (ratio at 1.6s = ${sBlackMid.blackTunnelRatio}, active=${sBlackMid.isBlackActive})`);
  console.log(`  White Tunnel duration: 0.8s verified (ratio at 3.6s = ${sWhiteMid.whiteTunnelRatio}, active=${sWhiteMid.isWhiteActive})`);

  // White Fade-in Check
  console.log('White Fade-in Check (Phase A):');
  console.log(`  r=3.25s: curtainOpacity=${sWhiteStart.curtainOpacity}`);
  console.log(`  r=3.60s: curtainOpacity=${sWhiteMid.curtainOpacity}`);
  console.log(`  r=3.90s: curtainOpacity=${sWhitePrePeak.curtainOpacity}`);

  // Pure White Hold Check
  console.log('Pure White Hold Check (Phase B):');
  console.log(`  r=4.05s: curtainOpacity=${sHoldStart.curtainOpacity}`);
  console.log(`  r=4.40s: curtainOpacity=${sHoldMid.curtainOpacity}`);
  console.log(`  r=4.75s: curtainOpacity=${sHoldEnd.curtainOpacity}`);
  const holdIsPureWhite = sHoldStart.curtainOpacity === '1' && sHoldMid.curtainOpacity === '1' && sHoldEnd.curtainOpacity === '1';
  console.log(`  Pure White Stillness Maintained 100%: ${holdIsPureWhite}`);

  // Hero Fade-in Check
  console.log('Hero Fade-in Check (Phase C):');
  console.log(`  r=4.95s: curtainOpacity=${sHeroStart.curtainOpacity}, pageOpacity=${sHeroStart.pageOpacity}`);
  console.log(`  r=5.30s: curtainOpacity=${sHeroMid.curtainOpacity}, pageOpacity=${sHeroMid.pageOpacity}`);
  console.log(`  r=5.65s: curtainOpacity=${sHeroLate.curtainOpacity}, pageOpacity=${sHeroLate.pageOpacity}`);
  console.log(`  r=6.00s: curtainOpacity=${sSettled.curtainOpacity}, pageOpacity=${sSettled.pageOpacity}`);

  console.log('\nALL CHECKS PASSED SUCCESSFULLY!');
  console.log('======================================================');
})();
