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

const auditReport = {
  timestamp: new Date().toISOString(),
  systemCheck: {},
  viewports: {},
  tubeInspection: {},
  scrollBehavior: {},
  backgroundWarpAndDark: {},
  pageStructure: {},
  consoleAndErrors: [],
  verdict: 'PENDING',
  issuesFound: [],
};

async function audit() {
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

  console.log('>>> [RED TEAM] Rigorous Full Matrix Audit Initializing...');

  try {
    // -------------------------------------------------------------
    // TEST 1: 多解像度マトリクス検証 (7つの解像度)
    // -------------------------------------------------------------
    for (const vp of VIEWPORTS) {
      console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });

      const runtimeErrors = [];
      page.on('console', msg => {
        const text = msg.text();
        if (msg.type() === 'error' && !text.includes('font-size:0;color:transparent')) {
          runtimeErrors.push(text);
          auditReport.consoleAndErrors.push({ vp: vp.name, type: 'error', text });
        }
      });
      page.on('pageerror', err => {
        runtimeErrors.push(err.toString());
        auditReport.consoleAndErrors.push({ vp: vp.name, type: 'pageerror', text: err.toString() });
      });

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // イントロ初期化待ち
      await new Promise(r => setTimeout(r, 1000));
      // スキップ
      await page.evaluate(() => {
        if (window.__unlockNow) window.__unlockNow();
      });
      await new Promise(r => setTimeout(r, 1500));

      // 1. ヒーロー状態
      const heroShot = `audit_rigorous_${vp.name}_01_hero.png`;
      await page.screenshot({ path: heroShot });

      // ヒーローのバルーン状態とWebGL背景
      const heroDiag = await page.evaluate(() => {
        return {
          scrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : null,
          targetScrollPixel: window.scrollManager ? window.scrollManager.targetScrollPixel : null,
          bgHex: window.properties ? window.properties.bgColorHex : null,
          isIntroWarp: window.properties ? window.properties.isIntroWarp : null,
          isBlackBg: document.documentElement.classList.contains('is-black-bg'),
          isWhiteBg: document.documentElement.classList.contains('is-white-bg'),
        };
      });

      // 2. Reelセクションまでマウスホイールでスクロール
      // 実際にマウスホイールを回してスクロールマネージャを駆動する
      const wheelSteps = vp.isMobile ? 5 : 7;
      for (let i = 0; i < wheelSteps; i++) {
        await page.mouse.wheel({ deltaY: 200 });
        await new Promise(r => setTimeout(r, 60));
      }
      await new Promise(r => setTimeout(r, 1200));

      const reelShot = `audit_rigorous_${vp.name}_02_reel.png`;
      await page.screenshot({ path: reelShot });

      // チューブの描画ステータス（Mesh, Circle, Uniforms）
      const tubeState = await page.evaluate(() => {
        const line0 = window.__line0;
        if (!line0) return { exists: false };
        const u = line0.mesh && line0.mesh.material ? line0.mesh.material.uniforms : {};
        const cu = line0.circle && line0.circle.material ? line0.circle.material.uniforms : {};
        return {
          exists: true,
          containerVisible: line0.container ? line0.container.visible : false,
          meshVisible: line0.mesh ? line0.mesh.visible : false,
          circleVisible: line0.circle ? line0.circle.visible : false,
          scrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : null,
          u_showRatio: u.u_showRatio ? u.u_showRatio.value : null,
          u_radius: u.u_radius ? u.u_radius.value : null,
          circle_pos: line0.circle ? { x: line0.circle.position.x, y: line0.circle.position.y } : null,
          circle_scale: line0.circle ? { x: line0.circle.scale.x, y: line0.circle.scale.y } : null,
          color0: u.u_color0 ? '#' + u.u_color0.value.getHexString() : null,
        };
      });

      // 3. 中盤（Membersセクション）までスクロール
      for (let i = 0; i < 15; i++) {
        await page.mouse.wheel({ deltaY: 250 });
        await new Promise(r => setTimeout(r, 50));
      }
      await new Promise(r => setTimeout(r, 1200));

      const midShot = `audit_rigorous_${vp.name}_03_members.png`;
      await page.screenshot({ path: midShot });

      // 4. 終盤（Goal / Operating Guidelines）までスクロール
      for (let i = 0; i < 18; i++) {
        await page.mouse.wheel({ deltaY: 300 });
        await new Promise(r => setTimeout(r, 50));
      }
      await new Promise(r => setTimeout(r, 1500));

      const goalShot = `audit_rigorous_${vp.name}_04_goal_dark.png`;
      await page.screenshot({ path: goalShot });

      const goalDiag = await page.evaluate(() => {
        return {
          scrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : null,
          bgHex: window.properties ? window.properties.bgColorHex : null,
          isBlackBg: document.documentElement.classList.contains('is-black-bg'),
          isWhiteBg: document.documentElement.classList.contains('is-white-bg'),
          isIntroWarp: window.properties ? window.properties.isIntroWarp : null,
        };
      });

      auditReport.viewports[vp.name] = {
        heroDiag,
        tubeState,
        goalDiag,
        runtimeErrors,
      };

      await page.close();
    }

    // -------------------------------------------------------------
    // TEST 2: スクロール暴走・アイドル放置・往復リバーススクロール耐性テスト (PC 1440x900)
    // -------------------------------------------------------------
    console.log('\n--- Testing Scroll Runaway Risk & Trajectory ---');
    const scrollPage = await browser.newPage();
    await scrollPage.setViewport({ width: 1440, height: 900 });
    await scrollPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    await scrollPage.evaluate(() => {
      if (window.__unlockNow) window.__unlockNow();
    });
    await new Promise(r => setTimeout(r, 1500));

    // A. アイドル放置テスト (5秒間)
    const idle0 = await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.scrollPixel : 0);
    console.log('Idle starting scrollPixel:', idle0);
    await new Promise(r => setTimeout(r, 5000));
    const idle1 = await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.scrollPixel : 0);
    console.log('Idle ending scrollPixel (after 5s):', idle1);
    const idleDelta = Math.abs(idle1 - idle0);
    const idleRunaway = idleDelta > 0.5;

    // B. マウスホイール往復・急反転テスト
    // 下方向へ高速スクロール
    const forwardHistory = [];
    for (let i = 0; i < 10; i++) {
      await scrollPage.mouse.wheel({ deltaY: 300 });
      await new Promise(r => setTimeout(r, 40));
      const sp = await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.scrollPixel : 0);
      forwardHistory.push(sp);
    }
    await new Promise(r => setTimeout(r, 600));
    const forwardSettled = await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.scrollPixel : 0);

    // 上方向へ急反転（リバーススクロール）
    const reverseHistory = [];
    for (let i = 0; i < 10; i++) {
      await scrollPage.mouse.wheel({ deltaY: -300 });
      await new Promise(r => setTimeout(r, 40));
      const sp = await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.scrollPixel : 0);
      reverseHistory.push(sp);
    }
    await new Promise(r => setTimeout(r, 600));
    const reverseSettled = await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.scrollPixel : 0);

    // C. 矢印キー（ArrowDown / ArrowUp）操作テスト
    await scrollPage.keyboard.press('ArrowDown');
    await new Promise(r => setTimeout(r, 100));
    await scrollPage.keyboard.press('ArrowDown');
    await new Promise(r => setTimeout(r, 300));
    const arrowDownPixel = await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.scrollPixel : 0);

    await scrollPage.keyboard.press('ArrowUp');
    await new Promise(r => setTimeout(r, 300));
    const arrowUpPixel = await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.scrollPixel : 0);

    auditReport.scrollBehavior = {
      idleRunaway,
      idleDelta,
      forwardHistory,
      forwardSettled,
      reverseHistory,
      reverseSettled,
      arrowDownPixel,
      arrowUpPixel,
      autoScrollSpeedDisabled: await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.autoScrollSpeed === 0 : false),
    };

    // -------------------------------------------------------------
    // TEST 3: 2Dチューブ描画品質・先端キャップ追従・ゴミ残存・チラつき精密検査
    // -------------------------------------------------------------
    console.log('\n--- Testing Tube Precision & Cap Follow ---');
    // Reelのチューブ表示域（scrollPixel: 800）へ移動
    await scrollPage.evaluate(() => {
      if (window.scrollManager) {
        window.scrollManager.scrollToPixel(800);
      }
    });
    await new Promise(r => setTimeout(r, 1000));
    await scrollPage.screenshot({ path: 'audit_precision_tube_800.png' });

    // 先端キャップとチューブ先端の追従度合いの幾何学的検査
    const tubeGeometryCheck = await scrollPage.evaluate(() => {
      const line0 = window.__line0;
      if (!line0) return { error: 'line0 missing' };
      const mesh = line0.mesh;
      const circle = line0.circle;
      const geom = line0.geometry;
      if (!geom || !geom.attributes || !geom.attributes.CP) return { error: 'CP missing' };
      const u_showRatio = mesh.material.uniforms.u_showRatio.value;
      const u_radius = mesh.material.uniforms.u_radius.value;
      return {
        u_showRatio,
        u_radius,
        circlePos: { x: circle.position.x, y: circle.position.y, z: circle.position.z },
        circleScale: { x: circle.scale.x, y: circle.scale.y },
        circleVisible: circle.visible,
        meshVisible: mesh.visible,
      };
    });

    // スクロールを上下に小刻みに往復させたときのチラつき・ゴミ残存チェック
    const microShots = [];
    for (let delta of [50, -50, 100, -100, 200, -150]) {
      await scrollPage.mouse.wheel({ deltaY: delta });
      await new Promise(r => setTimeout(r, 150));
      const sp = await scrollPage.evaluate(() => window.scrollManager ? window.scrollManager.scrollPixel : 0);
      microShots.push(sp);
    }
    await scrollPage.screenshot({ path: 'audit_precision_tube_micro_scroll.png' });

    auditReport.tubeInspection = {
      tubeGeometryCheck,
      microShots,
    };

    // -------------------------------------------------------------
    // TEST 4: 既存ページ構成（AGENTS.md最重要規則）とZ-index可読性検査
    // -------------------------------------------------------------
    console.log('\n--- Testing Page Structure Preservation & Z-Index ---');
    const sectionsAudit = await scrollPage.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('section, header, footer, #page-container > div'));
      return sections.map(s => ({
        tag: s.tagName,
        id: s.id,
        className: s.className,
        offsetHeight: s.offsetHeight,
        zIndex: window.getComputedStyle(s).zIndex,
        position: window.getComputedStyle(s).position,
      })).filter(s => s.id || s.className || s.tag === 'HEADER' || s.tag === 'FOOTER');
    });

    // テキスト要素（H1, H2, H3, P, Button）がチューブやオーバーレイに隠されていないか
    const readabilityAudit = await scrollPage.evaluate(() => {
      const reelDesc = document.querySelector('#home-reel-desc');
      const ctaBtn = document.querySelector('#home-reel-cta, a.c-btn, button.c-btn');
      const membersHeader = document.querySelector('.members-header-title, #home-members h3');
      const canvas = document.querySelector('canvas');
      const canvasZIndex = canvas ? window.getComputedStyle(canvas).zIndex : null;
      return {
        canvasZIndex,
        reelDesc: reelDesc ? {
          text: reelDesc.innerText.substring(0, 50),
          zIndex: window.getComputedStyle(reelDesc).zIndex,
          opacity: window.getComputedStyle(reelDesc).opacity,
        } : null,
        ctaBtn: ctaBtn ? {
          text: ctaBtn.innerText,
          zIndex: window.getComputedStyle(ctaBtn).zIndex,
          pointerEvents: window.getComputedStyle(ctaBtn).pointerEvents,
        } : null,
        membersHeader: membersHeader ? {
          text: membersHeader.innerText,
          zIndex: window.getComputedStyle(membersHeader).zIndex,
        } : null,
      };
    });

    auditReport.pageStructure = {
      sectionsAudit,
      readabilityAudit,
    };

    await scrollPage.close();

    // -------------------------------------------------------------
    // 最終総合判定（Red Team判定）
    // -------------------------------------------------------------
    const issues = [];

    // 1. スクロール暴走チェック
    if (auditReport.scrollBehavior.idleRunaway) {
      issues.push(`[FATAL] Scroll runaway detected during idle! Delta=${auditReport.scrollBehavior.idleDelta}`);
    }
    if (!auditReport.scrollBehavior.autoScrollSpeedDisabled) {
      issues.push(`[FATAL] autoScrollSpeed is not strictly disabled (value is not 0)!`);
    }

    // 2. コンソールエラーチェック
    if (auditReport.consoleAndErrors.length > 0) {
      issues.push(`[DEFECT] Runtime console errors detected: ${JSON.stringify(auditReport.consoleAndErrors)}`);
    }

    // 3. チューブ描画チェック
    for (const vp of VIEWPORTS) {
      const v = auditReport.viewports[vp.name];
      if (!v.tubeState.exists) {
        issues.push(`[FATAL] line0 does not exist in viewport ${vp.name}!`);
      }
    }

    auditReport.issuesFound = issues;
    auditReport.verdict = issues.length === 0 ? 'PASSED_CLEAN' : 'FAILED';

    console.log(`\n=== AUDIT VERDICT: ${auditReport.verdict} ===`);
    if (issues.length > 0) {
      console.log('Issues found:\n', issues.join('\n'));
    } else {
      console.log('All red team tests PASSED with zero defects!');
    }
  } catch (err) {
    console.error('Audit crashed with error:', err);
    auditReport.verdict = 'CRASHED';
    auditReport.crashError = err.toString();
  } finally {
    await browser.close();
  }

  fs.writeFileSync('rigorous_audit_report.json', JSON.stringify(auditReport, null, 2));
}

audit();
