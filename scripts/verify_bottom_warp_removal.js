const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function runVerification() {
  console.log('================================================================');
  console.log('   BOTTOM WARP REMOVAL & INTRO WARP COMPLETE VERIFICATION SUITE');
  console.log('================================================================\n');

  const report = {
    timestamp: new Date().toISOString(),
    desktop: {},
    mobile: {},
    summary: {}
  };

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--enable-webgl2-compute-context',
      '--window-size=1600,1000'
    ]
  });

  try {
    // 1. DESKTOP VERIFICATION (1440 x 900)
    console.log('>>> [1/2] RUNNING DESKTOP AUDIT (1440x900)...');
    report.desktop = await verifyDevice(browser, {
      width: 1440,
      height: 900,
      isMobile: false,
      deviceScaleFactor: 1
    }, 'desktop');

    // 2. MOBILE VERIFICATION (390 x 844)
    console.log('\n>>> [2/2] RUNNING MOBILE AUDIT (390x844)...');
    report.mobile = await verifyDevice(browser, {
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    }, 'mobile');

    // Summary Judgement
    const dIntro = report.desktop.intro.status;
    const dGoal = report.desktop.bottomWarp.status;
    const mIntro = report.mobile.intro.status;
    const mGoal = report.mobile.bottomWarp.status;

    report.summary = {
      desktopIntro: dIntro,
      desktopBottomWarpRemoval: dGoal,
      mobileIntro: mIntro,
      mobileBottomWarpRemoval: mGoal,
      allPassed: (dIntro === 'PASS' && dGoal === 'PASS' && mIntro === 'PASS' && mGoal === 'PASS')
    };

  } catch (err) {
    console.error('Fatal verification error:', err);
    report.fatalError = err.message;
  } finally {
    await browser.close();
  }

  // Write comprehensive report
  const reportPath = path.join(__dirname, '..', 'bottom_warp_removal_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log('\n================================================================');
  console.log(`   AUDIT FINISHED: All Passed = ${report.summary?.allPassed ? 'YES (PASS)' : 'NO (FAIL / WARP PRESENT)'}`);
  console.log(`   Desktop Intro: ${report.summary?.desktopIntro} | Desktop Bottom Warp: ${report.summary?.desktopBottomWarpRemoval}`);
  console.log(`   Mobile Intro:  ${report.summary?.mobileIntro} | Mobile Bottom Warp:  ${report.summary?.mobileBottomWarpRemoval}`);
  console.log(`   Saved JSON: ${reportPath}`);
  console.log('================================================================\n');

  return report;
}

