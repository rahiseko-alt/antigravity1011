const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));

  // Hide the video card
  await page.evaluate(() => {
    const card = document.getElementById('home-reel-container');
    if (card) {
      card.style.display = 'none';
      card.style.height = '0';
      card.style.padding = '0';
      card.style.margin = '0';
    }
  });

  // Take screenshot at top
  await page.screenshot({ path: 'verify_mobile_step0_hero.png' });

  // Scroll 1
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'verify_mobile_step1.png' });

  // Scroll 2
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'verify_mobile_step2.png' });

  // Scroll 3
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'verify_mobile_step3.png' });

  // Desktop check
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));

  await desktopPage.evaluate(() => {
    const card = document.getElementById('home-reel-container');
    if (card) {
      card.style.display = 'none';
      card.style.height = '0';
      card.style.padding = '0';
      card.style.margin = '0';
    }
  });

  for (let i = 0; i < 12; i++) {
    await desktopPage.mouse.wheel({ deltaY: 200 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1000));
  await desktopPage.screenshot({ path: 'verify_desktop_step1.png' });

  await browser.close();
  console.log('Screenshots captured successfully');
})();
