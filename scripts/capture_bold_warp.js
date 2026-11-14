const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== Capturing Bold Arial Warp Text (1920x1080) ===');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--no-sandbox',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.goalTunnels && window.goalTunnels.hasIntroInitialized, { timeout: 35000 });
  console.log('Intro initialized!');

  // Capture Phase 1 (PLAY WITH AI)
  // Let's set progress = 0.5 (where text is fully visible, spread, and centered with backlight)
  console.log('Capturing Phase 1 (PLAY WITH AI)...');
  await page.evaluate(() => {
    // Ensure resize has run with current font
    window.homeGoalSectionTunnelTitle.resize(1920, 1080);
    // Phase 1 active with ratio 0.5
    window.homeGoalSectionTunnelTitle.update(1, 0.5);
  });
  await sleep(300);

  const phase1Info = await page.evaluate(() => {
    const el = document.getElementById('home-goal-tunnel-title');
    const p1 = document.getElementById('tunnel-title-phase1');
    const rect = p1.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    const p1cs = window.getComputedStyle(p1);
    const spans = Array.from(p1.querySelectorAll('span')).map(s => ({
      text: s.textContent,
      rect: s.getBoundingClientRect(),
      transform: s.style.transform
    }));
    return {
      text: p1.innerText.trim(),
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      letterSpacing: cs.letterSpacing,
      textShadow: p1cs.textShadow,
      containerTransform: el.style.transform,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      spans
    };
  });
  console.log('Phase 1 Info:', JSON.stringify(phase1Info, null, 2));

  await page.screenshot({ path: 'bold_warp_phase1.png' });
  console.log('Saved bold_warp_phase1.png');

  // Capture Phase 2 (THIS WAY TOGETHER)
  // Let's set progress = 0.45 (where text is fully visible, spread, and centered with backlight)
  console.log('Capturing Phase 2 (THIS WAY TOGETHER)...');
  await page.evaluate(() => {
    window.homeGoalSectionTunnelTitle.update(2, 0.45);
  });
  await sleep(300);

  const phase2Info = await page.evaluate(() => {
    const el = document.getElementById('home-goal-tunnel-title');
    const p2 = document.getElementById('tunnel-title-phase2');
    const rect = p2.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    const p2cs = window.getComputedStyle(p2);
    const spans = Array.from(p2.querySelectorAll('span')).map(s => ({
      text: s.textContent,
      rect: s.getBoundingClientRect(),
      transform: s.style.transform
    }));
    return {
      text: p2.innerText.trim(),
      fontFamily: cs.fontFamily,
      fontWeight: cs.fontWeight,
      letterSpacing: cs.letterSpacing,
      textShadow: p2cs.textShadow,
      containerTransform: el.style.transform,
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
      spans
    };
  });
  console.log('Phase 2 Info:', JSON.stringify(phase2Info, null, 2));

  await page.screenshot({ path: 'bold_warp_phase2.png' });
  console.log('Saved bold_warp_phase2.png');

  await browser.close();
  console.log('Finished capturing bold warp screenshots!');
})();
