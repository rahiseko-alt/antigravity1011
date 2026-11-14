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
    document.body.style.overflow = '';
    const wo = document.getElementById('intro-whiteout'); if (wo) wo.remove();
    const it = document.getElementById('intro-warp-title'); if (it) it.remove();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Reel の見出し「場をつくる」が画面の中央（Y=200〜400）に来るようにホイールスクロールする
  for (let i = 0; i < 5; i++) {
    await page.mouse.wheel({ deltaY: 100 });
    await new Promise(r => setTimeout(r, 100));
  }
  await new Promise(r => setTimeout(r, 500));

  const info1 = await page.evaluate(() => {
    const title = document.getElementById('home-reel-title');
    const r = title ? title.getBoundingClientRect() : null;
    return { top: r?.top, sp: window.scrollManager.scrollPixel };
  });
  console.log('Wheel 500px:', info1);
  await page.screenshot({ path: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86\\reel_in_view_1.png' });

  // もう少しスクロール
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel({ deltaY: 100 });
    await new Promise(r => setTimeout(r, 100));
  }
  await new Promise(r => setTimeout(r, 500));

  const info2 = await page.evaluate(() => {
    const title = document.getElementById('home-reel-title');
    const r = title ? title.getBoundingClientRect() : null;
    return { top: r?.top, sp: window.scrollManager.scrollPixel };
  });
  console.log('Wheel 900px:', info2);
  await page.screenshot({ path: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86\\reel_in_view_2.png' });

  await browser.close();
}

test().catch(console.error);
