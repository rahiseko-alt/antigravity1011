const puppeteer = require('puppeteer-core');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const rootDir = process.cwd();

  // Helper to wait for intro
  async function waitForIntro(page) {
    console.log('Waiting for intro to settle...');
    await page.waitForFunction(() => {
      const gt = window.__goalTunnels;
      return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
    }, { timeout: 60000 });
    console.log('Intro complete.');
  }

  // Helper to scroll and wait for frames
  async function scrollTo(page, targetY, frames = 30) {
    return await page.evaluate(async (y, waitFrames) => {
      if (window.scrollManager) {
        window.scrollManager.scrollToPixel(y, true);
      } else {
        window.scrollTo(0, y);
      }
      await new Promise(resolve => {
        let count = 0;
        function step() {
          count++;
          if (count >= waitFrames) resolve();
          else requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });

      let lineInfo = null;
      if (window.homePage && window.homePage.preUfxContainer) {
        window.homePage.preUfxContainer.traverse(obj => {
          if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
            lineInfo = {
              meshVisible: obj.visible,
              parentVisible: obj.parent ? obj.parent.visible : null,
              parentParentVisible: obj.parent && obj.parent.parent ? obj.parent.parent.visible : null,
              innerPosY: obj.parent ? obj.parent.position.y : null,
              showRatio: obj.material.uniforms.u_showRatio ? obj.material.uniforms.u_showRatio.value : null,
              scrollY: window.scrollManager ? window.scrollManager.scrollPixel : window.scrollY
            };
          }
        });
      }
      return lineInfo;
    }, targetY, frames);
  }

  console.log('=== STEP 1: MOBILE QA (390x844) ===');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await waitForIntro(mobilePage);

  // 1. Mobile Journey Screenshots
  const mobilePoints = [
    { sy: 1000, filename: 'mobile_journey_1000.png', label: 'Reel, red swoop' },
    { sy: 2200, filename: 'mobile_journey_2200.png', label: 'Initiatives top, green loop' },
    { sy: 3200, filename: 'mobile_journey_3200.png', label: 'Initiatives mid-cards, purple curve' },
    { sy: 4200, filename: 'mobile_journey_4200.png', label: 'Initiatives bottom / Members, purple/gold' },
    { sy: 5000, filename: 'mobile_journey_5000.png', label: 'Members section, gold wave' }
  ];

  for (const pt of mobilePoints) {
    const info = await scrollTo(mobilePage, pt.sy, 35);
    const shotPath = path.resolve(rootDir, pt.filename);
    await mobilePage.screenshot({ path: shotPath });
    console.log(`[Mobile ${pt.sy}px] ${pt.label}: saved to ${pt.filename}`, info);
  }

  // 2. Mobile Closeup of green loop (around 2200px - 2300px)
  // Let's scroll to where green loop is centered in viewport and capture close-up
  const loopInfo = await scrollTo(mobilePage, 2200, 35);
  // Also clip the center where the loop is
  const closeupPath = path.resolve(rootDir, 'smooth_loop_mobile_closeup.png');
  await mobilePage.screenshot({
    path: closeupPath,
    clip: {
      x: 0,
      y: 150,
      width: 390,
      height: 500
    }
  });
  console.log(`[Mobile Closeup] Loop closeup saved to smooth_loop_mobile_closeup.png`, loopInfo);

  await mobilePage.close();

  console.log('\n=== STEP 2: DESKTOP QA (1920x1080) ===');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1920, height: 1080 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await waitForIntro(desktopPage);

  const desktopPoints = [
    { sy: 1500, filename: 'desktop_smooth_journey_1500.png', label: 'Reel / Initiatives entry' },
    { sy: 3000, filename: 'desktop_smooth_journey_3000.png', label: 'Initiatives cards / smooth loop' },
    { sy: 4500, filename: 'desktop_smooth_journey_4500.png', label: 'Members / Gold wave extended' }
  ];

  for (const pt of desktopPoints) {
    const info = await scrollTo(desktopPage, pt.sy, 35);
    const shotPath = path.resolve(rootDir, pt.filename);
    await desktopPage.screenshot({ path: shotPath });
    console.log(`[Desktop ${pt.sy}px] ${pt.label}: saved to ${pt.filename}`, info);
  }

  await desktopPage.close();
  await browser.close();
  console.log('\nVisual QA Completed successfully!');
})();
