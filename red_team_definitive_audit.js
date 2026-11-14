import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000/';

const VIEWPORTS = [
  { name: 'sp_375x667', width: 375, height: 667, isMobile: true, scrollPixel: 600 },
  { name: 'sp_390x844', width: 390, height: 844, isMobile: true, scrollPixel: 600 },
  { name: 'sp_414x896', width: 414, height: 896, isMobile: true, scrollPixel: 600 },
  { name: 'tablet_768x1024', width: 768, height: 1024, isMobile: false, scrollPixel: 800 },
  { name: 'pc_1280x800', width: 1280, height: 800, isMobile: false, scrollPixel: 800 },
  { name: 'pc_1440x900', width: 1440, height: 900, isMobile: false, scrollPixel: 800 },
  { name: 'pc_1920x1080', width: 1920, height: 1080, isMobile: false, scrollPixel: 800 },
];

const auditReport = {
  timestamp: new Date().toISOString(),
  viewports: {},
  scrollStressTest: {},
  capTrackingAccuracy: {},
  darkTransitionCheck: {},
  domIntegrityCheck: {},
  webglShaderCheck: {},
  overallVerdict: 'PENDING',
  findings: [],
};

async function runRedTeamAudit() {
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

  console.log('=== RED TEAM AUDIT STAGE 2: DEFINITIVE VERIFICATION ===');

  try {
    // -----------------------------------------------------------------
    // 1. 各解像度での自然ロード & チューブ描画 & ダーク遷移
    // -----------------------------------------------------------------
    for (const vp of VIEWPORTS) {
      console.log(`Auditing ${vp.name} (${vp.width}x${vp.height})...`);
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile });

      const errors = [];
      const warnings = [];
      page.on('console', msg => {
        const text = msg.text();
        if (text.includes('font-size:0;color:transparent')) return;
        if (msg.type() === 'error') errors.push(text);
        if (msg.type() === 'warning') warnings.push(text);
      });
      page.on('pageerror', err => errors.push(err.toString()));

      await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      // ロード完了と初期アニメーション落ち着き待ち
      await new Promise(r => setTimeout(r, 2000));

      // ヒーロー撮影
      const heroPath = `definitive_${vp.name}_01_hero.png`;
      await page.screenshot({ path: heroPath });

      // Reel（チューブ）位置へスクロール
      await page.evaluate((sp) => {
        if (window.scrollManager) window.scrollManager.scrollToPixel(sp);
      }, vp.scrollPixel);
      await new Promise(r => setTimeout(r, 1200));

      const reelPath = `definitive_${vp.name}_02_reel.png`;
      await page.screenshot({ path: reelPath });

      // チューブ状態の検証
      const tubeDiag = await page.evaluate(() => {
        const l0 = window.__line0;
        if (!l0) return { exists: false };
        const u = l0.mesh.material.uniforms;
        return {
          exists: true,
          containerVisible: l0.container.visible,
          meshVisible: l0.mesh.visible,
          circleVisible: l0.circle.visible,
          u_showRatio: u.u_showRatio.value,
          u_radius: u.u_radius.value,
          color0: '#' + u.u_color0.value.getHexString(),
          circlePos: { x: l0.circle.position.x, y: l0.circle.position.y, z: l0.circle.position.z },
          circleScale: { x: l0.circle.scale.x, y: l0.circle.scale.y },
          scrollPixel: window.scrollManager.scrollPixel,
        };
      });

      // Operating Guidelines（Goalセクション・ダーク背景）へスクロール
      const goalScrollTarget = vp.isMobile ? 5800 : 6400;
      await page.evaluate((sp) => {
        if (window.scrollManager) window.scrollManager.scrollToPixel(sp);
      }, goalScrollTarget);
      await new Promise(r => setTimeout(r, 1500));

      const goalPath = `definitive_${vp.name}_03_goal_dark.png`;
      await page.screenshot({ path: goalPath });

      const goalDiag = await page.evaluate(() => {
        return {
          scrollPixel: window.scrollManager.scrollPixel,
          bgHex: window.properties ? window.properties.bgColorHex : null,
          isBlackBg: document.documentElement.classList.contains('is-black-bg'),
          isWhiteBg: document.documentElement.classList.contains('is-white-bg'),
          isIntroWarp: window.properties ? window.properties.isIntroWarp : null,
        };
      });

      auditReport.viewports[vp.name] = {
        errors,
        warnings,
        tubeDiag,
        goalDiag,
      };

      await page.close();
    }

    // -----------------------------------------------------------------
    // 2. スクロール耐久テスト（往復・急激リバース・微細スクロール・暴走判定）
    // -----------------------------------------------------------------
    console.log('Auditing Scroll Stress & Trajectory (PC 1440x900)...');
    const scrollPage = await browser.newPage();
    await scrollPage.setViewport({ width: 1440, height: 900 });
    await scrollPage.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));

    // A. 5秒間完全放置テスト
    const idleStart = await scrollPage.evaluate(() => window.scrollManager.scrollPixel);
    await new Promise(r => setTimeout(r, 5000));
    const idleEnd = await scrollPage.evaluate(() => window.scrollManager.scrollPixel);
    const idleDrift = Math.abs(idleEnd - idleStart);

    // B. 急激な上下往復スクロール（5往復）
    const trajectory = [];
    for (let cycle = 0; cycle < 5; cycle++) {
      // ダウン
      for (let i = 0; i < 5; i++) {
        await scrollPage.mouse.wheel({ deltaY: 300 });
        await new Promise(r => setTimeout(r, 30));
      }
      await new Promise(r => setTimeout(r, 200));
      const downSp = await scrollPage.evaluate(() => window.scrollManager.scrollPixel);

      // アップ
      for (let i = 0; i < 5; i++) {
        await scrollPage.mouse.wheel({ deltaY: -300 });
        await new Promise(r => setTimeout(r, 30));
      }
      await new Promise(r => setTimeout(r, 200));
      const upSp = await scrollPage.evaluate(() => window.scrollManager.scrollPixel);

      trajectory.push({ cycle, downSp, upSp });
    }

    // 落ち着いた後の静止判定
    await new Promise(r => setTimeout(r, 1000));
    const settledSp = await scrollPage.evaluate(() => window.scrollManager.scrollPixel);
    await new Promise(r => setTimeout(r, 2000));
    const settledSpAfter2s = await scrollPage.evaluate(() => window.scrollManager.scrollPixel);
    const postScrollDrift = Math.abs(settledSpAfter2s - settledSp);

    auditReport.scrollStressTest = {
      idleStart,
      idleEnd,
      idleDrift,
      isIdleRunawayFree: idleDrift < 0.01,
      trajectory,
      settledSp,
      settledSpAfter2s,
      postScrollDrift,
      isPostScrollStable: postScrollDrift < 0.01,
      autoScrollSpeed: await scrollPage.evaluate(() => window.scrollManager.autoScrollSpeed),
    };

    // -----------------------------------------------------------------
    // 3. 先端キャップ（circle）の吸い付き幾何学追従テスト
    // -----------------------------------------------------------------
    console.log('Auditing Cap Tracking Accuracy across scroll range...');
    const capSamples = [];
    for (let sp = 300; sp <= 1100; sp += 100) {
      await scrollPage.evaluate((val) => window.scrollManager.scrollToPixel(val), sp);
      await new Promise(r => setTimeout(r, 200));
      const sample = await scrollPage.evaluate(() => {
        const l0 = window.__line0;
        if (!l0) return null;
        const cp = l0.circle.position;
        const cs = l0.circle.scale;
        const showRatio = l0.mesh.material.uniforms.u_showRatio.value;
        const radius = l0.mesh.material.uniforms.u_radius.value;
        return {
          showRatio,
          radius,
          circleX: cp.x,
          circleY: cp.y,
          circleZ: cp.z,
          circleScaleX: cs.x,
          circleScaleY: cs.y,
          circleVisible: l0.circle.visible,
          meshVisible: l0.mesh.visible,
        };
      });
      capSamples.push({ sp, sample });
    }
    auditReport.capTrackingAccuracy = capSamples;

    // -----------------------------------------------------------------
    // 4. WebGLシェーダー＆パイプライン深層監査
    // -----------------------------------------------------------------
    console.log('Auditing WebGL Pipeline & Shaders...');
    const shaderAudit = await scrollPage.evaluate(() => {
      const l0 = window.__line0;
      if (!l0) return { error: 'No line0' };
      const meshMat = l0.mesh.material;
      const circleMat = l0.circle.material;
      return {
        meshDefines: meshMat.defines,
        meshTransparent: meshMat.transparent,
        meshDepthTest: meshMat.depthTest,
        circleTransparent: circleMat.transparent,
        circleDepthTest: circleMat.depthTest,
        meshVertexShaderSnippet: meshMat.vertexShader.substring(0, 120),
        meshFragmentShaderSnippet: meshMat.fragmentShader.substring(0, 120),
        circleVertexShaderSnippet: circleMat.vertexShader.substring(0, 120),
        circleFragmentShaderSnippet: circleMat.fragmentShader.substring(0, 120),
      };
    });
    auditReport.webglShaderCheck = shaderAudit;

    // -----------------------------------------------------------------
    // 5. ページ構造＆AGENTS.md 最重要規則の検査
    // -----------------------------------------------------------------
    console.log('Auditing DOM Structure & AGENTS.md preservation...');
    const domSections = await scrollPage.evaluate(() => {
      const hero = document.getElementById('home-hero-title');
      const reelDesc = document.getElementById('home-reel-desc');
      const members = document.getElementById('home-members');
      const goal = document.getElementById('home-goal');
      const guidelines = document.getElementById('home-goal-context');
      const footer = document.querySelector('footer');
      return {
        hasHeroTitle: !!hero,
        heroTitleText: hero ? hero.innerText.replace(/\n/g, ' ') : null,
        hasReelDesc: !!reelDesc,
        reelDescText: reelDesc ? reelDesc.innerText.replace(/\n/g, ' ') : null,
        hasMembersSection: !!members,
        hasGoalSection: !!goal,
        hasOperatingGuidelines: !!guidelines,
        hasFooter: !!footer,
      };
    });
    auditReport.domIntegrityCheck = domSections;

    await scrollPage.close();

    // -----------------------------------------------------------------
    // 判定基準と敵対的判定 (Red Team Verdict)
    // -----------------------------------------------------------------
    const findings = [];

    // スクロール暴走判定
    if (!auditReport.scrollStressTest.isIdleRunawayFree) {
      findings.push(`[FATAL FAIL] Idle scroll runaway detected! Drift: ${auditReport.scrollStressTest.idleDrift}px`);
    }
    if (!auditReport.scrollStressTest.isPostScrollStable) {
      findings.push(`[FATAL FAIL] Post-scroll instability detected! Drift: ${auditReport.scrollStressTest.postScrollDrift}px`);
    }
    if (auditReport.scrollStressTest.autoScrollSpeed !== 0) {
      findings.push(`[FAIL] autoScrollSpeed is not 0 (found ${auditReport.scrollStressTest.autoScrollSpeed})`);
    }

    // 解像度別チューブ生存・可視性判定
    for (const vp of VIEWPORTS) {
      const v = auditReport.viewports[vp.name];
      if (!v.tubeDiag.exists) {
        findings.push(`[FAIL] Tube (line0) missing on ${vp.name}`);
      } else if (!v.tubeDiag.meshVisible || !v.tubeDiag.containerVisible) {
        findings.push(`[FAIL] Tube mesh/container invisible on ${vp.name}`);
      }
      if (v.errors.length > 0) {
        findings.push(`[ERROR] Console errors on ${vp.name}: ${JSON.stringify(v.errors)}`);
      }
    }

    // DOM構造欠損判定
    if (!domSections.hasHeroTitle || !domSections.hasReelDesc || !domSections.hasMembersSection || !domSections.hasGoalSection || !domSections.hasOperatingGuidelines) {
      findings.push(`[RULE VIOLATION] AGENTS.md rule violated: Core sections missing or deleted!`);
    }

    auditReport.findings = findings;
    auditReport.overallVerdict = findings.length === 0 ? 'ALL_TESTS_PASSED_RIGOROUS' : 'DEFECTS_FOUND';

    console.log(`\n========================================`);
    console.log(`OVERALL AUDIT VERDICT: ${auditReport.overallVerdict}`);
    console.log(`Findings count: ${findings.length}`);
    if (findings.length > 0) {
      console.log('Findings:\n' + findings.join('\n'));
    } else {
      console.log('All checks passed without defect!');
    }
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Audit execution error:', err);
    auditReport.overallVerdict = 'EXECUTION_CRASH';
    auditReport.executionError = err.toString();
  } finally {
    await browser.close();
  }

  fs.writeFileSync('definitive_red_team_report.json', JSON.stringify(auditReport, null, 2));
}

runRedTeamAudit();
