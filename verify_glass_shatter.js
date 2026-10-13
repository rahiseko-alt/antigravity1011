const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== Verifying GoalTunnelGlass Glass Shatter Intro Warp Timeline ===');

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

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('[BROWSER ERROR]:', msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.error('[PAGE ERROR]:', err.message);
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // 1. Wait for warp activation
  console.log('Waiting for warp / preloader activation...');
  await page.waitForFunction(() => window.properties && window.properties.isIntroWarp, { timeout: 15000 });

  const samples = [];
  let capturedPhaseA = false;
  let capturedPhaseB_Black = false;
  let capturedPhaseB_White = false;
  let capturedPhaseC_Glass = false;
  let capturedPhaseD_Whiteout = false;
  let capturedHero = false;

  const startPoll = Date.now();
  while (Date.now() - startPoll < 5000) {
    const state = await page.evaluate(() => {
      const prop = window.properties;
      const gt = window.goalTunnels;
      const glass = window.goalTunnelGlass;
      const r = (gt && gt.introStartTime != null) ? (performance.now() - gt.introStartTime) / 1000 : -1;
      
      let glassMeshActive = false;
      let glassMeshPieceCount = 0;
      let glassShaderMaterialActive = false;
      let glassContainerVisible = false;
      let glassRatio = 0;
      let glassUniforms = {};

      if (glass) {
        glassRatio = glass.ratio;
        glassContainerVisible = !!(glass.container && glass.container.visible);
        if (glass.mesh) {
          glassMeshActive = !!glass.mesh.visible;
          glassShaderMaterialActive = !!(glass.mesh.material && glass.mesh.material.isShaderMaterial);
          if (glass.mesh.geometry && glass.mesh.geometry.attributes && glass.mesh.geometry.attributes.position) {
            glassMeshPieceCount = glass.PIECE_COUNT || 946;
          }
          if (glass.sharedUniforms) {
            glassUniforms = {
              u_frameFrom: glass.sharedUniforms.u_frameFrom ? glass.sharedUniforms.u_frameFrom.value : null,
              u_frameTo: glass.sharedUniforms.u_frameTo ? glass.sharedUniforms.u_frameTo.value : null,
              u_frameRatio: glass.sharedUniforms.u_frameRatio ? glass.sharedUniforms.u_frameRatio.value : null,
              u_fragmentScale: glass.sharedUniforms.u_fragmentScale ? glass.sharedUniforms.u_fragmentScale.value : null
            };
          }
        }
      }

      return {
        r,
        introRatio: gt ? gt.introRatio : 0,
        isIntroWarp: prop ? prop.isIntroWarp : false,
        hasStarted: prop ? prop.hasStarted : false,
        stage: window.visuals && window.visuals.currentStage3D ? window.visuals.currentStage3D.constructor.name : null,
        isBlackTunnelActive: gt ? gt.isBlackTunnelActive : false,
        isWhiteTunnelActive: gt ? gt.isWhiteTunnelActive : false,
        blackTunnelRatio: gt ? gt.blackTunnelRatio : 0,
        whiteTunnelRatio: gt ? gt.whiteTunnelRatio : 0,
        bloomAmount: prop ? prop.bloomAmount : 0,
        bgColor: prop && prop.bgColor ? '#' + prop.bgColor.getHexString() : null,
        // Glass state
        glassRatio,
        glassContainerVisible,
        glassMeshActive,
        glassShaderMaterialActive,
        glassMeshPieceCount,
        glassUniforms
      };
    });

    samples.push(state);

    // Capture Phase A: 0 to 0.4s
    if (!capturedPhaseA && state.r >= 0.1 && state.r < 0.4) {
      capturedPhaseA = true;
      await page.screenshot({ path: 'verify_timeline_phase_A_number_overtake.png' });
      console.log(`-> Captured Phase A (r=${state.r.toFixed(3)}s): Number overtake`);
    }

    // Capture Phase B1: 0.4s to 1.25s (Black cyber grid)
    if (!capturedPhaseB_Black && state.r >= 0.6 && state.r < 1.2) {
      capturedPhaseB_Black = true;
      await page.screenshot({ path: 'verify_timeline_phase_B_black_grid.png' });
      console.log(`-> Captured Phase B1 (r=${state.r.toFixed(3)}s): Black cyber grid`);
    }

    // Capture Phase B2: 1.25s to 1.8s (White tunnel acceleration)
    if (!capturedPhaseB_White && state.r >= 1.4 && state.r < 1.8) {
      capturedPhaseB_White = true;
      await page.screenshot({ path: 'verify_timeline_phase_B_white_accel.png' });
      console.log(`-> Captured Phase B2 (r=${state.r.toFixed(3)}s): White tunnel acceleration`);
    }

    // Capture Phase C: 1.8s to 2.4s (GoalTunnelGlass shattered glass scattering)
    if (!capturedPhaseC_Glass && state.r >= 1.85 && state.r < 2.35 && state.glassContainerVisible) {
      capturedPhaseC_Glass = true;
      await page.screenshot({ path: 'verify_timeline_phase_C_glass_shatter.png' });
      console.log(`-> Captured Phase C (r=${state.r.toFixed(3)}s): GoalTunnelGlass shatter, ratio=${state.glassRatio.toFixed(3)}, meshVisible=${state.glassMeshActive}`);
    }

    // Capture Phase D: Peak whiteout bloom flash as glass shatters
    if (!capturedPhaseD_Whiteout && state.r >= 1.82 && state.r <= 2.1 && state.bloomAmount > 90) {
      capturedPhaseD_Whiteout = true;
      await page.screenshot({ path: 'verify_timeline_phase_D_whiteout_bloom.png' });
      console.log(`-> Captured Phase D (r=${state.r.toFixed(3)}s): Whiteout bloom flash (bloom=${state.bloomAmount.toFixed(1)})`);
    }

    // Capture Hero landing after r >= 2.4s
    if (!capturedHero && !state.isIntroWarp && state.stage === 'HomeBalloons') {
      capturedHero = true;
      await sleep(400);
      await page.screenshot({ path: 'verify_timeline_hero_landing.png' });
      console.log(`-> Captured Hero landing (r=${state.r.toFixed(3)}s): Hero balloons restored cleanly!`);
      break;
    }

    await sleep(25);
  }

  // Filter samples during Phase C (1.8s to 2.4s)
  const phaseCSamples = samples.filter(s => s.r >= 1.8 && s.r <= 2.4);
  console.log(`\nPhase C samples recorded: ${phaseCSamples.length}`);
  if (phaseCSamples.length > 0) {
    const midC = phaseCSamples[Math.floor(phaseCSamples.length / 2)];
    console.log('Sample in middle of Phase C:', JSON.stringify(midC, null, 2));
  }

  // Check mid-page #home-goal scroll integrity
  console.log('\nTesting mid-page #home-goal scroll integrity...');
  await page.evaluate(() => {
    window.scrollManager && window.scrollManager.scrollTo && window.scrollManager.scrollTo('home-goal', 0, true);
  });
  await sleep(1000);

  const midPageState = await page.evaluate(() => {
    const gt = window.goalTunnels;
    const glass = window.goalTunnelGlass;
    return {
      stage: window.visuals && window.visuals.currentStage3D ? window.visuals.currentStage3D.constructor.name : null,
      goalTunnelsActive: gt ? gt.isActive : false,
      scrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : 0,
      glassContainerExists: !!(glass && glass.container),
      glassMeshExists: !!(glass && glass.mesh)
    };
  });
  console.log('Mid-page #home-goal state:', midPageState);
  await page.screenshot({ path: 'verify_timeline_midpage_goal.png' });

  // Save report
  fs.writeFileSync('report_glass_shatter_verification.json', JSON.stringify({
    capturedPhaseA,
    capturedPhaseB_Black,
    capturedPhaseB_White,
    capturedPhaseC_Glass,
    capturedPhaseD_Whiteout,
    capturedHero,
    midPageState,
    sampleCount: samples.length,
    phaseCSamplesCount: phaseCSamples.length,
    phaseCSample: phaseCSamples[Math.floor(phaseCSamples.length / 2)] || null,
    consoleErrors
  }, null, 2), 'utf8');

  console.log('\nVerification complete! Report written to report_glass_shatter_verification.json');
  await browser.close();
})();
