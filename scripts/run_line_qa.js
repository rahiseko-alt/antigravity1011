const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureStage(page, scrollY, name) {
  console.log(`\n--- Capturing Stage: ${name} (scrollY: ${scrollY}) ---`);
  const info = await page.evaluate(async (targetY) => {
    window.scrollManager.scrollToPixel(targetY, true);

    // Let animation loop settle over 30 frames
    await new Promise(res => {
      let f = 0;
      function tick() {
        f++;
        if (f > 30) res();
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
          showRatio: obj.material.uniforms.u_showRatio.value,
          radius: obj.material.uniforms.u_radius.value,
          color0: '#' + obj.material.uniforms.u_color0.value.getHexString(),
          color1: '#' + obj.material.uniforms.u_color1.value.getHexString()
        };
      }
    });

    return { scrollY: window.scrollManager.scrollPixel, lineInfo };
  }, scrollY);

  console.log(`[${name}] Info:`, JSON.stringify(info, null, 2));
  await sleep(400);

  const shotPath = path.resolve(process.cwd(), `stage_${name}.png`);
  await page.screenshot({ path: shotPath });
  console.log(`Saved screenshot: ${shotPath}`);
  return { info, shotPath };
}

(async () => {
  console.log('=== STARTING RIGOROUS 3D LINE VERIFICATION ===');

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

  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('font-size:0;color:transparent')) {
      console.error('[Page Console Error]', msg.text());
      errors.push(msg.text());
    }
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for hero to settle (>= 9.0s)...');
  await page.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 35000 });

  console.log('Hero settled! Beginning multi-stage scroll captures...');

  // Stage 1: Scroll to 1080 (Reel header)
  await captureStage(page, 1080, '1_reel_header_1080');

  // Stage 2: Scroll to 1500 (Reel content / HOW IT WORKS)
  await captureStage(page, 1500, '2_reel_content_1500');

  // Stage 3: Scroll to 2100 (Transition into Active Initiatives)
  await captureStage(page, 2100, '3_initiatives_entry_2100');

  // Stage 4: Scroll to 2800 (Mid Active Initiatives cards)
  await captureStage(page, 2800, '4_initiatives_cards_2800');

  // Stage 5: Scroll to 3600 (Deep Active Initiatives cards)
  await captureStage(page, 3600, '5_initiatives_deep_3600');

  // Mobile Check (390x844)
  console.log('\n--- Mobile Viewport Test (390x844) ---');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await captureStage(page, 1080, 'mobile_reel_1080');
  await captureStage(page, 2100, 'mobile_initiatives_2100');

  await browser.close();

  console.log('\n=== VERIFICATION FINISHED ===');
  console.log('Total Console Errors:', errors.length);
})();
