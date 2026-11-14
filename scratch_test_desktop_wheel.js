const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 20000 });
  await new Promise(r => setTimeout(r, 1000));

  async function scrollTo(targetPixel, label) {
    console.log(`Scrolling to ~${targetPixel} for ${label}...`);
    let current = await page.evaluate(() => window.scrollManager.scrollPixel);
    while (current < targetPixel - 50) {
      const step = Math.min(300, targetPixel - current);
      await page.mouse.wheel({ deltaY: step });
      await new Promise(r => setTimeout(r, 30));
      current = await page.evaluate(() => window.scrollManager.scrollPixel);
    }
    await new Promise(r => setTimeout(r, 500));
    const finalScroll = await page.evaluate(() => ({
      scrollPixel: window.scrollManager.scrollPixel,
      showRatio: window.homeReel?.lineVisual?.mesh?.material?.uniforms?.u_showRatio?.value,
      visible: window.homeReel?.lineVisual?.container?.visible,
      pos: window.homeReel?.lineVisual?.innerContainer?.position
    }));
    console.log(`At ${label}:`, finalScroll);
    await page.screenshot({ path: `desktop_wheel_${label}.png` });
  }

  await scrollTo(1000, 'reel');
  await scrollTo(2200, 'card1_2');
  await scrollTo(3400, 'card3_4');
  await scrollTo(4600, 'card5_6');
  await scrollTo(5350, 'cta_btn');
  await scrollTo(6000, 'members');

  await browser.close();
})();
