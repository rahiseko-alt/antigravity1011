const puppeteer = require('puppeteer-core');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== VERIFYING & CAPTURING VIBRANT EXPRESSIVE TUBE ===');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=1920,1080']
  });

  // 1. DESKTOP CAPTURES
  console.log('\n--- 1. DESKTOP SUITE (1920x1080) ---');
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('Navigating desktop page...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6500)); // wait for intro to settle

  const desktopSteps = [
    { p: 1000, name: 'desktop_1_reel_arch_cyan', desc: '1. Reel Top Arch & Entry (Electric Cyan)' },
    { p: 1450, name: 'desktop_2_button_orbit_red', desc: '2. Orbiting Blue Button (Crimson Red)' },
    { p: 1950, name: 'desktop_3_grand_loop_pink', desc: '3. Grand 360 Loop-de-loop (Hot Pink / Magenta)' },
    { p: 2600, name: 'desktop_4_flagship_wave_yellow', desc: '4. Flagship Undulating Wave (Neon Yellow)' },
    { p: 3600, name: 'desktop_5_cards_wave_green', desc: '5. Event Cards Boulevard Wave (Emerald Green)' },
    { p: 4600, name: 'desktop_6_cards_weave_purple', desc: '6. Lower Cards Dynamic Weave (Deep Purple)' },
    { p: 5800, name: 'desktop_7_members_zigzag_orange', desc: '7. Core Players Member Zig-Zag (Sunset Orange)' },
    { p: 6500, name: 'desktop_8_goal_flourish_flame', desc: '8. Goal Outro Flourish Landing (Radiant Flame)' }
  ];

  for (const step of desktopSteps) {
    await page.evaluate((px) => {
      window.scrollManager.scrollToPixel(px, true);
    }, step.p);
    await new Promise(r => setTimeout(r, 700));

    const filename = `vibrant_${step.name}.png`;
    await page.screenshot({ path: filename });
    console.log(`[DESKTOP] Pixel ${step.p}: Saved ${filename} - ${step.desc}`);
  }

  // 2. MOBILE CAPTURES
  console.log('\n--- 2. MOBILE SUITE (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6500));

  const mobileSteps = [
    { p: 900,  name: 'mobile_1_reel_arch_cyan', desc: '1. Reel Arch (Electric Cyan)' },
    { p: 1350, name: 'mobile_2_button_orbit_red', desc: '2. Button Orbit (Crimson Red)' },
    { p: 1850, name: 'mobile_3_grand_loop_pink', desc: '3. Grand 360 Loop (Hot Pink)' },
    { p: 2600, name: 'mobile_4_flagship_wave_yellow', desc: '4. Flagship Wave (Neon Yellow)' },
    { p: 3800, name: 'mobile_5_cards_wave_green', desc: '5. Cards Wave (Emerald Green)' },
    { p: 4800, name: 'mobile_6_cards_weave_purple', desc: '6. Cards Weave (Deep Purple)' },
    { p: 5800, name: 'mobile_7_members_zigzag_orange', desc: '7. Members Zig-Zag (Sunset Orange)' },
    { p: 6300, name: 'mobile_8_goal_flourish_flame', desc: '8. Goal Flourish (Radiant Flame)' }
  ];

  for (const step of mobileSteps) {
    await mobilePage.evaluate((px) => {
      window.scrollManager.scrollToPixel(px, true);
    }, step.p);
    await new Promise(r => setTimeout(r, 700));

    const filename = `vibrant_${step.name}.png`;
    await mobilePage.screenshot({ path: filename });
    console.log(`[MOBILE] Pixel ${step.p}: Saved ${filename} - ${step.desc}`);
  }

  await browser.close();

  console.log('\n=== ALL CAPTURES COMPLETE! ===');
  console.log('Console errors encountered:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors);
  }
})();
