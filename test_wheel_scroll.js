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

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6500));

  console.log('Starting smooth human scroll simulation...');
  
  let currentScroll = 0;
  let frameCount = 0;

  // Let's scroll in steps of 300px
  while (currentScroll < 7000) {
    for (let j = 0; j < 3; j++) {
      await page.mouse.wheel({ deltaY: 100 });
      await new Promise(r => setTimeout(r, 30));
    }
    await new Promise(r => setTimeout(r, 200));

    const state = await page.evaluate(() => {
      // Find line 0 in reelSection or pageExtraSections
      const sp = window.scrollManager.scrollPixel;
      return { sp };
    });

    currentScroll = state.sp;
    frameCount++;

    if (frameCount % 5 === 0) {
      const snapName = `scroll_snap_${Math.round(currentScroll)}.png`;
      await page.screenshot({ path: snapName });
      console.log(`Scroll: ${Math.round(currentScroll)} -> Saved ${snapName}`);
    }
  }

  await browser.close();
})();
