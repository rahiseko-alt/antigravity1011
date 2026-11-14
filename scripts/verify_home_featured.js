const puppeteer = require('puppeteer-core');

(async () => {
  console.log('=== Capturing #home-featured with Integrated Card Images ===');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--window-size=1920,1080']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // 1. Wait for properties to initialize
  for (let i = 0; i < 40; i++) {
    const isStarted = await page.evaluate(() => window.__properties && window.__properties.hasStarted).catch(() => false);
    if (isStarted) break;
    await new Promise(r => setTimeout(r, 200));
  }

  // 2. Wait for warp sequence completion
  for (let i = 0; i < 50; i++) {
    const warpDone = await page.evaluate(() => {
      const warp = document.getElementById('warp-overlay');
      return !warp || warp.style.display === 'none';
    }).catch(() => false);
    if (warpDone) break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1500));

  // 3. Scroll to #home-featured
  console.log('Scrolling down to #home-featured...');
  for (let i = 0; i < 20; i++) {
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 50));
  }
  await new Promise(r => setTimeout(r, 1000));

  for (let i = 0; i < 20; i++) {
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 50));
  }
  await new Promise(r => setTimeout(r, 1000));

  // 4. Capture screenshot of #home-featured
  const featured = await page.$('#home-featured');
  if (featured) {
    await featured.screenshot({ path: 'home_featured_final.png' });
    console.log('Saved home_featured_final.png');
  } else {
    throw new Error('#home-featured element not found');
  }

  await browser.close();
  console.log('Verification completed successfully!');
})();
