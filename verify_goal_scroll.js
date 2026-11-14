const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

async function run() {
  console.log('Launching browser with Edge...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Page DOM loaded, waiting 8s for WebGL & initial animations...');
  await new Promise(r => setTimeout(r, 8000));

  // Get layout positions
  const layout = await page.evaluate(() => {
    const members = document.querySelector('#home-members');
    const goal = document.querySelector('#home-goal');
    const goalContext = document.querySelector('#home-goal-context');
    const endSection = document.querySelector('#end-section');
    const footer = document.querySelector('#footer-section');
    return {
      membersTop: members ? members.offsetTop : null,
      goalTop: goal ? goal.offsetTop : null,
      goalContextTop: goalContext ? goalContext.offsetTop : null,
      endSectionTop: endSection ? endSection.offsetTop : null,
      footerTop: footer ? footer.offsetTop : null,
      bodyHeight: document.body.scrollHeight
    };
  });
  console.log('Layout positions:', JSON.stringify(layout, null, 2));

  async function getDiag() {
    return await page.evaluate(() => {
      const g = window.goalTunnels;
      const appBg = window.properties ? window.properties.bgColor : null;
      let hexBg = null;
      if (appBg && typeof appBg.getHexString === 'function') {
        hexBg = '#' + appBg.getHexString();
      }
      const goalContext = document.querySelector('#home-goal-context');
      let gcVisible = false;
      let gcStyles = null;
      if (goalContext) {
        const rect = goalContext.getBoundingClientRect();
        gcVisible = rect.top < window.innerHeight && rect.bottom > 0;
        const cs = window.getComputedStyle(goalContext);
        gcStyles = {
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          opacity: cs.opacity,
          rectTop: Math.round(rect.top),
          rectBottom: Math.round(rect.bottom)
        };
      }
      return {
        scrollY: Math.round(window.scrollY),
        hexBg,
        gcVisible,
        gcStyles,
        isBlackTunnelActive: g ? g.isBlackTunnelActive : null,
        isWhiteTunnelActive: g ? g.isWhiteTunnelActive : null,
        stage: window.__lusion && window.__lusion.visuals && window.__lusion.visuals.currentStage3D ? window.__lusion.visuals.currentStage3D.constructor.name : null
      };
    });
  }

  // 1. Scroll directly to #home-members
  console.log('--- 1. Navigating to #home-members ---');
  await page.evaluate((top) => {
    window.scrollTo({ top: top, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  }, layout.membersTop);
  await new Promise(r => setTimeout(r, 2000));
  let diag = await getDiag();
  console.log('Members state:', JSON.stringify(diag));
  const file1 = path.join(targetDir, 'goal_verify_01_members.png');
  await page.screenshot({ path: file1 });
  console.log('Saved:', file1);

  // 2. Scroll progressively toward #home-goal-context
  console.log('--- 2. Scrolling smoothly toward #home-goal-context ---');
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel({ deltaY: 300 });
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1500));
  diag = await getDiag();
  console.log('Transition state:', JSON.stringify(diag));
  const file2 = path.join(targetDir, 'goal_verify_02_transition.png');
  await page.screenshot({ path: file2 });
  console.log('Saved:', file2);

  // 3. Scroll directly into #home-goal-context
  console.log('--- 3. In #home-goal-context (operating guidelines) ---');
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel({ deltaY: 350 });
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1500));
  diag = await getDiag();
  console.log('Goal context state:', JSON.stringify(diag));
  const file3 = path.join(targetDir, 'goal_verify_03_context_black.png');
  await page.screenshot({ path: file3 });
  console.log('Saved:', file3);

  // 4. Continue scrolling past goal-context to end-section
  console.log('--- 4. Scrolling past goal-context toward end-section ---');
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel({ deltaY: 400 });
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1500));
  diag = await getDiag();
  console.log('End section state:', JSON.stringify(diag));
  const file4 = path.join(targetDir, 'goal_verify_04_end_section.png');
  await page.screenshot({ path: file4 });
  console.log('Saved:', file4);

  // 5. Scroll to footer
  console.log('--- 5. Scrolling to footer-section ---');
  for (let i = 0; i < 12; i++) {
    await page.mouse.wheel({ deltaY: 450 });
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1500));
  diag = await getDiag();
  console.log('Footer state:', JSON.stringify(diag));
  const file5 = path.join(targetDir, 'goal_verify_05_footer.png');
  await page.screenshot({ path: file5 });
  console.log('Saved:', file5);

  await browser.close();
  console.log('=== All 5 screenshots saved successfully! ===');
}

run().catch(err => {
  console.error('Error during execution:', err);
  process.exit(1);
});
