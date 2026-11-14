const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--enable-webgl',
      '--window-size=390,844'
    ]
  });

  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    console.log('Navigating to http://127.0.0.1:3000...');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('Navigation completed.');

    // 3. 自動で勝手にスクロールされないか（ロード後数秒間静止してscrollPixelが0のままか）確認
    console.log('Waiting and monitoring scroll position for 4 seconds after load...');
    const scrollHistory = [];
    for (let i = 0; i < 8; i++) {
      await new Promise(r => setTimeout(r, 500));
      const pos = await page.evaluate(() => {
        const sm = window.scrollManager;
        return {
          scrollPixel: sm ? sm.scrollPixel : null,
          targetScrollPixel: sm ? sm.targetScrollPixel : null,
          scrollY: window.scrollY,
          isActive: sm ? sm.isActive : false
        };
      });
      scrollHistory.push({ timeMs: (i + 1) * 500, ...pos });
    }

    console.log('Scroll history during first 4 seconds:');
    console.log(JSON.stringify(scrollHistory, null, 2));

    // Wait extra 2 seconds for 3D balloons / canvas rendering
    await new Promise(r => setTimeout(r, 2000));

    // 1. ページロード直後（scrollPixel = 0）のヒーローセクション
    const heroInfo = await page.evaluate(() => {
      const el = document.querySelector('#home-hero-visual-container');
      if (!el) return { found: false };
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const canvasList = Array.from(document.querySelectorAll('canvas')).map(c => ({
        id: c.id,
        className: c.className,
        width: c.width,
        height: c.height,
        rect: c.getBoundingClientRect()
      }));
      return {
        found: true,
        rect: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
        backgroundColor: style.backgroundColor,
        opacity: style.opacity,
        display: style.display,
        visibility: style.visibility,
        canvasList
      };
    });
    console.log('Hero section info:', JSON.stringify(heroInfo, null, 2));

    const sp0Path = path.join(outDir, 'mobile_sp_0.png');
    await page.screenshot({ path: sp0Path });
    console.log('Saved screenshot:', sp0Path);

    // 2. スクロール sp = 1000, 1800, 2500, 3200 （企画カードエリア）において背景確認
    const scrollTargets = [1000, 1800, 2500, 3200];
    const scrollResults = [];

    for (const s of scrollTargets) {
      await page.evaluate((target) => {
        if (window.scrollManager) {
          window.scrollManager.scrollPixel = target;
          window.scrollManager.targetScrollPixel = target;
        }
        window.scrollTo(0, target);
      }, s);

      await new Promise(r => setTimeout(r, 800));

      const bgInfo = await page.evaluate(() => {
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
        const warpEl = document.querySelector('#tunnel-container, .warp-tunnel, #warp-container');
        const warpStyle = warpEl ? window.getComputedStyle(warpEl) : null;
        const currentSp = window.scrollManager ? window.scrollManager.scrollPixel : null;
        return {
          currentSp,
          scrollY: window.scrollY,
          bodyBg,
          htmlBg,
          warpFound: !!warpEl,
          warpOpacity: warpStyle ? warpStyle.opacity : null,
          warpDisplay: warpStyle ? warpStyle.display : null
        };
      });

      const shotPath = path.join(outDir, `mobile_sp_${s}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`Saved screenshot for sp=${s}:`, shotPath);
      scrollResults.push({ target: s, bgInfo, shotPath });
    }

    const report = {
      scrollHistory,
      heroInfo,
      scrollResults
    };

    fs.writeFileSync(path.join(outDir, 'verification_report.json'), JSON.stringify(report, null, 2));
    console.log('ALL VERIFICATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('ERROR during verification:', err);
  } finally {
    await browser.close();
  }
})();
