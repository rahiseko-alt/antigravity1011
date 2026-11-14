const puppeteer = require('puppeteer-core');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== STARTING EXACT SCREEN VERIFICATION (390x844) ===');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=390,844']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6500));

  const items = [
    { id: 'card3_sns', scroll: 2396, label: 'Card 3 (SNS運用の自動化)' },
    { id: 'card4_bot', scroll: 2724, label: 'Card 4 (自社特化型AIチャットボット)' },
    { id: 'card5_medical', scroll: 3054, label: 'Card 5 (音声カルテ作成アプリ)' },
    { id: 'card6_docs', scroll: 3382, label: 'Card 6 (書類業務の半自動化アプリ)' },
    { id: 'blue_button', scroll: 3595, label: '青ボタン (企画を提案する / 参加する)' },
    { id: 'members_title', scroll: 3806, label: 'メンバー見出し (AIueoを動かすプレイヤーたち)' },
    { id: 'member01_kosehira', scroll: 4218, label: 'メンバー01 (小齊平 恒平)' },
    { id: 'member02_ito', scroll: 4729, label: 'メンバー02 (伊藤 良二)' },
    { id: 'member03_sakai', scroll: 5242, label: 'メンバー03 (堺 彬)' },
    { id: 'member04_okamoto', scroll: 5756, label: 'メンバー04 (岡本 ジュンイチ)' }
  ];

  for (const it of items) {
    await page.evaluate((px) => {
      window.scrollManager.scrollToPixel(px, true);
    }, it.scroll);
    await new Promise(r => setTimeout(r, 600));

    const path = `perfect_mobile_${it.id}.png`;
    await page.screenshot({ path });
    console.log(`Saved screenshot: ${path} for ${it.label}`);
  }

  await browser.close();
  console.log('=== EXACT SCREEN VERIFICATION DONE ===');
})();
