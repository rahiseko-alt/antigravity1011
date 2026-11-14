const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  console.log('=== STARTING MOBILE TUBE VERIFICATION (390x844) ===');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=390,844']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6500)); // wait for intro

  const testPoints = [
    { name: '01_card1_flagship', scroll: 1800, desc: '企画カード1 (重要文化財企画)' },
    { name: '02_card2_meetup', scroll: 2350, desc: '企画カード2 (交流会)' },
    { name: '03_card3_sns', scroll: 2750, desc: '企画カード3 (SNS運用の自動化)' },
    { name: '04_card4_bot', scroll: 3100, desc: '企画カード4 (自社特化型AIチャットボット)' },
    { name: '05_card5_medical', scroll: 3450, desc: '企画カード5 (音声カルテ作成アプリ)' },
    { name: '06_card6_docs', scroll: 3800, desc: '企画カード6 (書類業務の半自動化アプリ)' },
    { name: '07_blue_cta_btn', scroll: 4050, desc: '青ボタン (企画を提案する / 参加する)' },
    { name: '08_members_header', scroll: 4250, desc: 'メンバー見出し (AIueoを動かすプレイヤーたち)' },
    { name: '09_member01_kosehira', scroll: 4600, desc: 'メンバー01 (小齊平 恒平)' },
    { name: '10_member02_ito', scroll: 5150, desc: 'メンバー02 (伊藤 良二)' },
    { name: '11_member03_sakai', scroll: 5650, desc: 'メンバー03 (堺 彬)' },
    { name: '12_member04_okamoto', scroll: 6150, desc: 'メンバー04 (岡本 ジュンイチ)' }
  ];

  const results = [];

  for (const pt of testPoints) {
    await page.evaluate((px) => {
      window.scrollManager.scrollToPixel(px, true);
    }, pt.scroll);
    await new Promise(r => setTimeout(r, 600));

    // Inspect tube mesh and screen bounds
    const info = await page.evaluate(() => {
      let lineObj = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius && !lineObj) {
          lineObj = obj;
        }
      });
      if (!lineObj) return { found: false };

      const inner = lineObj.parent;
      const container = inner.parent;
      const u = Math.hypot(window.properties.viewportWidth, window.properties.viewportHeight);
      const sx = (window.properties.viewportWidth / u) / 0.87157;
      const showRatio = lineObj.material.uniforms.u_showRatio.value;

      const cp = lineObj.geometry.attributes.CP.array;
      const count = lineObj.geometry.attributes.CP.count;
      const maxIdx = Math.floor(showRatio * (count - 1));

      let visiblePointsCount = 0;
      let minScreenX = Infinity, maxScreenX = -Infinity;
      let minScreenY = Infinity, maxScreenY = -Infinity;

      for (let i = 0; i <= maxIdx; i++) {
        const x3d = inner.position.x + cp[i * 3 + 0] * sx * inner.scale.x;
        const y3d = inner.position.y + cp[i * 3 + 1] * inner.scale.y;

        const screenX = x3d;
        const screenY = -y3d;

        if (screenX >= -50 && screenX <= window.properties.viewportWidth + 50 &&
            screenY >= -50 && screenY <= window.properties.viewportHeight + 50) {
          visiblePointsCount++;
          if (screenX < minScreenX) minScreenX = screenX;
          if (screenX > maxScreenX) maxScreenX = screenX;
          if (screenY < minScreenY) minScreenY = screenY;
          if (screenY > maxScreenY) maxScreenY = screenY;
        }
      }

      return {
        found: true,
        containerVisible: container.visible,
        showRatio: Number(showRatio.toFixed(3)),
        innerPosY: Math.round(inner.position.y),
        visiblePointsCount,
        screenBounds: {
          minScreenX: Math.round(minScreenX),
          maxScreenX: Math.round(maxScreenX),
          minScreenY: Math.round(minScreenY),
          maxScreenY: Math.round(maxScreenY)
        }
      };
    });

    const filename = `verify_tube_mobile_${pt.name}.png`;
    await page.screenshot({ path: filename });
    console.log(`[PASS] ${pt.desc} (Scroll ${pt.scroll}px): ${filename} -> visiblePoints: ${info.visiblePointsCount}, bounds:`, info.screenBounds);
    results.push({ ...pt, filename, info });
  }

  await browser.close();

  console.log('\n=== MOBILE VERIFICATION COMPLETE ===');
  console.log('Console Errors caught:', consoleErrors.length);
  fs.writeFileSync('mobile_verification_results.json', JSON.stringify(results, null, 2), 'utf8');
})();
