import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  console.log("Waiting 10s for opening warp to completely finish and hero to settle...");
  await new Promise(r => setTimeout(r, 10000));

  // Verify intro warp is done
  const state = await page.evaluate(() => ({
    isStarted: document.documentElement.classList.contains('is-started'),
    hasStarted: window.properties ? window.properties.hasStarted : null,
    scrollActive: window.scrollManager ? window.scrollManager.isActive : null,
    contentSize: window.scrollManager ? window.scrollManager.contentSizePixel : null
  }));
  console.log("Page runtime state:", state);

  // 1. Scroll to initiatives CTA
  // Find where .initiatives-cta-group is relative to page-container
  const ctaTop = await page.evaluate(() => {
    const el = document.querySelector('.initiatives-cta-group');
    if (!el) return null;
    let y = 0;
    let curr = el;
    while (curr && curr.id !== 'page-container') {
      y += curr.offsetTop;
      curr = curr.offsetParent;
    }
    return y;
  });
  console.log("Calculated CTA absolute top:", ctaTop);

  if (ctaTop) {
    const targetY = ctaTop - 300;
    await page.evaluate(y => {
      window.scrollManager.scrollToPixel(y, true);
    }, targetY);
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_initiatives_cta_verified.png') });
    console.log("Saved desktop_initiatives_cta_verified.png");
  }

  // 2. Scroll to home-goal (compact stance & details button)
  const goalTop = await page.evaluate(() => {
    const el = document.getElementById('home-goal');
    if (!el) return null;
    let y = 0;
    let curr = el;
    while (curr && curr.id !== 'page-container') {
      y += curr.offsetTop;
      curr = curr.offsetParent;
    }
    return y;
  });
  console.log("Calculated Goal absolute top:", goalTop);

  if (goalTop) {
    const targetY = goalTop - 150;
    await page.evaluate(y => {
      window.scrollManager.scrollToPixel(y, true);
    }, targetY);
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'desktop_compact_goal_verified.png') });
    console.log("Saved desktop_compact_goal_verified.png");
  }

  // 3. Mobile Test (390x844)
  const mobPage = await browser.newPage();
  await mobPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 10000));

  const mobCtaTop = await mobPage.evaluate(() => {
    const el = document.querySelector('.initiatives-cta-group');
    if (!el) return null;
    let y = 0;
    let curr = el;
    while (curr && curr.id !== 'page-container') {
      y += curr.offsetTop;
      curr = curr.offsetParent;
    }
    return y;
  });
  console.log("Mobile CTA absolute top:", mobCtaTop);

  if (mobCtaTop) {
    await mobPage.evaluate(y => {
      window.scrollManager.scrollToPixel(y - 200, true);
    }, mobCtaTop);
    await new Promise(r => setTimeout(r, 1200));
    await mobPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_initiatives_cta_verified.png') });
    console.log("Saved mobile_initiatives_cta_verified.png");
  }

  const mobGoalTop = await mobPage.evaluate(() => {
    const el = document.getElementById('home-goal');
    if (!el) return null;
    let y = 0;
    let curr = el;
    while (curr && curr.id !== 'page-container') {
      y += curr.offsetTop;
      curr = curr.offsetParent;
    }
    return y;
  });
  console.log("Mobile Goal absolute top:", mobGoalTop);

  if (mobGoalTop) {
    await mobPage.evaluate(y => {
      window.scrollManager.scrollToPixel(y - 100, true);
    }, mobGoalTop);
    await new Promise(r => setTimeout(r, 1200));
    await mobPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_compact_goal_verified.png') });
    console.log("Saved mobile_compact_goal_verified.png");
  }

  await browser.close();
  console.log("All verifications with 10s wait completed!");
})();
