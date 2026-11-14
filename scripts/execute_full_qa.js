const puppeteer = require('puppeteer-core');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== VISUAL QA SUITE: SMOOTH CURVES & EXTENDED SCROLL LIFESPAN ===');
  
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const rootDir = process.cwd();

  // Helper to wait for intro
  async function waitForIntroSettlement(page, label) {
    console.log(`[${label}] Waiting for intro sequence to complete (~9s)...`);
    await page.waitForFunction(() => {
      const gt = window.__goalTunnels;
      return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
    }, { timeout: 50000 });

    await page.waitForFunction(() => {
      let found = false;
      if (window.homePage && window.homePage.preUfxContainer) {
        window.homePage.preUfxContainer.traverse(obj => {
          if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
            found = true;
          }
        });
      }
      return found;
    }, { timeout: 15000 });
    console.log(`[${label}] Intro settled and WebGL tube mesh is ready!`);
  }

  // Helper to scroll and inspect tube
  async function scrollAndInspect(page, targetY, waitFrames = 35) {
    return await page.evaluate(async (sy, fCount) => {
      window.scrollManager.scrollToPixel(sy, true);
      await new Promise(resolve => {
        let count = 0;
        function step() {
          count++;
          if (count >= fCount) resolve();
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
              containerVisible: obj.parent && obj.parent.parent ? obj.parent.parent.visible : null,
              innerPosY: obj.parent ? obj.parent.position.y : null,
              u_showRatio: obj.material.uniforms.u_showRatio ? obj.material.uniforms.u_showRatio.value : null,
              u_radius: obj.material.uniforms.u_radius ? obj.material.uniforms.u_radius.value : null,
              u_scrollY: obj.material.uniforms.u_scrollY ? obj.material.uniforms.u_scrollY.value : null,
              actualScrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : null
            };
          }
        });
      }

      // Check section bounding rects
      const activeInitiatives = document.querySelector('#home-featured');
      const members = document.querySelector('#home-members');
      const reel = document.querySelector('#home-reel');

      return {
        targetY: sy,
        lineInfo,
        sections: {
          reelTop: reel ? reel.getBoundingClientRect().top : null,
          initiativesTop: activeInitiatives ? activeInitiatives.getBoundingClientRect().top : null,
          membersTop: members ? members.getBoundingClientRect().top : null
        }
      };
    }, targetY, waitFrames);
  }

  // ==========================================
  // MOBILE TEST (390x844 iPhone 14 Viewport)
  // ==========================================
  console.log('\n==========================================');
  console.log('1. STARTING MOBILE TESTS (390x844)');
  console.log('==========================================');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await waitForIntroSettlement(mobilePage, 'Mobile');

  // Mobile Journey Points:
  // - scrollY = 1000px (Reel, red swoop) -> mobile_journey_1000.png
  // - scrollY = 2200px (Initiatives top, green loop) -> mobile_journey_2200.png
  // - scrollY = 3200px (Initiatives mid-cards, purple curve) -> mobile_journey_3200.png
  // - scrollY = 4200px (Initiatives bottom / Members, purple/gold) -> mobile_journey_4200.png
  // - scrollY = 5000px (Members section, gold wave) -> mobile_journey_5000.png
  const mobileTests = [
    { sy: 1000, file: 'mobile_journey_1000.png', label: 'Reel, red swoop' },
    { sy: 2200, file: 'mobile_journey_2200.png', label: 'Initiatives top, green loop' },
    { sy: 3200, file: 'mobile_journey_3200.png', label: 'Initiatives mid-cards, purple curve' },
    { sy: 4200, file: 'mobile_journey_4200.png', label: 'Initiatives bottom / Members, purple/gold' },
    { sy: 5000, file: 'mobile_journey_5000.png', label: 'Members section, gold wave' }
  ];

  const mobileResults = [];
  for (const test of mobileTests) {
    const inspectResult = await scrollAndInspect(mobilePage, test.sy, 40);
    const shotPath = path.resolve(rootDir, test.file);
    await mobilePage.screenshot({ path: shotPath });
    console.log(`[Captured Mobile ${test.sy}px] ${test.label} -> ${test.file}`);
    console.log(`  Details:`, JSON.stringify(inspectResult.lineInfo));
    mobileResults.push({ ...test, ...inspectResult });
  }

  // Mobile Close-up of Stroke 3 Green Loop (near 2200px)
  // Let's scroll to 2200px, inspect where the loop is, and capture close-up
  console.log('\n--- Capturing CLOSE-UP of green loop on mobile ---');
  await scrollAndInspect(mobilePage, 2200, 40);
  const closeupPath = path.resolve(rootDir, 'smooth_loop_mobile_closeup.png');
  await mobilePage.screenshot({
    path: closeupPath,
    clip: {
      x: 20,
      y: 120,
      width: 350,
      height: 480
    }
  });
  console.log(`[Captured Mobile Close-up] -> smooth_loop_mobile_closeup.png`);

  await mobilePage.close();

  // ==========================================
  // DESKTOP TEST (1920x1080 Viewport)
  // ==========================================
  console.log('\n==========================================');
  console.log('2. STARTING DESKTOP TESTS (1920x1080)');
  console.log('==========================================');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await waitForIntroSettlement(desktopPage, 'Desktop');

  // Desktop Test Points:
  // - scrollY = 1500px -> desktop_smooth_journey_1500.png
  // - scrollY = 3000px -> desktop_smooth_journey_3000.png
  // - scrollY = 4500px -> desktop_smooth_journey_4500.png
  const desktopTests = [
    { sy: 1500, file: 'desktop_smooth_journey_1500.png', label: 'Reel / Initiatives entry' },
    { sy: 3000, file: 'desktop_smooth_journey_3000.png', label: 'Initiatives mid-cards, green/purple curves' },
    { sy: 4500, file: 'desktop_smooth_journey_4500.png', label: 'Members / Gold wave extended' }
  ];

  const desktopResults = [];
  for (const test of desktopTests) {
    const inspectResult = await scrollAndInspect(desktopPage, test.sy, 40);
    const shotPath = path.resolve(rootDir, test.file);
    await desktopPage.screenshot({ path: shotPath });
    console.log(`[Captured Desktop ${test.sy}px] ${test.label} -> ${test.file}`);
    console.log(`  Details:`, JSON.stringify(inspectResult.lineInfo));
    desktopResults.push({ ...test, ...inspectResult });
  }

  await desktopPage.close();
  await browser.close();

  console.log('\n==========================================');
  console.log('QA SUITE EXECUTION COMPLETED');
  console.log('==========================================');
})();
