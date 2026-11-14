const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function capture() {
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
    document.body.style.overflow = '';
    const wo = document.getElementById('intro-whiteout'); if (wo) wo.remove();
    const it = document.getElementById('intro-warp-title'); if (it) it.remove();
  });
  await new Promise(r => setTimeout(r, 1200));

  // 目標：#home-reel-title の top が 200px 付近になるスクロール位置を探す
  let targetSp = 500;
  for (let s = 100; s <= 1200; s += 50) {
    const top = await page.evaluate((val) => {
      window.scrollManager.scrollToPixel(val, true);
      const title = document.getElementById('home-reel-title');
      return title ? title.getBoundingClientRect().top : 9999;
    }, s);
    if (top <= 250 && top >= 50) {
      targetSp = s;
      console.log(`Found target sp: ${s}, title top: ${top}`);
      break;
    }
  }

  // targetSp の前後で撮影
  const testPoints = [targetSp - 100, targetSp, targetSp + 100, targetSp + 200];
  for (const sp of testPoints) {
    await page.evaluate((val) => {
      window.scrollManager.scrollToPixel(val, true);
    }, sp);
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: `C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86\\reel_targeted_sp${sp}.png` });
    console.log(`Saved reel_targeted_sp${sp}.png`);
  }

  await browser.close();
}

capture().catch(console.error);
