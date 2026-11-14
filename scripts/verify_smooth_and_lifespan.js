const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== RUNNING PUPPETEER VISUAL QA FOR SMOOTH CURVES & EXTENDED LIFESPAN ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  // 1. MOBILE VERIFICATION (iPhone 14, 390x844)
  console.log('\n--- 1. MOBILE TESTS (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForFunction(() => window.scrollManager && window.homePage, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 6500)); // wait for intro to settle

  // Test mobile scroll positions
  const mobileScrolls = [
    { y: 300, name: 'mobile_01_hero_balloon_loop' },
    { y: 1200, name: 'mobile_02_reel_red_swoop' },
    { y: 2200, name: 'mobile_03_initiatives_green_loop' },
    { y: 3400, name: 'mobile_04_initiatives_cards_purple' },
    { y: 4800, name: 'mobile_05_members_gold_wave' }
  ];

  for (const s of mobileScrolls) {
    await mobilePage.evaluate((y) => {
      window.scrollManager.scrollPixel = y;
      window.scrollTo(0, y);
    }, s.y);
    await new Promise(r => setTimeout(r, 600));

    const info = await mobilePage.evaluate(() => {
      let lineMesh = null;
      if (window.homePage && window.homePage.preUfxContainer) {
        window.homePage.preUfxContainer.traverse(obj => {
          if (obj.isMesh && obj.material && obj.material.defines && obj.material.defines.IS_LINE) {
            lineMesh = obj;
          }
        });
      }
      return {
        scrollY: window.scrollY,
        scrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : null,
        u_showRatio: lineMesh ? lineMesh.material.uniforms.u_showRatio.value : null,
        meshVisible: lineMesh ? lineMesh.visible : null,
        parentVisible: lineMesh && lineMesh.parent ? lineMesh.parent.visible : null
      };
    });

    const file = `${s.name}.png`;
    await mobilePage.screenshot({ path: file, fullPage: false });
    console.log(`[Captured] ${file} at scrollY=${s.y}px | showRatio=${info.u_showRatio ? info.u_showRatio.toFixed(3) : 'null'} | meshVis=${info.meshVisible}`);
  }

  // Also capture close-up of the green loop
  await mobilePage.evaluate(() => {
    window.scrollManager.scrollPixel = 2200;
    window.scrollTo(0, 2200);
  });
  await new Promise(r => setTimeout(r, 600));
  await mobilePage.screenshot({ path: 'mobile_green_loop_closeup.png' });
  console.log('[Captured] mobile_green_loop_closeup.png');

  // 2. DESKTOP VERIFICATION (1920x1080)
  console.log('\n--- 2. DESKTOP TESTS (1920x1080) ---');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await desktopPage.waitForFunction(() => window.scrollManager && window.homePage, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 6500));

  const desktopScrolls = [
    { y: 500, name: 'desktop_01_hero_balloon_loop' },
    { y: 1400, name: 'desktop_02_reel_red_swoop' },
    { y: 2500, name: 'desktop_03_initiatives_green_loop' },
    { y: 3800, name: 'desktop_04_initiatives_cards_purple' },
    { y: 5200, name: 'desktop_05_members_gold_wave' }
  ];

  for (const s of desktopScrolls) {
    await desktopPage.evaluate((y) => {
      window.scrollManager.scrollPixel = y;
      window.scrollTo(0, y);
    }, s.y);
    await new Promise(r => setTimeout(r, 600));

    const info = await desktopPage.evaluate(() => {
      let lineMesh = null;
      if (window.homePage && window.homePage.preUfxContainer) {
        window.homePage.preUfxContainer.traverse(obj => {
          if (obj.isMesh && obj.material && obj.material.defines && obj.material.defines.IS_LINE) {
            lineMesh = obj;
          }
        });
      }
      return {
        scrollY: window.scrollY,
        u_showRatio: lineMesh ? lineMesh.material.uniforms.u_showRatio.value : null,
        meshVisible: lineMesh ? lineMesh.visible : null
      };
    });

    const file = `${s.name}.png`;
    await desktopPage.screenshot({ path: file, fullPage: false });
    console.log(`[Captured] ${file} at scrollY=${s.y}px | showRatio=${info.u_showRatio ? info.u_showRatio.toFixed(3) : 'null'} | meshVis=${info.meshVisible}`);
  }

  await browser.close();
  console.log('\n=== VISUAL QA FINISHED SUCCESSFULLY ===');
})();
