const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const targetDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';
const logFile = path.join(__dirname, 'verify_progress.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  process.stdout.write(line);
  fs.appendFileSync(logFile, line);
}

async function main() {
  fs.writeFileSync(logFile, 'Starting verification...\n');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  log(`Launching Chrome from ${chromePath}...`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu-sandbox']
  });
  log('Chrome launched successfully.');

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  log('Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 60000 });
  log('Page load event fired! Waiting 6s for assets and initial animation...');
  await new Promise(r => setTimeout(r, 6000));

  // Inspect page dimensions
  const dims = await page.evaluate(() => {
    const mem = document.querySelector('#home-members');
    const goal = document.querySelector('#home-goal');
    const ctx = document.querySelector('#home-goal-context');
    const end = document.querySelector('#end-section');
    const foot = document.querySelector('#footer-section');
    return {
      docHeight: document.body.scrollHeight,
      memTop: mem ? mem.offsetTop : null,
      goalTop: goal ? goal.offsetTop : null,
      ctxTop: ctx ? ctx.offsetTop : null,
      endTop: end ? end.offsetTop : null,
      footTop: foot ? foot.offsetTop : null
    };
  });
  log(`Page dimensions: ${JSON.stringify(dims)}`);

  async function snap(name) {
    const out = path.join(targetDir, `${name}.png`);
    await page.screenshot({ path: out });
    const state = await page.evaluate(() => {
      const g = window.goalTunnels;
      const appBg = window.properties && window.properties.bgColor ? '#' + window.properties.bgColor.getHexString() : null;
      const ctx = document.querySelector('#home-goal-context');
      let ctxStyle = null;
      if (ctx) {
        const s = window.getComputedStyle(ctx);
        const r = ctx.getBoundingClientRect();
        ctxStyle = { color: s.color, top: Math.round(r.top), bottom: Math.round(r.bottom) };
      }
      return {
        scrollY: Math.round(window.scrollY),
        appBg,
        ctxStyle,
        tunnelActive: g ? g.isBlackTunnelActive : false
      };
    });
    log(`Captured ${name}: scrollY=${state.scrollY}, bg=${state.appBg}, tunnelActive=${state.tunnelActive}, ctxTop=${state.ctxStyle ? state.ctxStyle.top : 'N/A'}`);
    return state;
  }

  // Step 1: Scroll to #home-members
  log('--- Step 1: Scroll to #home-members ---');
  await page.evaluate((top) => {
    window.scrollTo({ top: top, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  }, dims.memTop || 3500);
  await new Promise(r => setTimeout(r, 2000));
  await snap('goal_step1_members');

  // Step 2: Scroll toward #home-goal-context
  log('--- Step 2: Scrolling toward #home-goal-context (smooth dimming transition) ---');
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel({ deltaY: 250 });
    await new Promise(r => setTimeout(r, 150));
  }
  await new Promise(r => setTimeout(r, 1500));
  await snap('goal_step2_transition');

  // Step 3: Inside #home-goal-context
  log('--- Step 3: Inside #home-goal-context (dark/black bg, readable text) ---');
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel({ deltaY: 300 });
    await new Promise(r => setTimeout(r, 150));
  }
  await new Promise(r => setTimeout(r, 1500));
  await snap('goal_step3_goal_context_black');

  // Step 4: Continue scrolling to #end-section without warp
  log('--- Step 4: Continue scrolling past context to #end-section ---');
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel({ deltaY: 350 });
    await new Promise(r => setTimeout(r, 150));
  }
  await new Promise(r => setTimeout(r, 1500));
  await snap('goal_step4_end_section');

  // Step 5: Continue scrolling to #footer-section
  log('--- Step 5: Scrolling to footer ---');
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel({ deltaY: 400 });
    await new Promise(r => setTimeout(r, 150));
  }
  await new Promise(r => setTimeout(r, 1500));
  await snap('goal_step5_footer');

  await browser.close();
  log('Verification script completed successfully!');
}

main().catch(err => {
  log(`Error: ${err.stack || err}`);
  process.exit(1);
});
