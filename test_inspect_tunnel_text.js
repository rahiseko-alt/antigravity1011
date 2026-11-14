const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== Inspecting Text Display: Native Mid-Page Warp vs Intro Warp ===');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--enable-webgl2-compute-context',
      '--ignore-gpu-blocklist',
      '--disable-gpu-sandbox',
      '--no-sandbox',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const report = {
    introWarp: {
      checks: [],
      textVisible: false,
      domElementState: null,
      screenshots: []
    },
    midPageWarp: {
      domStructure: null,
      webglInspection: null,
      timelineSteps: []
    }
  };

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // --- PART 1: INTRO WARP INSPECTION ---
  console.log('\n--- PART 1: Inspecting Opening Intro Warp ---');

  const startIntro = Date.now();
  let introShotIdx = 1;

  while (Date.now() - startIntro < 5000) {
    const state = await page.evaluate(() => {
      const el = document.querySelector('#home-goal-tunnel-title');
      const lines = el ? Array.from(el.querySelectorAll('.home-goal-tunnel-title-line')).map(l => l.textContent.trim()) : [];
      const pageContainer = document.querySelector('#page-container');
      const compStyle = el ? window.getComputedStyle(el) : null;
      const rect = el ? el.getBoundingClientRect() : null;

      const prop = window.properties || {};
      const gt = window.goalTunnels || {};
      const scrollY = window.scrollManager ? window.scrollManager.scrollPixel : window.scrollY;

      return {
        isIntroWarp: !!prop.isIntroWarp,
        introRatio: gt.introRatio || 0,
        scrollY,
        pageContainerOpacity: pageContainer ? window.getComputedStyle(pageContainer).opacity : null,
        pageContainerDisplay: pageContainer ? window.getComputedStyle(pageContainer).display : null,
        hasTitleEl: !!el,
        lines,
        inlineVisibility: el ? el.style.visibility : null,
        inlineOpacity: el ? el.style.opacity : null,
        inlineTransform: el ? el.style.transform : null,
        compVisibility: compStyle ? compStyle.visibility : null,
        compOpacity: compStyle ? compStyle.opacity : null,
        rect: rect ? { top: Math.round(rect.top), bottom: Math.round(rect.bottom), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) } : null
      };
    });

    report.introWarp.checks.push(state);

    if (state.isIntroWarp && introShotIdx <= 4) {
      const shotName = `shot_intro_warp_t${introShotIdx}.png`;
      await page.screenshot({ path: shotName });
      report.introWarp.screenshots.push({ shotName, state });
      console.log(`[Intro Warp] Saved ${shotName} | isIntroWarp=${state.isIntroWarp}, introRatio=${state.introRatio.toFixed(2)}, textVisibility=${state.compVisibility}, textOpacity=${state.compOpacity}, pageContainerOpacity=${state.pageContainerOpacity}, rectTop=${state.rect ? state.rect.top : 'n/a'}`);
      introShotIdx++;
    }

    if (state.compVisibility === 'visible' && parseFloat(state.compOpacity) > 0.05 && parseFloat(state.pageContainerOpacity) > 0.05) {
      report.introWarp.textVisible = true;
    }

    await sleep(250);
  }

  // Wait for intro warp completion
  console.log('Waiting for intro warp to complete and Hero to settle...');
  await page.waitForFunction(() => window.properties && window.properties.hasStarted && !window.properties.isIntroWarp, { timeout: 15000 });
  await sleep(1500);

  // --- PART 2: INSPECT DOM AND WEBGL STRUCTURE ---
  console.log('\n--- PART 2: Inspecting DOM & WebGL Scene Details ---');

  const detailedInspection = await page.evaluate(() => {
    const el = document.querySelector('#home-goal-tunnel-title');
    const compStyle = el ? window.getComputedStyle(el) : null;
    const lines = el ? Array.from(el.querySelectorAll('.home-goal-tunnel-title-line')).map((lineEl, idx) => {
      const spans = Array.from(lineEl.querySelectorAll('span')).map(s => ({
        text: s.textContent,
        style: s.getAttribute('style')
      }));
      return {
        lineIdx: idx,
        fullText: lineEl.textContent.trim(),
        spansCount: spans.length,
        spans
      };
    }) : [];

    // WebGL traversal
    const webglDetails = {
      currentStage: window.visuals && window.visuals.currentStage3D ? window.visuals.currentStage3D.constructor.name : null,
      stageList: (window.visuals && window.visuals.stage3DList) ? window.visuals.stage3DList.map(s => s.constructor.name) : [],
      goalTunnelsMeshes: [],
      hasTextMeshes: false,
      hasCards: false
    };

    if (window.goalTunnels && window.goalTunnels.container) {
      window.goalTunnels.container.traverse(obj => {
        const info = {
          name: obj.name || 'unnamed',
          type: obj.type,
          geom: obj.geometry ? obj.geometry.constructor.name : null,
          mat: obj.material ? (Array.isArray(obj.material) ? obj.material.map(m => m.constructor.name) : obj.material.constructor.name) : null,
          visible: obj.visible
        };
        webglDetails.goalTunnelsMeshes.push(info);
        if (obj.name && /text|font|label/i.test(obj.name)) {
          webglDetails.hasTextMeshes = true;
        }
        if (obj.name && /card/i.test(obj.name)) {
          webglDetails.hasCards = true;
        }
      });
    }

    // Ranges
    const ranges = window.homeGoalSectionRanges;
    const items = ranges ? Object.keys(ranges.items).map(k => ({
      id: k,
      pixelFrom: ranges.items[k].pixelFrom,
      pixelTo: ranges.items[k].pixelTo,
      pixelCount: ranges.items[k].pixelCount
    })) : [];

    return {
      domStructure: {
        id: el ? el.id : null,
        tagName: el ? el.tagName : null,
        className: el ? el.className : null,
        styles: compStyle ? {
          position: compStyle.position,
          fontSize: compStyle.fontSize,
          fontFamily: compStyle.fontFamily,
          fontWeight: compStyle.fontWeight,
          lineHeight: compStyle.lineHeight,
          color: compStyle.color,
          textAlign: compStyle.textAlign,
          textTransform: compStyle.textTransform,
          zIndex: compStyle.zIndex,
          gridColumn: compStyle.gridColumn
        } : null,
        lines
      },
      webglDetails,
      rangesBaseY: ranges ? ranges.baseY : null,
      rangesTotalPixels: ranges ? ranges.totalPixelCount : null,
      items
    };
  });

  report.midPageWarp.domStructure = detailedInspection.domStructure;
  report.midPageWarp.webglInspection = detailedInspection.webglDetails;

  console.log('DOM Structure Lines:', JSON.stringify(detailedInspection.domStructure.lines, null, 2));
  console.log('DOM Styles:', JSON.stringify(detailedInspection.domStructure.styles, null, 2));
  console.log('WebGL Stage list:', detailedInspection.webglDetails.stageList);
  console.log('WebGL Meshes inside goalTunnels count:', detailedInspection.webglDetails.goalTunnelsMeshes.length);
  console.log('Has 3D text meshes:', detailedInspection.webglDetails.hasTextMeshes);
  console.log('Has cards:', detailedInspection.webglDetails.hasCards);

  // --- PART 3: SCRUB THROUGH MID-PAGE WARP ---
  console.log('\n--- PART 3: Scrubbing Through Native Mid-Page Warp ---');

  const baseY = detailedInspection.rangesBaseY;
  const blackTitleItem = detailedInspection.items.find(i => i.id === 'blackTitle');
  const blackTunnelItem = detailedInspection.items.find(i => i.id === 'blackTunnel');
  const whiteTunnelItem = detailedInspection.items.find(i => i.id === 'whiteTunnel');

  console.log(`baseY = ${baseY}`);
  console.log(`blackTitle: from ${blackTitleItem.pixelFrom} to ${blackTitleItem.pixelTo}`);
  console.log(`blackTunnel: from ${blackTunnelItem.pixelFrom} to ${blackTunnelItem.pixelTo}`);

  // We want to sample:
  // 1. Right before blackTitle (ratio 0.0 of blackTitle)
  // 2. blackTitle ratio 0.15 (before fade in)
  // 3. blackTitle ratio 0.30 (just faded in, small scale)
  // 4. blackTitle ratio 0.50 (fully visible, letters spreading)
  // 5. blackTitle ratio 0.70 (letters spread, scaling up)
  // 6. blackTitle ratio 0.90 (giant scale, camera flying right through words!)
  // 7. blackTitle ratio 0.98 (fading out into darkness)
  // 8. blackTunnel ratio 0.20 (full 3D cyber tunnel)
  // 9. blackTunnel ratio 0.80 (deep in cyber tunnel)
  // 10. whiteTunnel ratio 0.50 (white hyperdrive warp)

  const sampleTargets = [
    { label: '1_before_title', offset: blackTitleItem.pixelFrom - 200 },
    { label: '2_title_ratio_0.15', offset: blackTitleItem.pixelFrom + blackTitleItem.pixelCount * 0.15 },
    { label: '3_title_ratio_0.30_fadein', offset: blackTitleItem.pixelFrom + blackTitleItem.pixelCount * 0.30 },
    { label: '4_title_ratio_0.45_visible', offset: blackTitleItem.pixelFrom + blackTitleItem.pixelCount * 0.45 },
    { label: '5_title_ratio_0.60_spreading', offset: blackTitleItem.pixelFrom + blackTitleItem.pixelCount * 0.60 },
    { label: '6_title_ratio_0.75_scaling', offset: blackTitleItem.pixelFrom + blackTitleItem.pixelCount * 0.75 },
    { label: '7_title_ratio_0.90_huge_flythrough', offset: blackTitleItem.pixelFrom + blackTitleItem.pixelCount * 0.90 },
    { label: '8_title_ratio_0.98_fadeout', offset: blackTitleItem.pixelFrom + blackTitleItem.pixelCount * 0.98 },
    { label: '9_black_tunnel_3d', offset: blackTunnelItem.pixelFrom + blackTunnelItem.pixelCount * 0.30 },
    { label: '10_white_tunnel_warp', offset: whiteTunnelItem.pixelFrom + whiteTunnelItem.pixelCount * 0.50 }
  ];

  for (let i = 0; i < sampleTargets.length; i++) {
    const target = sampleTargets[i];
    const targetPixel = baseY + target.offset;

    await page.evaluate((px) => {
      window.scrollManager.scrollToPixel(px, true);
    }, targetPixel);

    // Let RAF render 2 frames
    await sleep(200);

    const stepState = await page.evaluate(() => {
      const el = document.querySelector('#home-goal-tunnel-title');
      const compStyle = el ? window.getComputedStyle(el) : null;
      const rect = el ? el.getBoundingClientRect() : null;

      const ranges = window.homeGoalSectionRanges;
      const bTitle = ranges ? ranges.getRange('blackTitle') : null;
      const bTunnel = ranges ? ranges.getRange('blackTunnel') : null;
      const wTunnel = ranges ? ranges.getRange('whiteTunnel') : null;

      const spansData = el ? Array.from(el.querySelectorAll('.home-goal-tunnel-title-line span')).map(sp => ({
        text: sp.textContent,
        transform: sp.style.transform
      })) : [];

      return {
        scrollPixel: window.scrollManager.scrollPixel,
        offsetY: ranges ? ranges.offsetY : null,
        blackTitleRatio: bTitle ? bTitle.ratio : null,
        blackTitleActive: bTitle ? bTitle.isActive : null,
        blackTunnelRatio: bTunnel ? bTunnel.ratio : null,
        whiteTunnelRatio: wTunnel ? wTunnel.ratio : null,
        goalTunnelsActive: window.goalTunnels ? window.goalTunnels.isActive : null,
        currentStage: window.visuals && window.visuals.currentStage3D ? window.visuals.currentStage3D.constructor.name : null,
        inlineVisibility: el ? el.style.visibility : null,
        inlineOpacity: el ? el.style.opacity : null,
        inlineTransform: el ? el.style.transform : null,
        compVisibility: compStyle ? compStyle.visibility : null,
        compOpacity: compStyle ? compStyle.opacity : null,
        rect: rect ? { top: Math.round(rect.top), bottom: Math.round(rect.bottom), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) } : null,
        spansData: spansData.slice(0, 10)
      };
    });

    const shotFile = `shot_midpage_${target.label}.png`;
    await page.screenshot({ path: shotFile });

    report.midPageWarp.timelineSteps.push({
      target: target.label,
      shotFile,
      state: stepState
    });

    console.log(`[Mid-Page Warp] Step ${i + 1}/${sampleTargets.length}: ${target.label}`);
    console.log(`  -> scrollPixel=${Math.round(stepState.scrollPixel)}, bTitleRatio=${stepState.blackTitleRatio ? stepState.blackTitleRatio.toFixed(3) : 'null'}`);
    console.log(`  -> visible=${stepState.compVisibility}, opacity=${stepState.compOpacity}, transform=${stepState.inlineTransform ? stepState.inlineTransform.slice(0, 70) : 'none'}`);
    console.log(`  -> rect=${JSON.stringify(stepState.rect)}`);
  }

  fs.writeFileSync('report_warp_text_inspection.json', JSON.stringify(report, null, 2), 'utf8');
  console.log('\nAll done! Comprehensive report saved to report_warp_text_inspection.json');

  await browser.close();
})();
