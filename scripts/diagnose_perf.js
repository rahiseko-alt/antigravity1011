const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.toString()));

  console.log('Navigating to live site...');
  const t0 = Date.now();
  await page.goto('https://rahiseko-alt.github.io/antigravity1011/', { waitUntil: 'domcontentloaded' });
  console.log('DOM loaded in ' + (Date.now() - t0) + ' ms');

  await page.evaluate(() => {
    window.__fpsRecords = [];
    let last = performance.now();
    function tick() {
      const now = performance.now();
      const delta = now - last;
      last = now;
      window.__fpsRecords.push(delta);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  for (let i = 1; i <= 8; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const stats = await page.evaluate(() => {
      const rec = window.__fpsRecords ? window.__fpsRecords.slice(-60) : [];
      const avgDelta = rec.length ? rec.reduce((a, b) => a + b, 0) / rec.length : 0;
      return {
        fps: avgDelta ? Math.round(1000 / avgDelta) : 0,
        isIntroWarp: window.properties ? window.properties.isIntroWarp : null,
        scrollActive: window.__scrollManager ? window.__scrollManager.isActive : null,
        scrollPixel: window.__scrollManager ? window.__scrollManager.scrollPixel : null
      };
    });
    console.log('Sec ' + i + ': FPS=' + stats.fps + ', isIntroWarp=' + stats.isIntroWarp + ', scrollActive=' + stats.scrollActive + ', scrollPixel=' + stats.scrollPixel);
  }

  // Now test mouse wheel scroll
  console.log('Testing wheel scroll...');
  await page.mouse.wheel({ deltaY: 1000 });
  await new Promise(r => setTimeout(r, 1000));
  const afterScroll = await page.evaluate(() => {
    return {
      scrollPixel: window.__scrollManager ? window.__scrollManager.scrollPixel : null,
      scrollY: window.__scrollManager ? window.__scrollManager.scrollY : null,
      targetY: window.__scrollManager ? window.__scrollManager.targetY : null,
      bodyScrollTop: document.documentElement.scrollTop || document.body.scrollTop
    };
  });
  console.log('After wheel:', JSON.stringify(afterScroll));

  console.log('Errors logged (' + errors.length + '):', errors);

  await browser.close();
})();
