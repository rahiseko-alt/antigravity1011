const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\e8cb57ba-460a-4080-a2be-d005c76e9e12';

if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForIntro(page) {
  console.log('Waiting for intro to settle...');
  for (let i = 0; i < 90; i++) {
    const ready = await page.evaluate(() => {
      const p = window.properties;
      return p && p.hasStarted && !p.isIntroWarp;
    }).catch(() => false);
    if (ready) break;
    await sleep(200);
  }
  await sleep(1000);
  console.log('Intro settled!');
}

async function inspectTubeState(page) {
  return await page.evaluate(() => {
    let tubeObj = null;
    let tipObj = null;
    if (window.homePage && window.homePage.preUfxContainer) {
      window.homePage.preUfxContainer.traverse(o => {
        if (o.isMesh && o.material && o.material.uniforms && o.material.uniforms.u_radius && !tubeObj) {
          tubeObj = o;
        }
      });
    }
    if (window.homePage && window.homePage.postUfxContainer) {
      window.homePage.postUfxContainer.traverse(o => {
        if (o.isMesh && o.material && o.material.uniforms) {
          if (o.material.uniforms.u_radius && !tubeObj) tubeObj = o;
          if (o.material.uniforms.u_mixRatio && !tipObj) tipObj = o;
        }
      });
    }

    if (!tubeObj) return { found: false };

    const mat = tubeObj.material;
    const u = tubeObj.material.uniforms;
    const inner = tubeObj.parent;
    const vpW = window.properties.viewportWidth;
    const vpH = window.properties.viewportHeight;

    const aspectVal = u.u_aspect ? (typeof u.u_aspect.value === 'number' ? u.u_aspect.value : 1.0) : 1.0;

    // Check screen coordinates of points
    let pointsInView = 0;
    let centerPoints = 0;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    if (tubeObj.geometry && tubeObj.geometry.attributes && tubeObj.geometry.attributes.CP) {
      const cp = tubeObj.geometry.attributes.CP.array;
      const count = tubeObj.geometry.attributes.CP.count;
      const showRatio = u.u_showRatio ? u.u_showRatio.value : 1.0;
      const maxIdx = Math.floor(showRatio * (count - 1));

      const uScale = Math.hypot(vpW, vpH);
      const sx = (vpW / uScale) / 0.87157;

      for (let i = 0; i <= maxIdx; i++) {
        const x3d = inner.position.x + cp[i * 3 + 0] * sx * inner.scale.x;
        const y3d = inner.position.y + cp[i * 3 + 1] * inner.scale.y;
        const screenX = x3d;
        const screenY = -y3d;

        if (screenX >= -20 && screenX <= vpW + 20 && screenY >= -20 && screenY <= vpH + 20) {
          pointsInView++;
          if (screenX >= vpW * 0.15 && screenX <= vpW * 0.85) {
            centerPoints++;
          }
          if (screenX < minX) minX = screenX;
          if (screenX > maxX) maxX = screenX;
          if (screenY < minY) minY = screenY;
          if (screenY > maxY) maxY = screenY;
        }
      }
    }

    return {
      found: true,
      visible: tubeObj.visible && (!inner || inner.visible) && (!inner.parent || inner.parent.visible),
      showRatio: u.u_showRatio ? Number(u.u_showRatio.value.toFixed(3)) : null,
      radius: u.u_radius ? Number(u.u_radius.value.toFixed(3)) : null,
      aspect: Number(aspectVal.toFixed(3)),
      innerScaleX: inner ? Number(inner.scale.x.toFixed(3)) : null,
      innerScaleY: inner ? Number(inner.scale.y.toFixed(3)) : null,
      pointsInView,
      centerPoints,
      bounds: { minX: Math.round(minX), maxX: Math.round(maxX), minY: Math.round(minY), maxY: Math.round(maxY) }
    };
  });
}

