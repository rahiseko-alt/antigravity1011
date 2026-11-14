const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testNormal() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // イントロを正常完了させる
  await page.evaluate(() => {
    if (window.properties) window.properties.isIntroWarp = false;
    if (window.scrollManager) window.scrollManager.isActive = true;
    document.body.style.overflow = '';
    const pc = document.getElementById('page-container'); if (pc) pc.style.opacity = '1';
    const hd = document.getElementById('header'); if (hd) hd.style.opacity = '1';
    const wo = document.getElementById('intro-whiteout'); if (wo) wo.remove();
    const it = document.getElementById('intro-warp-title'); if (it) it.remove();
  });
  await new Promise(r => setTimeout(r, 1200));

  for (const s of [0, 80, 160, 240]) {
    await page.evaluate((val) => {
      window.scrollManager.scrollToPixel(val, true);
    }, s);
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: `C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86\\reel_normal_flow_sp${s}.png` });
  }

  await browser.close();
  console.log('Captures completed!');
}

testNormal().catch(console.error);
