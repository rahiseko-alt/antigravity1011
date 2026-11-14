import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000/';

const VIEWPORTS = [
  { name: 'sp_375x667', width: 375, height: 667, isMobile: true },
  { name: 'sp_390x844', width: 390, height: 844, isMobile: true },
  { name: 'sp_414x896', width: 414, height: 896, isMobile: true },
  { name: 'tablet_768x1024', width: 768, height: 1024, isMobile: false },
  { name: 'pc_1280x800', width: 1280, height: 800, isMobile: false },
  { name: 'pc_1440x900', width: 1440, height: 900, isMobile: false },
  { name: 'pc_1920x1080', width: 1920, height: 1080, isMobile: false },
];

const auditResults = {
  consoleErrors: [],
  consoleWarnings: [],
  webglErrors: [],
  viewports: {},
  scrollBehavior: {},
  visualChecks: {},
};

async function runAudit() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
  });

  console.log('=== RED TEAM AUDIT STARTED ===');

  try {
    // 1. 各ビューポートでのロード＆チューブ描画・セクション構成の検証
    for (const vp of VIEWPORTS) {
      console.log(`Auditing viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });

      const pageErrors = [];
      const pageWarnings = [];
      page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error') {
          pageErrors.push(text);
        } else if (type === 'warning') {
          pageWarnings.push(text);
        }
      });
      page.on('pageerror', err => {
        pageErrors.push(err.toString());
      });

      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

      // オープニングスキップ
      await page.evaluate(() => {
        if (window.__unlockNow) window.__unlockNow();
      });
      await new Promise(r => setTimeout(r, 1200));

      // ヒーロー初期状態のスクリーンショット
      const heroPath = `audit_${vp.name}_01_hero.png`;
      await page.screenshot({ path: heroPath });

      // バルーンブロックの色を検査（真っ黒になっていないか）
      const heroBalloonsInfo = await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return { error: 'No canvas found' };
        // WebGLからピクセルサンプリング可能か、あるいはCSS/WebGL背景色
        return {
          bgHex: window.properties ? window.properties.bgColorHex : null,
          isBlackBg: document.documentElement.classList.contains('is-black-bg'),
          isWhiteBg: document.documentElement.classList.contains('is-white-bg'),
          scroll: window.scrollManager ? window.scrollManager.scroll : 0,
        };
      });

      // Reelセクション（チューブ登場箇所）へスクロール
      // 各セクションの位置を取得
      const sectionsInfo = await page.evaluate(() => {
        const sections = Array.from(document.querySelectorAll('section, [data-section], #reel, .c-reel, [class*="reel"]'));
        return sections.map(s => ({
          tag: s.tagName,
          id: s.id,
          className: s.className,
          top: s.getBoundingClientRect().top + window.scrollY,
          height: s.offsetHeight,
        }));
      });

      // スクロールマネージャ経由で Reel または 1500px 付近へスクロール
      await page.evaluate(() => {
        if (window.scrollManager) {
          window.scrollManager.scroll = 1200;
          window.scrollManager.target = 1200;
        } else {
          window.scrollTo(0, 1200);
        }
      });
      await new Promise(r => setTimeout(r, 800));

      const reelPath = `audit_${vp.name}_02_reel_tube.png`;
      await page.screenshot({ path: reelPath });

      // さらに進んで Members / Goal
      await page.evaluate(() => {
        if (window.scrollManager) {
          window.scrollManager.scroll = 3500;
          window.scrollManager.target = 3500;
        } else {
          window.scrollTo(0, 3500);
        }
      });
      await new Promise(r => setTimeout(r, 800));
      const midPath = `audit_${vp.name}_03_mid.png`;
      await page.screenshot({ path: midPath });

      // Goal / Dark 背景セクション
      await page.evaluate(() => {
        if (window.scrollManager) {
          window.scrollManager.scroll = 6200;
          window.scrollManager.target = 6200;
        } else {
          window.scrollTo(0, 6200);
        }
      });
      await new Promise(r => setTimeout(r, 800));
      const goalPath = `audit_${vp.name}_04_goal_dark.png`;
      await page.screenshot({ path: goalPath });

      auditResults.viewports[vp.name] = {
        errors: pageErrors,
        warnings: pageWarnings,
        heroBalloonsInfo,
        sectionsCount: sectionsInfo.length,
      };

      await page.close();
    }

    // 2. スクロール挙動＆暴走リスクの厳密テスト (PC 1440x900)
    console.log('Auditing Scroll runaway risk and idle state...');
    const scrollPage = await browser.newPage();
    await scrollPage.setViewport({ width: 1440, height: 900 });
    await scrollPage.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await scrollPage.evaluate(() => {
      if (window.__unlockNow) window.__unlockNow();
    });
    await new Promise(r => setTimeout(r, 1200));

    // アイドル状態で 3 秒放置して scroll が勝手に増えないか検証
    const idleStartScroll = await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.scroll : window.scrollY);
    await new Promise(r => setTimeout(r, 3000));
    const idleEndScroll = await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.scroll : window.scrollY);
    const isAutoScrolling = Math.abs(idleEndScroll - idleStartScroll) > 1;

    // ホイール微細スクロール / 高速スクロール / リバーススクロールのテスト
    const scrollPositions = [];
    for (let i = 0; i < 5; i++) {
      await scrollPage.mouse.wheel({ deltaY: 200 });
      await new Promise(r => setTimeout(r, 150));
      const pos = await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.scroll : window.scrollY);
      scrollPositions.push(pos);
    }
    // 急激なリバーススクロール
    for (let i = 0; i < 5; i++) {
      await scrollPage.mouse.wheel({ deltaY: -200 });
      await new Promise(r => setTimeout(r, 150));
      const pos = await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.scroll : window.scrollY);
      scrollPositions.push(pos);
    }

    auditResults.scrollBehavior = {
      idleStartScroll,
      idleEndScroll,
      isAutoScrolling,
      reverseScrollTrajectory: scrollPositions,
    };

    // 3. チューブのZ-index、可読性、先端キャップの精密画像検査
    // Reelセクションのスクロール位置を微調整しながら先端キャップとチューブをクローズアップ撮影
    console.log('Auditing Tube and Cap alignment...');
    await scrollPage.evaluate(() => {
      if (window.scrollManager) {
        window.scrollManager.scroll = 1400;
        window.scrollManager.target = 1400;
      }
    });
    await new Promise(r => setTimeout(r, 600));
    await scrollPage.screenshot({ path: 'audit_tube_closeup_1400.png' });

    await scrollPage.evaluate(() => {
      if (window.scrollManager) {
        window.scrollManager.scroll = 1800;
        window.scrollManager.target = 1800;
      }
    });
    await new Promise(r => setTimeout(r, 600));
    await scrollPage.screenshot({ path: 'audit_tube_closeup_1800.png' });

    // 4. セクション構造とテキスト可読性（DOMツリーの完全性）
    const domStructure = await scrollPage.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      const headers = Array.from(document.querySelectorAll('h1, h2, h3, header, nav, footer, section')).map(el => ({
        tag: el.tagName,
        id: el.id,
        className: el.className,
        text: el.innerText ? el.innerText.substring(0, 60).replace(/\n/g, ' ') : '',
        zIndex: window.getComputedStyle(el).zIndex,
        position: window.getComputedStyle(el).position,
      }));
      return headers;
    });

    auditResults.domStructure = domStructure;

    await scrollPage.close();
  } catch (err) {
    console.error('Audit encountered error:', err);
    auditResults.auditError = err.toString();
  } finally {
    await browser.close();
  }

  fs.writeFileSync('red_team_audit_results.json', JSON.stringify(auditResults, null, 2));
  console.log('=== RED TEAM AUDIT COMPLETE. Results saved to red_team_audit_results.json ===');
}

runAudit();
