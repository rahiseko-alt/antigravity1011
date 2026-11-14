const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const targetDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

async function run() {
  console.log('=== STARTING GOAL CONTEXT & BOTTOM WARP VERIFICATION ===');
  console.log('Target artifact directory:', targetDir);
  console.log('Chrome path:', chromePath);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-certificate-errors'
    ]
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(60000);
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://127.0.0.1:3000...');
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
  console.log('DOM Content Loaded!');

  console.log('Waiting for intro to settle (approx 9s)...');
  await page.waitForFunction(() => {
    const sm = window.scrollManager;
    const gt = window.__goalTunnels;
    return (sm && sm.isActive) || (gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0);
  }, { timeout: 45000 }).catch(e => console.log('Intro wait notice:', e.message));

  await new Promise(r => setTimeout(r, 2000));

  // Query section details
  const layout = await page.evaluate(() => {
    function getInfo(selector) {
      const el = document.querySelector(selector);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        offsetTop: el.offsetTop,
        offsetHeight: el.offsetHeight,
        rectTop: Math.round(rect.top),
        rectBottom: Math.round(rect.bottom)
      };
    }
    const sm = window.scrollManager;
    return {
      maxScroll: sm ? sm.contentSizePixel - sm.viewSizePixel : document.body.scrollHeight - window.innerHeight,
      contentSize: sm ? sm.contentSizePixel : document.body.scrollHeight,
      viewSize: sm ? sm.viewSizePixel : window.innerHeight,
      members: getInfo('#home-members'),
      goal: getInfo('#home-goal'),
      goalContext: getInfo('#home-goal-context'),
      endSection: getInfo('#end-section'),
      footer: getInfo('#footer-section')
    };
  });
  console.log('Layout info:', JSON.stringify(layout, null, 2));

  async function captureState(filename, label) {
    const state = await page.evaluate(() => {
      const g = window.goalTunnels;
      const appBg = window.properties && window.properties.bgColor ? '#' + window.properties.bgColor.getHexString() : null;
      const sm = window.scrollManager;
      const ctx = document.querySelector('#home-goal-context');
      let ctxData = null;
      if (ctx) {
        const cs = window.getComputedStyle(ctx);
        const rect = ctx.getBoundingClientRect();
        ctxData = {
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          opacity: cs.opacity,
          rectTop: Math.round(rect.top),
          rectBottom: Math.round(rect.bottom)
        };
      }
      return {
        sp: sm ? Math.round(sm.scrollPixel) : null,
        targetSp: sm ? Math.round(sm.targetScrollPixel) : null,
        scrollY: Math.round(window.scrollY),
        appBg,
        ctxData,
        isBlackTunnelActive: g ? g.isBlackTunnelActive : false,
        isWhiteTunnelActive: g ? g.isWhiteTunnelActive : false
      };
    });

    const filePath = path.join(targetDir, filename);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`[Captured ${label}] -> ${filename}`);
    console.log(`  Scroll: sp=${state.sp}, scrollY=${state.scrollY} | BG: ${state.appBg}`);
    console.log(`  Tunnel Active: ${state.isBlackTunnelActive} | Context Text Color: ${state.ctxData ? state.ctxData.color : 'N/A'}`);
    return state;
  }

  // Determine smooth scroll checkpoints
  // 1. Members section
  const memSp = layout.members ? layout.members.offsetTop : 6000;
  // 2. Goal transition point
  const transSp = layout.goal ? layout.goal.offsetTop - 300 : memSp + 600;
  // 3. Goal context inside
  const ctxSp = layout.goalContext ? (layout.goal ? layout.goal.offsetTop + 400 : 7000) : transSp + 700;
  // 4. End section
  const endSp = layout.endSection ? layout.endSection.offsetTop : ctxSp + 1000;
  // 5. Footer section
  const footerSp = layout.maxScroll || (layout.footer ? layout.footer.offsetTop : endSp + 800);

  console.log(`Calculated scrollPixel targets: members=${memSp}, transition=${transSp}, context=${ctxSp}, end=${endSp}, footer=${footerSp}`);

  async function scrollToTarget(targetSp) {
    await page.evaluate(async (sp) => {
      if (window.scrollManager) {
        window.scrollManager.scrollToPixel(sp, true);
      }
      window.scrollTo({ top: sp, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
      // wait 25 render frames
      await new Promise(resolve => {
        let count = 0;
        function step() {
          count++;
          if (count > 25) resolve();
          else requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, targetSp);
    await new Promise(r => setTimeout(r, 600));
  }

  // Step 1: Members section
  console.log('\n--- Step 1: #home-members ---');
  await scrollToTarget(memSp);
  await captureState('goal_verify_1_members.png', 'Step 1: Members Section');

  // Step 2: Smooth transition toward goal context
  console.log('\n--- Step 2: Smooth Dimming Transition toward Goal Context ---');
  await scrollToTarget(transSp);
  await captureState('goal_verify_2_transition_darkening.png', 'Step 2: Transition Dimming');

  // Step 3: Inside #home-goal-context (operating guidelines)
  console.log('\n--- Step 3: #home-goal-context (Pitch Black #000000 & Readable White Text) ---');
  await scrollToTarget(ctxSp);
  await captureState('goal_verify_3_goal_context_black.png', 'Step 3: Goal Context Black');

  // Step 4: Continue scrolling past context to #end-section (NO warp tunnel)
  console.log('\n--- Step 4: Past Context to End Section (No Bottom Warp) ---');
  await scrollToTarget(endSp);
  await captureState('goal_verify_4_end_section_no_warp.png', 'Step 4: End Section No Warp');

  // Step 5: Reach footer naturally
  console.log('\n--- Step 5: Reaching Footer Naturally ---');
  await scrollToTarget(footerSp);
  await captureState('goal_verify_5_footer_reached.png', 'Step 5: Footer Reached');

  await browser.close();
  console.log('\n=== ALL SCREENSHOTS SAVED AND VERIFICATION COMPLETED ===');
}

run().catch(err => {
  console.error('CRITICAL VERIFICATION ERROR:', err);
  process.exit(1);
});
