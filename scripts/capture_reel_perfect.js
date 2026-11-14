const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // イントロスキップ
  await page.evaluate(() => {
    window.properties.isIntroWarp = false;
    window.scrollManager.isActive = true;
    window.scrollManager.scrollPixel = 0;
    window.scrollManager.scroll = 0;
    document.body.style.overflow = '';
    const wo = document.getElementById('intro-whiteout'); if (wo) wo.remove();
    const it = document.getElementById('intro-warp-title'); if (it) it.remove();
  });
  await new Promise(r => setTimeout(r, 1000));

  for (const s of [250, 350, 450, 550]) {
    await page.evaluate((val) => {
      window.scrollManager.scrollToPixel(val, true);
    }, s);
    await new Promise(r => setTimeout(r, 400));

    const info = await page.evaluate(() => {
      const el = document.getElementById('home-reel-title-line-1');
      const r = el ? el.getBoundingClientRect() : null;
      const line = window.__line0;
      return {
        textTop: r?.top,
        showRatio: line?.mesh?.material?.uniforms?.u_showRatio?.value,
        lineVisible: line?.container?.visible,
        posY: line?.innerContainer?.position?.y
      };
    });
    console.log(`sp=${s}:`, info);
    await page.screenshot({ path: `C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86\\reel_perfect_sp${s}.png` });
  }

  await browser.close();
}

test().catch(console.error);
