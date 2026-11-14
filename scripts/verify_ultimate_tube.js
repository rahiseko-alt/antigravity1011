const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== STARTING ULTIMATE TUBE VERIFICATION SUITE ===');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  // Helper function to capture a device suite
  async function runDeviceSuite(devName, width, height, isMobile, checkpoints) {
    console.log(`\n========================================`);
    console.log(`TESTING ${devName.toUpperCase()} (${width}x${height})`);
    console.log(`========================================`);

    const page = await browser.newPage();
    if (isMobile) {
      await page.setViewport({ width, height, isMobile: true, hasTouch: true });
    } else {
      await page.setViewport({ width, height });
    }

    console.log(`Navigating to http://localhost:3000 on ${devName}...`);
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for intro sequence settlement (~8.5s)...');
    await page.waitForFunction(() => {
      const gt = window.__goalTunnels;
      const sm = window.scrollManager;
      return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 8.5 && sm && sm.isActive;
    }, { timeout: 45000 });
    console.log('Intro settled and scrollManager is active!');

    // Wait extra small tick
    await new Promise(r => setTimeout(r, 600));

    for (const cp of checkpoints) {
      console.log(`\n[${devName}] Scrolling to target ${cp.target} (${cp.name})...`);
      
      const info = await page.evaluate(async (targetY) => {
        window.scrollManager.scrollToPixel(targetY, true);
        
        // Wait 35 animation frames for Three.js render loop
        for (let f = 0; f < 35; f++) {
          await new Promise(r => requestAnimationFrame(r));
        }

        let l0 = window.__line0;
        let lineInfo = null;
        if (l0 && l0.mesh) {
          lineInfo = {
            meshVisible: l0.mesh.visible,
            containerVisible: l0.container ? l0.container.visible : null,
            u_showRatio: l0.mesh.material && l0.mesh.material.uniforms && l0.mesh.material.uniforms.u_showRatio ? l0.mesh.material.uniforms.u_showRatio.value : null,
            scrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : null
          };
        }
        return lineInfo;
      }, cp.target);

      await new Promise(r => setTimeout(r, 300));
      const shotName = `ultimate_${devName.toLowerCase()}_${cp.name}.png`;
      await page.screenshot({ path: shotName, fullPage: false });
      console.log(`Saved screenshot: ${shotName}`);
      console.log(`Line state at ${cp.target}:`, info);
    }

    await page.close();
  }

  // 1. DESKTOP CHECKPOINTS
  const desktopCheckpoints = [
    { target: 1200, name: '01_reel_arch' },
    { target: 2200, name: '02_card1_flagship' },
    { target: 3300, name: '03_cards2_3_initiatives' },
    { target: 4100, name: '04_cards4_5_initiatives' },
    { target: 4700, name: '05_card6_initiatives' },
    { target: 5350, name: '06_blue_cta_button' },
    { target: 6000, name: '07_members_behind_cards' },
    { target: 6700, name: '08_members_goal_landing' }
  ];

  // 2. MOBILE CHECKPOINTS
  const mobileCheckpoints = [
    { target: 900,  name: '01_reel_arch' },
    { target: 1800, name: '02_card1_flagship' },
    { target: 2500, name: '03_card2_3' },
    { target: 3100, name: '04_card4_5' },
    { target: 3600, name: '05_card6' },
    { target: 3950, name: '06_blue_cta_button' },
    { target: 4700, name: '07_members_behind_cards' },
    { target: 5600, name: '08_members_goal_landing' }
  ];

  try {
    await runDeviceSuite('desktop', 1920, 1080, false, desktopCheckpoints);
    await runDeviceSuite('mobile', 390, 844, true, mobileCheckpoints);
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await browser.close();
    console.log('\n=== ULTIMATE TUBE VERIFICATION COMPLETE ===');
  }
})();