(async () => {
  console.log('=== RUNNING FULL CRITERIA VERIFICATION SUITE ===');
  const results = {
    desktopScreens: [],
    mobileScreens: [],
    cardDistortion: {},
    crossSectionCircularity: {},
    colorPalette: [
      { name: 'Cyan', hex: '#00e0ff', tRange: '0.00 - 0.16' },
      { name: 'Red', hex: '#fa1a38', tRange: '0.16 - 0.32' },
      { name: 'Pink', hex: '#ff1fae', tRange: '0.32 - 0.48' },
      { name: 'Yellow', hex: '#ffe605', tRange: '0.48 - 0.64' },
      { name: 'Green', hex: '#00eb73', tRange: '0.64 - 0.80' },
      { name: 'Purple', hex: '#8c1afa', tRange: '0.80 - 0.90' },
      { name: 'Orange Flame', hex: '#ff7a0d', tRange: '0.90 - 1.00' }
    ]
  };

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--window-size=1920,1080'
    ]
  });

  try {
    // ==========================================
    // 1. DESKTOP VERIFICATION (1920x1080)
    // ==========================================
    console.log('\n--- 1. DESKTOP (1920x1080) ---');
    const pageD = await browser.newPage();
    await pageD.setViewport({ width: 1920, height: 1080 });
    await pageD.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await waitForIntro(pageD);

    const desktopCheckpoints = [
      { id: 'D01_reel_entry', scroll: 1000, label: 'PC Reel Entry & Arch' },
      { id: 'D02_reel_button_orbit', scroll: 1400, label: 'PC Reel Button Orbit' },
      { id: 'D03_grand_loop', scroll: 2100, label: 'PC Grand 360 Loop' },
      { id: 'D04_card1_ai_art', scroll: 2800, label: 'PC Card 1 (AIアート展覧会)' },
      { id: 'D05_card2_ai_tips', scroll: 3300, label: 'PC Card 2 (AI小技 発表会)' },
      { id: 'D06_cards_mid_wave', scroll: 3900, label: 'PC Cards Mid Wave (Cards 3-4)' },
      { id: 'D07_cards_lower_cta', scroll: 4600, label: 'PC Cards Lower & Blue CTA' },
      { id: 'D08_members_top', scroll: 5400, label: 'PC Members Top Row' },
      { id: 'D09_members_bottom', scroll: 6100, label: 'PC Members Bottom Row' },
      { id: 'D10_goal_outro', scroll: 6600, label: 'PC Goal Flourish Outro' }
    ];

    for (const cp of desktopCheckpoints) {
      await pageD.evaluate(px => {
        window.scrollManager.scrollToPixel(px, true);
      }, cp.scroll);
      await sleep(600);

      const state = await inspectTubeState(pageD);
      const filename = `verify_desktop_${cp.id}.png`;
      const artifactPath = path.join(artifactDir, filename);

      await pageD.screenshot({ path: artifactPath });
      console.log(`[Desktop] ${cp.label} (${cp.scroll}px): saved to ${filename}, tubeVisible: ${state.visible}, points: ${state.pointsInView}`);

      results.desktopScreens.push({
        ...cp,
        filename,
        artifactPath,
        state
      });
    }

    // Inspect Circularity & Aspect on Desktop
    results.crossSectionCircularity.desktop = await pageD.evaluate(() => {
      let tube = null;
      window.homePage.postUfxContainer.traverse(o => {
        if (o.isMesh && o.material && o.material.uniforms && o.material.uniforms.u_radius) tube = o;
      });
      if (!tube) return { found: false };
      const u = tube.material.uniforms;
      const aspectVal = u.u_aspect ? (typeof u.u_aspect.value === 'number' ? u.u_aspect.value : 1.0) : 1.0;
      return {
        u_aspect: aspectVal,
        innerScaleX: tube.parent.scale.x,
        innerScaleY: tube.parent.scale.y,
        isCircular: Math.abs(tube.parent.scale.x - tube.parent.scale.y) < 0.05
      };
    });

    // Test Point 6: Card 1 & Card 2 WebGL Distortion on Desktop
    console.log('\n--- Testing WebGL Distortion ("ぐにゃーん") on Card 1 & Card 2 ---');
    // Scroll to Card 1
    await pageD.evaluate(() => {
      const el = document.querySelector('.project-item-flagship');
      if (el && window.scrollManager) {
        const rect = el.getBoundingClientRect();
        window.scrollManager.scrollToPixel(window.scrollManager.scrollPixel + rect.top - 120, true);
      }
    });
    await sleep(600);

    // Induce scroll ripple & capture
    await pageD.mouse.move(960, 500);
    for (let i = 0; i < 4; i++) {
      await pageD.mouse.wheel({ deltaY: 280 });
      await sleep(16);
    }
    const c1DistortionFile = 'verify_desktop_card1_distortion_gunyaan.png';
    const c1DistortionPath = path.join(artifactDir, c1DistortionFile);
    await pageD.screenshot({ path: c1DistortionPath });

    const c1Uniforms = await pageD.evaluate(() => {
      let m = null;
      window.homePage.postUfxContainer.traverse(o => {
        if (o.isMesh && o.material && o.material.uniforms && o.material.uniforms.u_rippleStrength) {
          if (!m) m = o;
        }
      });
      return m ? {
        rippleStrength: m.material.uniforms.u_rippleStrength.value,
        easedScrollStrength: window.scrollManager.easedScrollStrength,
        visible: m.visible
      } : null;
    });
    console.log('Card 1 Distortion captured:', c1DistortionFile, c1Uniforms);

    // Scroll to Card 2
    await pageD.evaluate(() => {
      const el = document.querySelector('.project-item[data-id="oryzo_ai"]');
      if (el && window.scrollManager) {
        const rect = el.getBoundingClientRect();
        window.scrollManager.scrollToPixel(window.scrollManager.scrollPixel + rect.top - 120, true);
      }
    });
    await sleep(600);

    await pageD.mouse.move(960, 500);
    for (let i = 0; i < 4; i++) {
      await pageD.mouse.wheel({ deltaY: 280 });
      await sleep(16);
    }
    const c2DistortionFile = 'verify_desktop_card2_distortion_gunyaan.png';
    const c2DistortionPath = path.join(artifactDir, c2DistortionFile);
    await pageD.screenshot({ path: c2DistortionPath });

    const c2Uniforms = await pageD.evaluate(() => {
      let meshes = [];
      window.homePage.postUfxContainer.traverse(o => {
        if (o.isMesh && o.material && o.material.uniforms && o.material.uniforms.u_rippleStrength) {
          meshes.push(o);
        }
      });
      const m = meshes[1] || meshes[0];
      return m ? {
        rippleStrength: m.material.uniforms.u_rippleStrength.value,
        easedScrollStrength: window.scrollManager.easedScrollStrength,
        visible: m.visible
      } : null;
    });
    console.log('Card 2 Distortion captured:', c2DistortionFile, c2Uniforms);

    results.cardDistortion = {
      card1: { filename: c1DistortionFile, path: c1DistortionPath, uniforms: c1Uniforms },
      card2: { filename: c2DistortionFile, path: c2DistortionPath, uniforms: c2Uniforms }
    };

    await pageD.close();

    // ==========================================
    // 2. MOBILE VERIFICATION (390x844)
    // ==========================================
    console.log('\n--- 2. MOBILE (390x844) ---');
    const pageM = await browser.newPage();
    await pageM.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await pageM.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await waitForIntro(pageM);

    const mobileCheckpoints = [
      { id: 'M01_card1_flagship', scroll: 1800, label: 'Card 1 (AIアート展覧会 / 重要文化財企画)' },
      { id: 'M02_card2_meetup', scroll: 2350, label: 'Card 2 (AI小技 発表会)' },
      { id: 'M03_card3_sns', scroll: 2750, label: 'Card 3 (SNS運用の自動化)' },
      { id: 'M04_card4_bot', scroll: 3100, label: 'Card 4 (自社特化型AIチャットボット)' },
      { id: 'M05_card5_medical', scroll: 3450, label: 'Card 5 (音声カルテ作成アプリ)' },
      { id: 'M06_card6_docs', scroll: 3800, label: 'Card 6 (書類業務の半自動化アプリ)' },
      { id: 'M07_blue_cta_btn', scroll: 4050, label: '青ボタン (企画を提案する / 参加する)' },
      { id: 'M08_members_header', scroll: 4250, label: 'メンバー見出し (AIueoを動かすプレイヤーたち)' },
      { id: 'M09_member01_kosehira', scroll: 4600, label: 'メンバー01 (小齊平 恒平)' },
      { id: 'M10_member02_ito', scroll: 5150, label: 'メンバー02 (伊藤 良二)' },
      { id: 'M11_member03_sakai', scroll: 5650, label: 'メンバー03 (堺 彬)' },
      { id: 'M12_member04_okamoto', scroll: 6150, label: 'メンバー04 (岡本 ジュンイチ)' }
    ];

    for (const cp of mobileCheckpoints) {
      await pageM.evaluate(px => {
        window.scrollManager.scrollToPixel(px, true);
      }, cp.scroll);
      await sleep(600);

      const state = await inspectTubeState(pageM);
      const filename = `verify_mobile_${cp.id}.png`;
      const artifactPath = path.join(artifactDir, filename);

      await pageM.screenshot({ path: artifactPath });
      console.log(`[Mobile] ${cp.label} (${cp.scroll}px): saved to ${filename}, tubeVisible: ${state.visible}, centerPoints: ${state.centerPoints}, bounds:`, state.bounds);

      results.mobileScreens.push({
        ...cp,
        filename,
        artifactPath,
        state
      });
    }

    // Inspect Mobile Circularity
    results.crossSectionCircularity.mobile = await pageM.evaluate(() => {
      let tube = null;
      let tip = null;
      window.homePage.postUfxContainer.traverse(o => {
        if (o.isMesh && o.material && o.material.uniforms) {
          if (o.material.uniforms.u_radius) tube = o;
          if (o.material.uniforms.u_mixRatio) tip = o;
        }
      });
      const u = tube ? tube.material.uniforms : null;
      const aspectVal = u && u.u_aspect ? (typeof u.u_aspect.value === 'number' ? u.u_aspect.value : 1.0) : 1.0;
      return {
        u_aspect: aspectVal,
        innerScaleX: tube ? tube.parent.scale.x : null,
        innerScaleY: tube ? tube.parent.scale.y : null,
        tipScaleX: tip ? tip.scale.x : null,
        tipScaleY: tip ? tip.scale.y : null,
        tipRatio: tip ? tip.scale.x / tip.scale.y : null
      };
    });

    await pageM.close();

  } finally {
    await browser.close();
  }

  // Write comprehensive JSON summary
  const summaryJsonPath = path.join(artifactDir, 'verification_summary_full.json');
  fs.writeFileSync(summaryJsonPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nVerification suite successfully written to ${summaryJsonPath}!`);
})();
