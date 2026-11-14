const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== STARTING PLAYFUL LOOPS & ROUNDED TIP VISUAL QA ===');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  try {
    // -------------------------------------------------------------
    // DESKTOP VERIFICATION (1920x1080)
    // -------------------------------------------------------------
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    console.log('Navigating Desktop to http://localhost:3000 (1920x1080)...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for intro sequence settlement (~9s)...');
    await page.waitForFunction(() => {
      const gt = window.__goalTunnels;
      return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
    }, { timeout: 45000 });

    console.log('Intro settled! Waiting for line mesh in preUfxContainer...');
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
    }, { timeout: 20000 });

    // Scroll helper
    async function scrollTo(targetY) {
      return await page.evaluate(async (targetY) => {
        window.scrollManager.scrollToPixel(targetY, true);
        await new Promise(r => {
          let f = 0;
          function tick() {
            f++;
            if (f > 30) r();
            else requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });

        let lineData = null;
        window.homePage.preUfxContainer.traverse(obj => {
          if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
            const u_showRatio = obj.material.uniforms.u_showRatio ? obj.material.uniforms.u_showRatio.value : null;
            const u_radius = obj.material.uniforms.u_radius ? obj.material.uniforms.u_radius.value : null;
            lineData = {
              visible: obj.visible,
              containerVisible: obj.parent && obj.parent.parent ? obj.parent.parent.visible : null,
              showRatio: u_showRatio,
              radius: u_radius
            };
          }
        });
        return { targetY, lineData };
      }, targetY);
    }

    // Step 3: Capture close-up of the tip at scrollY = 150px
    console.log('\n--- Step 3: Capturing tip close-up at scrollY = 150px ---');
    const scroll150 = await scrollTo(150);
    console.log('Scroll 150 info:', JSON.stringify(scroll150, null, 2));
    await sleep(400);

    // Save full view at 150px for complete spatial verification
    await page.screenshot({ path: path.resolve('verify_tip_full_150.png') });
    console.log('Saved verify_tip_full_150.png');

    // Close-up clip of the tip: in Hero section at scrollY=150, Stroke 1 leading edge is in top-left quadrant
    // Clip covering x: 50..650, y: 100..700
    await page.screenshot({
      path: path.resolve('verify_rounded_tip_closeup.png'),
      clip: { x: 50, y: 100, width: 650, height: 600 }
    });
    console.log('Saved verify_rounded_tip_closeup.png');

    // Additional ultra-focused closeup
    await page.screenshot({
      path: path.resolve('verify_rounded_tip_macro.png'),
      clip: { x: 150, y: 180, width: 450, height: 450 }
    });
    console.log('Saved verify_rounded_tip_macro.png');

    // Step 4: Capture Desktop sequence
    // Stroke 1 loop-de-loop around balloons (scrollY = 250px, 400px)
    console.log('\n--- Step 4.1: Stroke 1 loop-de-loop around balloons (250px, 400px) ---');
    await scrollTo(250);
    await sleep(400);
    await page.screenshot({ path: path.resolve('playful_stroke1_loop_250.png') });
    console.log('Saved playful_stroke1_loop_250.png');

    await scrollTo(400);
    await sleep(400);
    await page.screenshot({ path: path.resolve('playful_stroke1_loop.png') });
    console.log('Saved playful_stroke1_loop.png');

    // Stroke 2 big S-curve swoop under Reel (scrollY = 1100px)
    console.log('\n--- Step 4.2: Stroke 2 big S-curve swoop under Reel (1100px) ---');
    await scrollTo(1100);
    await sleep(400);
    await page.screenshot({ path: path.resolve('playful_stroke2_swoop.png') });
    console.log('Saved playful_stroke2_swoop.png');

    // Stroke 3 loop-de-loop between cards (scrollY = 2600px)
    console.log('\n--- Step 4.3: Stroke 3 loop-de-loop between cards (2600px) ---');
    await scrollTo(2600);
    await sleep(400);
    await page.screenshot({ path: path.resolve('playful_stroke3_loop.png') });
    console.log('Saved playful_stroke3_loop.png');

    // Stroke 4 dynamic curve (scrollY = 4100px)
    console.log('\n--- Step 4.4: Stroke 4 dynamic curve (4100px) ---');
    await scrollTo(4100);
    await sleep(400);
    await page.screenshot({ path: path.resolve('playful_stroke4_curve.png') });
    console.log('Saved playful_stroke4_curve.png');

    // Close desktop page
    await page.close();

    // -------------------------------------------------------------
    // MOBILE VERIFICATION (390x844)
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Mobile verification (390x844) ---');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    console.log('Navigating Mobile to http://localhost:3000 (390x844)...');
    await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for mobile intro settlement (~9s)...');
    await mobilePage.waitForFunction(() => {
      const gt = window.__goalTunnels;
      return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
    }, { timeout: 45000 });

    // Scroll to active stroke position on mobile (600px)
    console.log('Scrolling mobile to 600px...');
    await mobilePage.evaluate(async () => {
      window.scrollManager.scrollToPixel(600, true);
      await new Promise(r => {
        let f = 0;
        function tick() {
          f++;
          if (f > 30) r();
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    });
    await sleep(400);
    await mobilePage.screenshot({ path: path.resolve('playful_mobile_verify.png') });
    console.log('Saved playful_mobile_verify.png');

    // Additional mobile shot at 1400px
    console.log('Scrolling mobile to 1400px...');
    await mobilePage.evaluate(async () => {
      window.scrollManager.scrollToPixel(1400, true);
      await new Promise(r => {
        let f = 0;
        function tick() {
          f++;
          if (f > 30) r();
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    });
    await sleep(400);
    await mobilePage.screenshot({ path: path.resolve('playful_mobile_verify_1400.png') });
    console.log('Saved playful_mobile_verify_1400.png');

    await mobilePage.close();
    await browser.close();
    console.log('\n=== VISUAL QA CAPTURE COMPLETE ===');
  } catch (err) {
    console.error('Visual QA error:', err);
    await browser.close();
    process.exit(1);
  }
}

run();
