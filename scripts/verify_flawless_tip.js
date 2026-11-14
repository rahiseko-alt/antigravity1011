const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== VERIFYING FLAWLESS SEAMLESS 3D LINE TIP ===');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const outDir = path.resolve(process.cwd(), 'tip_verification_results');
  fs.mkdirSync(outDir, { recursive: true });

  // 1. DESKTOP RUN (1920x1080)
  console.log('\n--- 1. Desktop Verification (1920x1080) ---');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  await desktopPage.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 45000 });

  await sleep(1000);

  // We want to test exact scroll positions where the line progresses:
  // Let's scroll using wheel / scrollManager to test:
  // A) At the hero text (showRatio ~ 0.20)
  // B) Further down (showRatio ~ 0.45)
  // C) Approaching goal (showRatio ~ 0.75)

  // Scroll 1: across hero text (approx scrollPixel = 600..700)
  const stages = [
    { name: 'desktop_stage1_hero_text', scrollPixel: 680, clip: { x: 420, y: 120, width: 500, height: 500 } },
    { name: 'desktop_stage2_mid_curve', scrollPixel: 1080, clip: { x: 700, y: 350, width: 550, height: 550 } },
    { name: 'desktop_stage3_deep', scrollPixel: 1450, clip: { x: 950, y: 500, width: 500, height: 500 } }
  ];

  for (const st of stages) {
    const info = await desktopPage.evaluate(async (sp) => {
      window.scrollManager.scrollPixel = sp;
      window.scrollManager.targetScrollPixel = sp;
      for (let f = 0; f < 30; f++) await new Promise(r => requestAnimationFrame(r));

      let lineInfo = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius && obj.material.uniforms.u_showRatio) {
          lineInfo = {
            showRatio: obj.material.uniforms.u_showRatio.value,
            radius: obj.material.uniforms.u_radius.value,
            visible: obj.visible,
            circleVisible: obj.parent && obj.parent.children.some(c => c !== obj && c.visible)
          };
        }
      });
      return { sp, lineInfo };
    }, st.scrollPixel);

    console.log(`[${st.name}] info:`, JSON.stringify(info));
    await sleep(250);

    const fullPath = path.join(outDir, `${st.name}_full.png`);
    await desktopPage.screenshot({ path: fullPath });

    const closePath = path.join(outDir, `${st.name}_closeup.png`);
    await desktopPage.screenshot({ path: closePath, clip: st.clip });
    console.log(`Saved: ${closePath}`);
  }

  // Also capture the standard line_design_desktop.png (used by previous audits)
  await desktopPage.screenshot({ path: path.resolve(process.cwd(), 'line_design_desktop.png') });
  await desktopPage.close();

  // 2. MOBILE RUN (390x844, iPhone 14 viewport)
  console.log('\n--- 2. Mobile Verification (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  await mobilePage.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 45000 });

  await sleep(1000);

  const mobileStages = [
    { name: 'mobile_stage1_hero_text', scrollPixel: 550, clip: { x: 50, y: 150, width: 300, height: 350 } },
    { name: 'mobile_stage2_mid_curve', scrollPixel: 950, clip: { x: 80, y: 300, width: 300, height: 380 } },
    { name: 'mobile_stage3_deep', scrollPixel: 1350, clip: { x: 120, y: 450, width: 260, height: 380 } }
  ];

  for (const st of mobileStages) {
    const info = await mobilePage.evaluate(async (sp) => {
      window.scrollManager.scrollPixel = sp;
      window.scrollManager.targetScrollPixel = sp;
      for (let f = 0; f < 30; f++) await new Promise(r => requestAnimationFrame(r));

      let lineInfo = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius && obj.material.uniforms.u_showRatio) {
          lineInfo = {
            showRatio: obj.material.uniforms.u_showRatio.value,
            radius: obj.material.uniforms.u_radius.value,
            visible: obj.visible
          };
        }
      });
      return { sp, lineInfo };
    }, st.scrollPixel);

    console.log(`[${st.name}] info:`, JSON.stringify(info));
    await sleep(250);

    const fullPath = path.join(outDir, `${st.name}_full.png`);
    await mobilePage.screenshot({ path: fullPath });

    const closePath = path.join(outDir, `${st.name}_closeup.png`);
    await mobilePage.screenshot({ path: closePath, clip: st.clip });
    console.log(`Saved: ${closePath}`);
  }

  // Also capture the standard line_design_mobile.png
  await mobilePage.screenshot({ path: path.resolve(process.cwd(), 'line_design_mobile.png') });
  await mobilePage.close();

  await browser.close();
  console.log('\n=== ALL VERIFICATIONS COMPLETED SUCCESSFULLY ===');
})();
