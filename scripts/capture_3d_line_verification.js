const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== VERIFYING ELITE DESIGNER 3D LINE (DESKTOP & MOBILE) ===');

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

  // 1. DESKTOP CAPTURE (1920 x 1080)
  console.log('\n--- 1. Desktop Capture (1920x1080) ---');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  desktopPage.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('font-size:0;color:transparent')) {
      console.error('[Desktop Console Error]', msg.text());
    }
  });

  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  console.log('Waiting for hero to settle (r >= 9.0s)...');
  await desktopPage.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 45000 });

  console.log('Scrolling desktop to #home-reel...');
  const desktopState = await desktopPage.evaluate(async () => {
    window.scrollManager.scrollTo('home-reel', 0, true);

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
          showRatio: obj.material.uniforms.u_showRatio.value,
          radius: obj.material.uniforms.u_radius.value,
          color0: '#' + obj.material.uniforms.u_color0.value.getHexString(),
          color1: '#' + obj.material.uniforms.u_color1.value.getHexString(),
          margin: {
            x: obj.parent.position.x,
            y: obj.parent.position.y
          }
        };
      }
    });

    const reelRect = document.getElementById('home-reel').getBoundingClientRect();
    return { reelRect: { top: reelRect.top, height: reelRect.height }, lineInfo };
  });

  console.log('Desktop State:', JSON.stringify(desktopState, null, 2));
  await sleep(400);

  const desktopShotPath = path.resolve(process.cwd(), 'line_design_desktop.png');
  await desktopPage.screenshot({ path: desktopShotPath });
  console.log('Saved Desktop Screenshot:', desktopShotPath);
  await desktopPage.close();

  // 2. MOBILE CAPTURE (390 x 844, iPhone 12/13/14 viewport)
  console.log('\n--- 2. Mobile Capture (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  mobilePage.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('font-size:0;color:transparent')) {
      console.error('[Mobile Console Error]', msg.text());
    }
  });

  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  console.log('Waiting for hero to settle on mobile (r >= 9.0s)...');
  await mobilePage.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 45000 });

  console.log('Scrolling mobile to #home-reel...');
  const mobileState = await mobilePage.evaluate(async () => {
    window.scrollManager.scrollTo('home-reel', 0, true);

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
          showRatio: obj.material.uniforms.u_showRatio.value,
          radius: obj.material.uniforms.u_radius.value,
          color0: '#' + obj.material.uniforms.u_color0.value.getHexString(),
          color1: '#' + obj.material.uniforms.u_color1.value.getHexString()
        };
      }
    });

    const reelRect = document.getElementById('home-reel').getBoundingClientRect();
    return { reelRect: { top: reelRect.top, height: reelRect.height }, lineInfo };
  });

  console.log('Mobile State:', JSON.stringify(mobileState, null, 2));
  await sleep(400);

  const mobileShotPath = path.resolve(process.cwd(), 'line_design_mobile.png');
  await mobilePage.screenshot({ path: mobileShotPath });
  console.log('Saved Mobile Screenshot:', mobileShotPath);
  await mobilePage.close();

  await browser.close();
  console.log('\n=== ALL CAPTURES COMPLETED SUCCESSFULLY ===');
})();