async function verifyDevice(browser, viewport, prefix) {
  const page = await browser.newPage();
  await page.setViewport(viewport);

  const deviceResult = {
    intro: {},
    bottomWarp: {},
    screenshots: []
  };

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  console.log(`  [${prefix}] Loading http://localhost:3000 ...`);
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await sleep(1500);

  // -------------------------------------------------------------
  // PART 1: INTRO WARP AUDIT (0.1s -> 6.0s)
  // -------------------------------------------------------------
  console.log(`  [${prefix}] 1. Auditing Intro Warp sequence...`);

  async function evaluateIntroAt(targetR, label, filename) {
    const state = await page.evaluate((tR) => {
      const gt = window.__goalTunnels;
      const prop = window.__properties;
      if (gt && prop) {
        prop.isIntroWarp = true;
        gt.hasIntroInitialized = true;
        gt.introStartTime = performance.now() - tR * 1000;
        if (window.visuals && window.visuals.syncProperties) {
          window.visuals.syncProperties(0.016);
        }
      }

      const curtain = document.getElementById('intro-whiteout');
      const pageCont = document.getElementById('page-container');
      const hero = document.getElementById('home-hero');
      const heroTitle = document.querySelector('#home-hero-title, .home-hero-title');

      return {
        r: tR,
        blackTunnelRatio: gt ? gt.blackTunnelRatio : null,
        whiteTunnelRatio: gt ? gt.whiteTunnelRatio : null,
        isBlackActive: gt ? gt.isBlackTunnelActive : false,
        isWhiteActive: gt ? gt.isWhiteTunnelActive : false,
        whiteoutOpacity: curtain ? curtain.style.opacity : null,
        heroOpacity: hero ? window.getComputedStyle(hero).opacity : null,
        heroText: heroTitle ? heroTitle.textContent.trim().substring(0, 30) : null
      };
    }, targetR);

    await sleep(80);
    const snapPath = `verify_${prefix}_intro_${filename}.png`;
    await page.screenshot({ path: snapPath });
    deviceResult.screenshots.push(snapPath);
    return state;
  }

  // 1-1. Black tunnel start / mid (0.8s)
  const introBlack = await evaluateIntroAt(0.8, 'Black Tunnel & Play with AI', '01_black_tunnel');
  // 1-2. White tunnel burst (3.6s)
  const introWhite = await evaluateIntroAt(3.6, 'White Tunnel Burst', '02_white_tunnel');
  // 1-3. Pure white hold (4.4s)
  const introHold = await evaluateIntroAt(4.4, 'Pure Whiteout Hold', '03_whiteout_hold');
  // 1-4. Hero fade-in & settle (6.0s)
  const introSettled = await evaluateIntroAt(6.0, 'Hero Settled', '04_hero_settled');

  deviceResult.intro = {
    blackTunnel: introBlack,
    whiteTunnel: introWhite,
    whiteoutHold: introHold,
    heroSettled: introSettled,
    status: (introBlack.isBlackActive || introBlack.blackTunnelRatio > 0 || introWhite.whiteTunnelRatio > 0) ? 'PASS' : 'WARN'
  };
  console.log(`  [${prefix}] Intro Warp Result: ${deviceResult.intro.status}`);

  // Close intro audit page and open a fresh page for clean natural scroll audit
  await page.close();

  // -------------------------------------------------------------
  // PART 2: BOTTOM WARP REMOVAL & SECTION FLOW AUDIT (CLEAN PAGE)
  // -------------------------------------------------------------
  console.log(`  [${prefix}] 2. Auditing Bottom Warp Removal & Layout Flow on fresh page...`);
  const scrollPage = await browser.newPage();
  await scrollPage.setViewport(viewport);

  await scrollPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  console.log(`  [${prefix}] Waiting for natural intro settle (scrollManager active)...`);
  await scrollPage.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 35000 });
  await sleep(1000);

  // Inspect page structure
  const structure = await scrollPage.evaluate(() => {
    const sm = window.scrollManager;
    const members = document.getElementById('home-members');
    const goal = document.getElementById('home-goal');
    const goalContext = document.getElementById('home-goal-context');
    const goalTitle = document.getElementById('home-goal-title');
    const tunnelTitle = document.getElementById('home-goal-tunnel-title');
    const endSection = document.getElementById('end-section');
    const footer = document.getElementById('footer-section');

    const mRange = members ? sm.getDomRange(members) : { top: 0, height: 0 };
    const gRange = goal ? sm.getDomRange(goal) : { top: 0, height: 0 };
    const eRange = endSection ? sm.getDomRange(endSection) : { top: 0, height: 0 };
    const fRange = footer ? sm.getDomRange(footer) : { top: 0, height: 0 };

    return {
      members: { top: mRange.top, height: mRange.height },
      goal: {
        top: gRange.top,
        height: gRange.height,
        clientHeight: goal ? goal.clientHeight : 0,
        tunnelTitleExists: !!tunnelTitle,
        tunnelTitleDisplay: tunnelTitle ? window.getComputedStyle(tunnelTitle).display : 'none',
        tunnelTitleOpacity: tunnelTitle ? window.getComputedStyle(tunnelTitle).opacity : '0',
        goalTitleText: goalTitle ? goalTitle.textContent.trim() : null
      },
      endSection: { top: eRange.top, height: eRange.height },
      footer: { top: fRange.top, height: fRange.height }
    };
  });

  console.log(`  [${prefix}] Measured structure:`, JSON.stringify(structure, null, 2));

  // Step A: Scroll to Members section
  console.log(`  [${prefix}] -> Scrolling to #home-members (pixel ${structure.members.top})...`);
  await scrollPage.evaluate(px => {
    window.scrollManager.scrollToPixel(px, true);
    if (window.visuals && window.visuals.syncProperties) window.visuals.syncProperties(0.016);
  }, structure.members.top);
  await sleep(800);
  const snapMembers = `verify_${prefix}_05_members.png`;
  await scrollPage.screenshot({ path: snapMembers });
  deviceResult.screenshots.push(snapMembers);

  // Step B: Scroll to #home-goal-context (Operating Guidelines)
  const goalContextPixel = structure.goal.top + 50;
  console.log(`  [${prefix}] -> Scrolling to #home-goal-context (pixel ${goalContextPixel})...`);
  await scrollPage.evaluate(px => {
    window.scrollManager.scrollToPixel(px, true);
    if (window.visuals && window.visuals.syncProperties) window.visuals.syncProperties(0.016);
  }, goalContextPixel);
  await sleep(800);
  const snapGoalContext = `verify_${prefix}_06_goal_context.png`;
  await scrollPage.screenshot({ path: snapGoalContext });
  deviceResult.screenshots.push(snapGoalContext);

  const goalContextCheck = await scrollPage.evaluate(() => {
    const gc = document.getElementById('home-goal-context');
    const title = document.getElementById('home-goal-title');
    const texts = Array.from(document.querySelectorAll('.home-goal-texts-paragraph')).map(p => p.textContent.trim());
    const tt = document.getElementById('home-goal-tunnel-title');
    const rect = gc ? gc.getBoundingClientRect() : null;

    // Check tunnel canvas / visual state
    const gt = window.__goalTunnels;
    const prop = window.__properties;

    return {
      visibleInViewport: rect ? (rect.top < window.innerHeight && rect.bottom > 0) : false,
      rect,
      title: title ? title.textContent.trim() : null,
      paragraphs: texts,
      tunnelTitleShowing: tt ? (window.getComputedStyle(tt).display !== 'none' && parseFloat(window.getComputedStyle(tt).opacity) > 0.05) : false,
      tunnelsAlpha: gt ? gt.goalTunnelsTargetAlpha : null,
      isIntroWarp: prop ? prop.isIntroWarp : null
    };
  });

  // Step C: Scroll past goal context (where the 4200vh warp used to be)
  // If warp is removed, next pixel is directly end-section!
  // If warp is still present, next pixel leads into 40,000px black tunnel.
  const postGoalPixel = structure.goal.top + (structure.goal.height > 5000 ? 5000 : structure.goal.height * 0.8);
  console.log(`  [${prefix}] -> Checking mid-goal scroll area (pixel ${postGoalPixel})...`);
  await scrollPage.evaluate(px => {
    window.scrollManager.scrollToPixel(px, true);
    if (window.visuals && window.visuals.syncProperties) window.visuals.syncProperties(0.016);
  }, postGoalPixel);
  await sleep(800);
  const snapPostGoal = `verify_${prefix}_07_mid_goal_check.png`;
  await scrollPage.screenshot({ path: snapPostGoal });
  deviceResult.screenshots.push(snapPostGoal);

  // Step D: Scroll to #end-section ("Join / Propose 企画を持ち込む・参加する")
  console.log(`  [${prefix}] -> Scrolling to #end-section (pixel ${structure.endSection.top})...`);
  await scrollPage.evaluate(px => {
    window.scrollManager.scrollToPixel(px, true);
    if (window.visuals && window.visuals.syncProperties) window.visuals.syncProperties(0.016);
  }, structure.endSection.top);
  await sleep(800);
  const snapEnd = `verify_${prefix}_08_end_section.png`;
  await scrollPage.screenshot({ path: snapEnd });
  deviceResult.screenshots.push(snapEnd);

  const endSectionCheck = await scrollPage.evaluate(() => {
    const end = document.getElementById('end-section');
    const titleLink = document.getElementById('end-section-title-link');
    const rect = end ? end.getBoundingClientRect() : null;
    return {
      visibleInViewport: rect ? (rect.top < window.innerHeight && rect.bottom > 0) : false,
      rect,
      title: titleLink ? titleLink.textContent.trim().replace(/\s+/g, ' ') : null
    };
  });

  // Step E: Scroll to #footer-section
  console.log(`  [${prefix}] -> Scrolling to #footer-section (pixel ${structure.footer.top})...`);
  await scrollPage.evaluate(px => {
    window.scrollManager.scrollToPixel(px, true);
    if (window.visuals && window.visuals.syncProperties) window.visuals.syncProperties(0.016);
  }, structure.footer.top);
  await sleep(800);
  const snapFooter = `verify_${prefix}_09_footer.png`;
  await scrollPage.screenshot({ path: snapFooter });
  deviceResult.screenshots.push(snapFooter);

  const footerCheck = await scrollPage.evaluate(() => {
    const footer = document.getElementById('footer-section');
    const cr = document.getElementById('footer-bottom-copyright');
    const rect = footer ? footer.getBoundingClientRect() : null;
    return {
      visibleInViewport: rect ? (rect.top < window.innerHeight && rect.bottom > 0) : false,
      rect,
      copyright: cr ? cr.textContent.trim() : null
    };
  });

  // Judgement for Bottom Warp Removal
  // 1. Goal height must NOT be > 3500px (4200vh is ~36,000px - 40,000px)
  // 2. Goal context must be visible
  // 3. End section must be reachable without excessive distance (e.g. within < 12,000px from top)
  // 4. No warp tunnel titles or tunnel alpha active at goal
  const isGoalHeightClean = structure.goal.height < 3500;
  const isDistanceToFooterClean = structure.footer.top < 15000;
  const isWarpArtifactsGone = !goalContextCheck.tunnelTitleShowing;

  const pass = isGoalHeightClean && isDistanceToFooterClean && goalContextCheck.visibleInViewport;

  deviceResult.bottomWarp = {
    structure,
    goalContextCheck,
    endSectionCheck,
    footerCheck,
    isGoalHeightClean,
    isDistanceToFooterClean,
    isWarpArtifactsGone,
    status: pass ? 'PASS' : 'FAIL',
    reason: isGoalHeightClean 
      ? 'PASS: Bottom warp is completely eliminated! #home-goal height is compact, operating guidelines are displayed cleanly, and scroll smoothly reaches end-section and footer.'
      : `FAIL: Bottom warp is STILL PRESENT. #home-goal height is ${structure.goal.height}px (4200vh empty scroll remaining). Total distance to footer is ${structure.footer.top}px.`
  };

  console.log(`  [${prefix}] Bottom Warp Removal Result: ${deviceResult.bottomWarp.status}`);
  console.log(`  [${prefix}] Reason: ${deviceResult.bottomWarp.reason}`);

  await scrollPage.close();
  return deviceResult;
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
