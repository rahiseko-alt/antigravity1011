const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getLineState(page) {
  return await page.evaluate(() => {
    let lv = null;
    if (window.__lineReel && window.__lineReel.lineVisual) {
      lv = window.__lineReel.lineVisual;
    } else if (window.homePage && window.homePage.preUfxContainer) {
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius && obj.material.uniforms.u_showRatio) {
          lv = {
            mesh: obj,
            container: obj.parent && obj.parent.parent ? obj.parent.parent : obj.parent
          };
        }
      });
    }

    if (!lv || !lv.mesh) {
      return { error: 'Line visual not found' };
    }

    const uniforms = lv.mesh.material.uniforms;
    return {
      u_showRatio: uniforms.u_showRatio ? uniforms.u_showRatio.value : null,
      u_scrollY: uniforms.u_scrollY ? uniforms.u_scrollY.value : null,
      meshVisible: lv.mesh.visible,
      containerVisible: lv.container ? lv.container.visible : null,
      scrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : window.scrollY
    };
  });
}

async function scrollToAndCapture(page, scrollY, filename, deviceLabel) {
  console.log(`\n[${deviceLabel}] Scrolling to scrollY: ${scrollY}...`);
  await page.evaluate(async (targetY) => {
    if (window.scrollManager && window.scrollManager.scrollToPixel) {
      window.scrollManager.scrollToPixel(targetY, true);
    } else {
      window.scrollTo(0, targetY);
    }

    // Allow render loop to update Three.js uniforms and draw frames
    for (let f = 0; f < 35; f++) {
      await new Promise(r => requestAnimationFrame(r));
    }
  }, scrollY);

  await sleep(400);

  const state = await getLineState(page);
  console.log(`[${deviceLabel} @ scrollY=${scrollY}] State:`, JSON.stringify(state, null, 2));

  const shotPath = path.resolve(process.cwd(), filename);
  await page.screenshot({ path: shotPath, fullPage: false });
  console.log(`Captured screenshot: ${shotPath}`);

  return { scrollY, state, shotPath };
}

(async () => {
  console.log('=== MULTI-DEVICE 3D LINE VISUAL VERIFICATION ===');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const results = {
    mobile: [],
    desktop: []
  };

  try {
    // 1. MOBILE TEST (390x844, deviceScaleFactor: 2, isMobile: true, hasTouch: true)
    console.log('\n=========================================');
    console.log('1. TESTING MOBILE VIEWPORT (390 x 844)');
    console.log('=========================================');
    const mobilePage = await browser.newPage();
    await mobilePage.setCacheEnabled(false);
    await mobilePage.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });

    console.log('Navigating to http://localhost:3000 on Mobile...');
    await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for Hero to settle (r >= 9.0s)...');
    await mobilePage.waitForFunction(() => {
      const gt = window.__goalTunnels;
      return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
    }, { timeout: 45000 });
    console.log('Hero settled on Mobile!');

    const mobileScrollPoints = [800, 1100, 1500, 1900, 2400, 2800];
    for (const sy of mobileScrollPoints) {
      const res = await scrollToAndCapture(mobilePage, sy, `mobile_line_${sy}.png`, 'Mobile');
      results.mobile.push(res);
    }
    await mobilePage.close();

    // 2. DESKTOP TEST (1920x1080, deviceScaleFactor: 1)
    console.log('\n=========================================');
    console.log('2. TESTING DESKTOP VIEWPORT (1920 x 1080)');
    console.log('=========================================');
    const desktopPage = await browser.newPage();
    await desktopPage.setCacheEnabled(false);
    await desktopPage.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1
    });

    console.log('Navigating to http://localhost:3000 on Desktop...');
    await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for Hero to settle (r >= 9.0s)...');
    await desktopPage.waitForFunction(() => {
      const gt = window.__goalTunnels;
      return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
    }, { timeout: 45000 });
    console.log('Hero settled on Desktop!');

    const desktopScrollPoints = [900, 1300, 1800, 2300, 2900];
    for (const sy of desktopScrollPoints) {
      const res = await scrollToAndCapture(desktopPage, sy, `desktop_line_${sy}.png`, 'Desktop');
      results.desktop.push(res);
    }
    await desktopPage.close();

    console.log('\n=== ALL CAPTURES COMPLETE ===');
    fs.writeFileSync('scripts/line_verification_results.json', JSON.stringify(results, null, 2));
    console.log('Saved line_verification_results.json');

  } catch (err) {
    console.error('Error during line verification:', err);
  } finally {
    await browser.close();
  }
})();
