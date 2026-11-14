const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TARGETS = [
  {
    mode: 'Desktop',
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
    isMobile: false,
    steps: [
      { s: 650, filename: 'verified_dt_650_reel_curve.png' },
      { s: 1800, filename: 'verified_dt_1800_card1.png' },
      { s: 2800, filename: 'verified_dt_2800_cards2_3.png' },
      { s: 4800, filename: 'verified_dt_4800_members.png' },
      { s: 5800, filename: 'verified_dt_5800_goal.png' }
    ]
  },
  {
    mode: 'Mobile',
    viewport: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    isMobile: true,
    steps: [
      { s: 550, filename: 'verified_mb_550_reel_curve.png' },
      { s: 1800, filename: 'verified_mb_1800_card1.png' },
      { s: 2800, filename: 'verified_mb_2800_cards2_3.png' },
      { s: 4800, filename: 'verified_mb_4800_members.png' },
      { s: 6000, filename: 'verified_mb_6000_goal.png' }
    ]
  }
];

async function run() {
  console.log('Launching browser...');
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

  const results = {};

  for (const target of TARGETS) {
    console.log(`\n========================================`);
    console.log(`Starting ${target.mode} testing (${target.viewport.width}x${target.viewport.height})...`);
    console.log(`========================================`);

    const page = await browser.newPage();
    await page.setViewport(target.viewport);

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`[Browser Console Error]`, msg.text());
      }
    });

    console.log('1. Navigating to http://localhost:3000/ ...');
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('2. Waiting for window.scrollManager && window.scrollManager.isActive ...');
    await page.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 20000 });

    console.log('3. Calling window.__unlockNow() and sleeping 1200ms ...');
    await page.evaluate(() => {
      if (typeof window.__unlockNow === 'function') {
        window.__unlockNow();
      } else {
        console.warn('__unlockNow is not a function');
      }
    });
    await delay(1200);

    results[target.mode] = [];

    for (const step of target.steps) {
      console.log(`\n--- Step s = ${step.s} (${step.filename}) ---`);
      
      // 4. For each s, call window.scrollManager.scrollToPixel(s, true); and sleep 600ms
      await page.evaluate((scrollVal) => {
        window.scrollManager.scrollToPixel(scrollVal, true);
      }, step.s);
      await delay(600);

      // 5. Take screenshot
      const outPath = path.resolve(__dirname, step.filename);
      await page.screenshot({ path: outPath });
      console.log(`Captured screenshot saved to: ${step.filename}`);

      // 6. Check window.__line0.circle.position, window.__line0.circle.visible, window.__line0.container.visible
      const diag = await page.evaluate((scrollVal) => {
        const l0 = window.__line0;
        const sm = window.scrollManager;
        if (!l0) {
          return { error: 'window.__line0 is undefined' };
        }

        const circlePos = l0.circle && l0.circle.position ? {
          x: Number(l0.circle.position.x.toFixed(3)),
          y: Number(l0.circle.position.y.toFixed(3)),
          z: Number(l0.circle.position.z.toFixed(3))
        } : null;

        const circleScale = l0.circle && l0.circle.scale ? {
          x: Number(l0.circle.scale.x.toFixed(3)),
          y: Number(l0.circle.scale.y.toFixed(3))
        } : null;

        const circleVisible = l0.circle ? l0.circle.visible : null;
        const containerVisible = l0.container ? l0.container.visible : null;
        const meshVisible = l0.mesh ? l0.mesh.visible : null;

        let u_showRatio = null;
        let u_radius = null;
        let u_color0 = null;
        if (l0.mesh && l0.mesh.material && l0.mesh.material.uniforms) {
          const u = l0.mesh.material.uniforms;
          if (u.u_showRatio) u_showRatio = Number(u.u_showRatio.value.toFixed(4));
          if (u.u_radius) u_radius = Number(u.u_radius.value.toFixed(4));
          if (u.u_color0 && u.u_color0.value && u.u_color0.value.getHexString) {
            u_color0 = '#' + u.u_color0.value.getHexString();
          }
        }

        return {
          targetS: scrollVal,
          currentScrollPixel: sm ? sm.scrollPixel : null,
          circlePosition: circlePos,
          circleScale: circleScale,
          circleVisible: circleVisible,
          containerVisible: containerVisible,
          meshVisible: meshVisible,
          u_showRatio: u_showRatio,
          u_radius: u_radius,
          u_color0: u_color0
        };
      }, step.s);

      console.log('Diagnostic result:', JSON.stringify(diag, null, 2));
      results[target.mode].push({
        step: step,
        diag: diag
      });
    }

    await page.close();
  }

  await browser.close();

  const reportPath = path.resolve(__dirname, 'verified_visual_results.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nVerification complete! Full report written to ${reportPath}`);
}

run().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
