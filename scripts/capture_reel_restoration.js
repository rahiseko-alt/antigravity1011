const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // イントロスキップ処理
  await page.evaluate(() => {
    if (window.properties) {
      window.properties.isIntroWarp = false;
    }
    if (window.scrollManager) {
      window.scrollManager.isActive = true;
    }
    document.body.style.overflow = '';
    const pc = document.getElementById('page-container');
    if (pc) pc.style.opacity = '1';
    const hd = document.getElementById('header');
    if (hd) hd.style.opacity = '1';
    const wo = document.getElementById('intro-whiteout');
    if (wo) wo.remove();
    const it = document.getElementById('intro-warp-title');
    if (it) it.remove();
    if (typeof header !== 'undefined' && header.show) header.show();
  });

  // 少し待機してレンダリングを落ち着かせる
  await new Promise(r => setTimeout(r, 1500));

  const scrollPoints = [380, 480, 580, 680, 780];
  const results = [];

  for (const sp of scrollPoints) {
    await page.evaluate((val) => {
      if (window.scrollManager && window.scrollManager.scrollToPixel) {
        window.scrollManager.scrollToPixel(val, true);
      }
    }, sp);

    // requestAnimationFrame を数回待つ
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await new Promise(r => setTimeout(r, 400));

    const state = await page.evaluate(() => {
      const line = window.__line0;
      return {
        sp: window.scrollManager ? window.scrollManager.scrollPixel : null,
        visible: line ? line.container.visible : null,
        showRatio: line && line.mesh ? line.mesh.material.uniforms.u_showRatio.value : null,
        posY: line ? line.innerContainer.position.y : null,
        posX: line ? line.innerContainer.position.x : null
      };
    });

    const outPath = path.join(artifactDir, `reel_restored_sp${sp}.png`);
    await page.screenshot({ path: outPath });
    results.push({ sp, state, outPath });
    console.log(`Captured sp=${sp}:`, state);
  }

  await browser.close();
  console.log('Done captures:', results);
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
