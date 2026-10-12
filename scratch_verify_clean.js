const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  // Mobile test
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for preloader to finish
  console.log('Waiting for preloader...');
  for (let i = 0; i < 40; i++) {
    const isStarted = await page.evaluate(() => {
      const p = window.__properties;
      return p && p.hasStarted;
    }).catch(() => false);
    if (isStarted) {
      console.log('App started!');
      break;
    }
    await new Promise(r => setTimeout(r, 250));
  }
  await new Promise(r => setTimeout(r, 1500));

  // 1. Mobile Hero
  await page.screenshot({ path: 'verify_mobile_clean_hero.png' });

  // 2. Scroll to Bold Ideas / Featured section
  console.log('Scrolling mobile...');
  for (let i = 0; i < 15; i++) {
    await page.mouse.wheel({ deltaY: 250 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'verify_mobile_clean_scrolled1.png' });

  for (let i = 0; i < 15; i++) {
    await page.mouse.wheel({ deltaY: 250 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: 'verify_mobile_clean_scrolled2.png' });

  // Desktop test
  const desktop = await browser.newPage();
  await desktop.setViewport({ width: 1440, height: 900 });
  desktop.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  desktop.on('pageerror', err => consoleErrors.push(err.message));

  await desktop.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Waiting for desktop preloader...');
  for (let i = 0; i < 40; i++) {
    const isStarted = await desktop.evaluate(() => {
      const p = window.__properties;
      return p && p.hasStarted;
    }).catch(() => false);
    if (isStarted) break;
    await new Promise(r => setTimeout(r, 250));
  }
  await new Promise(r => setTimeout(r, 1500));

  await desktop.screenshot({ path: 'verify_desktop_clean_hero.png' });

  for (let i = 0; i < 15; i++) {
    await desktop.mouse.wheel({ deltaY: 250 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1000));
  await desktop.screenshot({ path: 'verify_desktop_clean_scrolled1.png' });

  for (let i = 0; i < 15; i++) {
    await desktop.mouse.wheel({ deltaY: 250 });
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 1000));
  await desktop.screenshot({ path: 'verify_desktop_clean_scrolled2.png' });

  await browser.close();

  console.log('Console Errors:', consoleErrors);
  console.log('Done verifying cleanly!');
})();
