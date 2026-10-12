const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // 1. Preloader phase screenshot
  await page.screenshot({ path: 'verify_flow_1_preloader.png' });
  console.log('Captured preloader phase');

  // 2. Wait until digits reach near 100% or warp starts
  console.log('Waiting for warp trigger...');
  let warpStarted = false;
  for (let i = 0; i < 40; i++) {
    warpStarted = await page.evaluate(() => {
      const warp = document.getElementById('warp-overlay');
      return warp && warp.style.display === 'block';
    }).catch(() => false);

    if (warpStarted) {
      console.log('Warp overlay triggered!');
      break;
    }
    await new Promise(r => setTimeout(r, 100));
  }

  // 3. Capture warp in full action!
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'verify_flow_2_warp_action.png' });
  console.log('Captured warp in action!');

  // 4. Capture warp climax / emergence
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'verify_flow_3_warp_emergence.png' });
  console.log('Captured warp emergence!');

  // 5. Wait for warp completion -> Hero unveiled!
  console.log('Waiting for warp completion...');
  for (let i = 0; i < 30; i++) {
    const warpDone = await page.evaluate(() => {
      const warp = document.getElementById('warp-overlay');
      return !warp || warp.style.display === 'none';
    }).catch(() => false);
    if (warpDone) {
      console.log('Warp completed, hero is active!');
      break;
    }
    await new Promise(r => setTimeout(r, 150));
  }

  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'verify_flow_4_hero_unveiled.png' });
  console.log('Captured Hero screen!');

  // 6. Test scrolling down to verify virtual scroll is 100% functional
  console.log('Testing virtual scroll down...');
  for (let i = 0; i < 15; i++) {
    await page.mouse.wheel({ deltaY: 250 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'verify_flow_5_scrolled_reel.png' });
  console.log('Captured scrolled reel section!');

  console.log('Console errors:', consoleErrors);
  await browser.close();
  console.log('Verification script completed!');
})();
