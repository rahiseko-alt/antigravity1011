const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait until hero is active
  console.log('Waiting for hero to be active...');
  for (let i = 0; i < 40; i++) {
    const isStarted = await page.evaluate(() => window.__properties && window.__properties.hasStarted);
    if (isStarted) break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to #home-goal (mid-page warp)
  console.log('Scrolling to mid-page warp (#home-goal)...');
  for (let i = 0; i < 60; i++) {
    await page.mouse.wheel({ deltaY: 400 });
    await new Promise(r => setTimeout(r, 30));
  }
  await new Promise(r => setTimeout(r, 1200));

  await page.screenshot({ path: 'verify_flow_6_midpage_warp.png' });
  console.log('Captured mid-page warp check screenshot!');

  await browser.close();
})();
