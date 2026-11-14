const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

(async () => {
  console.log('=== STARTING TUBE INSPECTION ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--ignore-certificate-errors']
  });

  const results = {};

  async function testDevice(name, width, height, isMobile) {
    console.log(`\n========================================`);
    console.log(`TESTING ${name.toUpperCase()} (${width}x${height})`);
    console.log(`========================================`);

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    page.setDefaultTimeout(120000);

    if (isMobile) {
      await page.setViewport({ width, height, isMobile: true, hasTouch: true });
    } else {
      await page.setViewport({ width, height });
    }

    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    console.log('DOMContentLoaded reached. Waiting for intro sequence to settle (~9s)...');

    await page.waitForFunction(() => {
      const gt = window.__goalTunnels;
      const sm = window.scrollManager;
      return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0 && sm && sm.isActive;
    }, { timeout: 60000 });
    console.log('Intro sequence settled!');

    await new Promise(r => setTimeout(r, 800));

    results[name] = [];

    const scrollTargets = [500, 650, 800];

    for (const sp of scrollTargets) {
      console.log(`\n[${name}] Scrolling to target sp = ${sp}...`);
      const details = await page.evaluate(async (targetY) => {
        window.scrollManager.scrollToPixel(targetY, true);

        // Wait 35 frames for Three.js render loop to update
        for (let f = 0; f < 35; f++) {
          await new Promise(r => requestAnimationFrame(r));
        }

        const reel = document.getElementById('home-reel');
        const rRect = reel ? reel.getBoundingClientRect() : null;

        const reelTitle = document.getElementById('home-reel-title');
        const tRect = reelTitle ? reelTitle.getBoundingClientRect() : null;

        const reelCta = document.getElementById('home-reel-cta');
        const ctaRect = reelCta ? reelCta.getBoundingClientRect() : null;

        let tubeInfo = null;
        let l0 = window.__line0;
        if (l0 && l0.mesh) {
          const mat = l0.mesh.material;
          tubeInfo = {
            meshVisible: l0.mesh.visible,
            containerVisible: l0.container ? l0.container.visible : null,
            u_showRatio: mat && mat.uniforms && mat.uniforms.u_showRatio ? mat.uniforms.u_showRatio.value : null,
            u_radius: mat && mat.uniforms && mat.uniforms.u_radius ? mat.uniforms.u_radius.value : null,
            u_color: mat && mat.uniforms && mat.uniforms.u_color ? mat.uniforms.u_color.value : null,
            hasLighting: mat && mat.uniforms ? Boolean(mat.uniforms.u_lightDir) : false,
            fragmentShaderSnippet: mat && mat.fragmentShader ? mat.fragmentShader.substring(0, 300) : null
          };
        }

        return {
          currentScrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : null,
          reelBounding: rRect ? { top: Math.round(rRect.top), bottom: Math.round(rRect.bottom), height: Math.round(rRect.height) } : null,
          titleBounding: tRect ? { top: Math.round(tRect.top), bottom: Math.round(tRect.bottom) } : null,
          ctaBounding: ctaRect ? { top: Math.round(ctaRect.top), bottom: Math.round(ctaRect.bottom) } : null,
          tubeInfo
        };
      }, sp);

      console.log(`[${name}] State at sp = ${sp}:`, JSON.stringify(details, null, 2));
      results[name].push({ sp, details });

      await new Promise(r => setTimeout(r, 400));

      const filename = `${name.toLowerCase()}_sp${sp}.png`;
      const fullPath = path.join(outputDir, filename);
      await page.screenshot({ path: fullPath, fullPage: false });
      console.log(`Saved screenshot to ${fullPath}`);

      // Save a local copy for viewing
      await page.screenshot({ path: filename, fullPage: false });
    }

    await page.close();
  }

  // 1. Mobile (390x844)
  await testDevice('mobile', 390, 844, true);

  // 2. PC (1440x900)
  await testDevice('pc', 1440, 900, false);

  await browser.close();
  console.log('=== COMPLETED TUBE INSPECTION ===');
  console.log('SUMMARY RESULTS:');
  console.log(JSON.stringify(results, null, 2));
})();
