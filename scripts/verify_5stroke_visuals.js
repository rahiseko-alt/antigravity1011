const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function run() {
  console.log('=== STARTING 5-STROKE VISUAL VERIFICATION SUITE ===');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('Navigating to http://localhost:3000 (Desktop 1920x1080)...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for intro sequence settlement (~9s)...');
    await page.waitForFunction(() => {
      const gt = window.__goalTunnels;
      return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
    }, { timeout: 40000 });

    console.log('Intro settled! Verifying line mesh availability...');
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

    // Helper to scroll and wait for frames
    async function scrollAndCapture(scrollY, fileName, description) {
      console.log(`\n--- Capturing scrollY = ${scrollY} (${description}) ---`);
      const info = await page.evaluate(async (targetY) => {
        window.scrollManager.scrollToPixel(targetY, true);
        await new Promise(r => {
          let f = 0;
          function tick() {
            f++;
            if (f > 25) r();
            else requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });

        let lineInfo = null;
        window.homePage.preUfxContainer.traverse(obj => {
          if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
            lineInfo = {
              visible: obj.visible,
              containerVisible: obj.parent && obj.parent.parent ? obj.parent.parent.visible : null,
              u_showRatio: obj.material.uniforms.u_showRatio ? obj.material.uniforms.u_showRatio.value : null,
              u_radius: obj.material.uniforms.u_radius ? obj.material.uniforms.u_radius.value : null,
              u_scrollY: obj.material.uniforms.u_scrollY ? obj.material.uniforms.u_scrollY.value : null,
              positionY: obj.parent ? obj.parent.position.y : null,
              scaleY: obj.parent ? obj.parent.scale.y : null
            };
          }
        });
        return { targetY, lineInfo };
      }, scrollY);

      console.log(`Scroll ${scrollY} status:`, JSON.stringify(info, null, 2));
      await new Promise(r => setTimeout(r, 400));
      const shotPath = path.resolve(fileName);
      await page.screenshot({ path: shotPath });
      console.log(`Saved screenshot: ${shotPath}`);
      return info;
    }

    // Measure angles and trajectory details from 3D spline
    const trajectoryData = await page.evaluate(() => {
      let result = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
          if (obj.geometry && obj.geometry.attributes && obj.geometry.attributes.CP) {
            const cp = obj.geometry.attributes.CP.array;
            const cd = obj.geometry.attributes.Cd ? obj.geometry.attributes.Cd.array : null;
            const count = obj.geometry.attributes.CP.count;
            const sx = (window.innerWidth / Math.hypot(window.innerWidth, window.innerHeight)) / 0.87157;
            
            // Sample points along the spline
            const samples = [];
            for (let i = 0; i < count; i += 2) {
              const x = cp[i * 3 + 0];
              const y = cp[i * 3 + 1];
              const cdVal = cd ? cd[i] : null;
              samples.push({ index: i / 2, x, y, cd: cdVal });
            }
            result = {
              vertexCount: count,
              sx,
              samples
            };
          }
        }
      });
      return result;
    });

    if (trajectoryData) {
      console.log(`Spline vertices: ${trajectoryData.vertexCount}`);
    }

    // 1. scrollY = 30: Verify tube appears IMMEDIATELY in Hero (first scroll tick)
    await scrollAndCapture(30, 'verify_stroke0_hero_immediate_30.png', 'Immediate Hero Appearance');

    // 2. scrollY = 200: Verify Stroke 1 (Cyan/Blue) sweeps diagonally across at 45°
    await scrollAndCapture(200, 'verify_stroke1_cyan.png', 'Stroke 1: Cyan/Blue 45-degree diagonal sweep');

    // 3. scrollY = 600: Verify Stroke 2 (Neon Red, thick) enters from right slightly below Exit 1, sweeps down-left at 45°
    await scrollAndCapture(600, 'verify_stroke2_red.png', 'Stroke 2: Neon Red thick down-left 45-degree sweep');

    // 4. scrollY = 1200: Verify Stroke 3 (Emerald Green) enters from left slightly below Exit 2, sweeps down-right at 45°
    await scrollAndCapture(1200, 'verify_stroke3_green.png', 'Stroke 3: Emerald Green down-right 45-degree sweep');

    // 5. scrollY = 1800: Verify Stroke 4 (Magenta/Purple, extra thick) sweeps down-left at 45°
    await scrollAndCapture(1800, 'verify_stroke4_purple.png', 'Stroke 4: Magenta/Purple extra thick down-left 45-degree sweep');

    // 6. scrollY = 2400+: Verify Stroke 5 (Gold/Amber)
    await scrollAndCapture(2400, 'verify_stroke5_gold.png', 'Stroke 5: Gold/Amber diagonal sweep');
    await scrollAndCapture(3000, 'verify_stroke5_gold_deep_3000.png', 'Stroke 5: Deep completion at scrollY 3000');

    // Mobile Verification (390x844)
    console.log('\n=== TESTING MOBILE (390x844) ===');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    console.log('Navigating mobile page to http://localhost:3000...');
    await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for mobile intro settlement (~9s)...');
    await mobilePage.waitForFunction(() => {
      const gt = window.__goalTunnels;
      return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
    }, { timeout: 40000 });

    // Scroll through mobile positions and capture verify_mobile_strokes.png
    console.log('Testing mobile scroll and capturing verify_mobile_strokes.png...');
    await mobilePage.evaluate(async () => {
      window.scrollManager.scrollToPixel(600, true);
      await new Promise(r => {
        let f = 0;
        function tick() {
          f++;
          if (f > 25) r();
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    });
    await new Promise(r => setTimeout(r, 500));
    const mobileShotPath = path.resolve('verify_mobile_strokes.png');
    await mobilePage.screenshot({ path: mobileShotPath });
    console.log(`Saved mobile screenshot: ${mobileShotPath}`);

    // Additional mobile check at 1400
    await mobilePage.evaluate(async () => {
      window.scrollManager.scrollToPixel(1400, true);
      await new Promise(r => {
        let f = 0;
        function tick() {
          f++;
          if (f > 25) r();
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    });
    await new Promise(r => setTimeout(r, 500));
    await mobilePage.screenshot({ path: path.resolve('verify_mobile_strokes_mid.png') });

    await mobilePage.close();
    await page.close();
    await browser.close();

    console.log('\n=== 5-STROKE VISUAL VERIFICATION COMPLETE ===');
  } catch (err) {
    console.error('Verification error:', err);
    await browser.close();
    process.exit(1);
  }
}

run();
