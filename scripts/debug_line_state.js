const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 25000 });
  await new Promise(r => setTimeout(r, 1000));

  for (const s of [1000, 2000, 3000, 4000, 5000, 6000]) {
    await page.evaluate((target) => {
      window.scrollManager.scrollPixel = target;
      window.scrollManager.targetScrollPixel = target;
      window.scrollTo(0, target);
    }, s);
    await new Promise(r => setTimeout(r, 400));

    const state = await page.evaluate(() => {
      // Find lineVisual inside window or scenes
      let lineObj = null;
      window.visuals?.stage3DList?.forEach(v => {
        if (v?.lineVisual) lineObj = v.lineVisual;
      });
      if (!lineObj && window.homeReelSection?.lineVisual) lineObj = window.homeReelSection.lineVisual;
      
      // Let's also traverse homePage.preUfxContainer
      let meshObj = null;
      let circleObj = null;
      window.homePage?.preUfxContainer?.traverse(o => {
        if (o.isMesh && o.material?.defines?.IS_LINE) meshObj = o;
        if (o.isMesh && o.geometry?.type === 'PlaneGeometry') circleObj = o;
      });

      return {
        scrollPixel: window.scrollManager.scrollPixel,
        containerParent: meshObj?.parent?.parent ? true : false,
        containerVisible: meshObj?.parent?.parent?.visible,
        innerPos: meshObj?.parent?.position,
        innerScale: meshObj?.parent?.scale,
        meshVisible: meshObj?.visible,
        showRatio: meshObj?.material?.uniforms?.u_showRatio?.value,
        radius: meshObj?.material?.uniforms?.u_radius?.value,
        circlePos: circleObj?.position,
        circleVisible: circleObj?.visible
      };
    });
    console.log(`Scroll ${s}:`, JSON.stringify(state, null, 2));
  }

  await browser.close();
})();
