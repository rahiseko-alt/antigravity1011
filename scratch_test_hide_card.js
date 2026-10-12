const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  // Test mobile (390x844)
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  // Scenario 1: Hide only #home-reel-container
  await page.evaluate(() => {
    const card = document.getElementById('home-reel-container');
    if (card) card.style.display = 'none';
    // Also if ufxMesh exists
    if (window.homeReelSection && window.homeReelSection.ufxMesh) {
      window.homeReelSection.ufxMesh.visible = false;
    }
  });

  // Scroll down to where reel is
  for (let i = 0; i < 15; i++) {
    await page.mouse.wheel({ deltaY: 250 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'test_hide_video_card_mobile_1.png' });

  // Scroll slightly more
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel({ deltaY: 250 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'test_hide_video_card_mobile_2.png' });

  // Also desktop view
  await page.setViewport({ width: 1440, height: 900 });
  await page.screenshot({ path: 'test_hide_video_card_desktop.png' });

  await browser.close();
  console.log('Saved test screenshots for hidden video card');
})();
