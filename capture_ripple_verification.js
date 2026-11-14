const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  async function waitForPageReady(page) {
    for (let i = 0; i < 80; i++) {
      const ready = await page.evaluate(() => {
        return window.properties && window.properties.hasStarted && !window.properties.isIntroWarp;
      }).catch(() => false);
      if (ready) break;
      await sleep(200);
    }
    await sleep(800);
  }

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // 1. 静止時のCard 1 (AIアート展) の位置にスクロール
    console.log('Navigating to Card 1 (AI Art Exhibition)...');
    await page.evaluate(() => {
      const el = document.querySelector('.project-item-flagship');
      const sm = window.scrollManager;
      if (el && sm) {
        const rect = el.getBoundingClientRect();
        const current = sm.scrollPixel || 0;
        const target = current + rect.top - 100;
        sm.targetScrollPixel = target;
        sm.scrollPixel = target;
      }
    });
    await sleep(1000);
    await page.screenshot({ path: path.resolve('verified_card1_still.png') });
    console.log('Saved verified_card1_still.png');

    // 2. Card 1でのスクロール中（リップル・ぐにゃーん歪み）の瞬間をキャプチャ
    console.log('Triggering scroll ripple on Card 1...');
    // マウスホイールまたは急速なスクロール移動でリップルを励起
    await page.mouse.move(720, 500);
    // 激しくスクロール
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel({ deltaY: 250 });
      await sleep(16);
    }
    await page.screenshot({ path: path.resolve('verified_card1_scrolling_ripple.png') });
    console.log('Saved verified_card1_scrolling_ripple.png');

    await sleep(800);

    // 3. 静止時のCard 2 (AI小技) の位置にスクロール
    console.log('Navigating to Card 2 (AI Tips)...');
    await page.evaluate(() => {
      const el = document.querySelector('.project-item[data-id="oryzo_ai"]');
      const sm = window.scrollManager;
      if (el && sm) {
        const rect = el.getBoundingClientRect();
        const current = sm.scrollPixel || 0;
        const target = current + rect.top - 100;
        sm.targetScrollPixel = target;
        sm.scrollPixel = target;
      }
    });
    await sleep(1000);
    await page.screenshot({ path: path.resolve('verified_card2_still.png') });
    console.log('Saved verified_card2_still.png');

    // 4. Card 2でのスクロール中（リップル・ぐにゃーん歪み）の瞬間をキャプチャ
    console.log('Triggering scroll ripple on Card 2...');
    for (let i = 0; i < 5; i++) {
      await page.mouse.wheel({ deltaY: 250 });
      await sleep(16);
    }
    await page.screenshot({ path: path.resolve('verified_card2_scrolling_ripple.png') });
    console.log('Saved verified_card2_scrolling_ripple.png');

    // 5. スマホ（Mobile 390x844）での検証
    console.log('Verifying Mobile layout...');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(mobilePage);

    await mobilePage.evaluate(() => {
      const el = document.querySelector('.project-item-flagship');
      const sm = window.scrollManager;
      if (el && sm) {
        const rect = el.getBoundingClientRect();
        const current = sm.scrollPixel || 0;
        const target = current + rect.top - 70;
        sm.targetScrollPixel = target;
        sm.scrollPixel = target;
      }
    });
    await sleep(1000);
    await mobilePage.screenshot({ path: path.resolve('verified_mobile_card1_still.png') });
    console.log('Saved verified_mobile_card1_still.png');

    // モバイルでのスクロール慣性
    for (let i = 0; i < 5; i++) {
      await mobilePage.mouse.wheel({ deltaY: 200 });
      await sleep(16);
    }
    await mobilePage.screenshot({ path: path.resolve('verified_mobile_card1_ripple.png') });
    console.log('Saved verified_mobile_card1_ripple.png');

    await mobilePage.close();
    await page.close();

    console.log('All verification captures completed successfully!');
  } finally {
    await browser.close();
  }
})();
