const puppeteer = require('puppeteer-core');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  // 1. DESKTOP RUN (1920x1080)
  console.log('=== DESKTOP CAPTURES ===');
  const dPage = await browser.newPage();
  await dPage.setViewport({ width: 1920, height: 1080 });
  await dPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await dPage.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 25000 });
  await new Promise(r => setTimeout(r, 1200));

  const desktopSteps = [
    { target: 1200, name: '01_desktop_reel' },
    { target: 2400, name: '02_desktop_card1_flagship' },
    { target: 3400, name: '03_desktop_card2_3_initiatives' },
    { target: 4100, name: '04_desktop_card4_5_initiatives' },
    { target: 4700, name: '05_desktop_card6_initiatives' },
    { target: 5250, name: '06_desktop_blue_cta_button' },
    { target: 6100, name: '07_desktop_members_behind' },
    { target: 6900, name: '08_desktop_goal' }
  ];

  for (const step of desktopSteps) {
    let current = await dPage.evaluate(() => window.scrollManager.scrollPixel);
    while (current < step.target - 40) {
      const delta = Math.min(250, step.target - current);
      await dPage.mouse.wheel({ deltaY: delta });
      await new Promise(r => setTimeout(r, 20));
      current = await dPage.evaluate(() => window.scrollManager.scrollPixel);
    }
    await new Promise(r => setTimeout(r, 500));

    const info = await dPage.evaluate(() => {
      const line = window.homeReel?.lineVisual;
      return {
        scrollPixel: window.scrollManager.scrollPixel,
        showRatio: line?.mesh?.material?.uniforms?.u_showRatio?.value,
        visible: line?.container?.visible,
        pos: line?.innerContainer?.position,
        scale: line?.innerContainer?.scale
      };
    });
    console.log(`[${step.name}] at scrollPixel ${info.scrollPixel?.toFixed(0)}: showRatio=${info.showRatio?.toFixed(3)}, visible=${info.visible}, posY=${info.pos?.y?.toFixed(1)}, scale=(${info.scale?.x?.toFixed(1)}, ${info.scale?.y?.toFixed(1)})`);
    await dPage.screenshot({ path: `verify_${step.name}.png` });
  }
  await dPage.close();

  // 2. MOBILE RUN (390x844)
  console.log('\n=== MOBILE CAPTURES ===');
  const mPage = await browser.newPage();
  await mPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await mPage.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 25000 });
  await new Promise(r => setTimeout(r, 1200));

  const mobileSteps = [
    { target: 950,  name: '01_mobile_reel' },
    { target: 1900, name: '02_mobile_card1_flagship' },
    { target: 2500, name: '03_mobile_card2_3' },
    { target: 3100, name: '04_mobile_card4_5' },
    { target: 3600, name: '05_mobile_card6' },
    { target: 4000, name: '06_mobile_blue_cta_button' },
    { target: 5000, name: '07_mobile_members_behind' },
    { target: 6400, name: '08_mobile_goal' }
  ];

  for (const step of mobileSteps) {
    let current = await mPage.evaluate(() => window.scrollManager.scrollPixel);
    while (current < step.target - 40) {
      const delta = Math.min(200, step.target - current);
      await mPage.mouse.wheel({ deltaY: delta });
      await new Promise(r => setTimeout(r, 20));
      current = await mPage.evaluate(() => window.scrollManager.scrollPixel);
    }
    await new Promise(r => setTimeout(r, 500));

    const info = await mPage.evaluate(() => {
      const line = window.homeReel?.lineVisual;
      return {
        scrollPixel: window.scrollManager.scrollPixel,
        showRatio: line?.mesh?.material?.uniforms?.u_showRatio?.value,
        visible: line?.container?.visible,
        pos: line?.innerContainer?.position,
        scale: line?.innerContainer?.scale
      };
    });
    console.log(`[${step.name}] at scrollPixel ${info.scrollPixel?.toFixed(0)}: showRatio=${info.showRatio?.toFixed(3)}, visible=${info.visible}, posY=${info.pos?.y?.toFixed(1)}, scale=(${info.scale?.x?.toFixed(1)}, ${info.scale?.y?.toFixed(1)})`);
    await mPage.screenshot({ path: `verify_${step.name}.png` });
  }
  await mPage.close();

  await browser.close();
  console.log('\n=== ALL SCREENSHOTS SAVED SUCCESSFULLY ===');
})();
