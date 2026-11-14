const puppeteer = require('puppeteer-core');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

(async () => {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // wait for intro settle
  await page.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 30000 });

  const metrics = await page.evaluate(() => {
    const sm = window.scrollManager;
    const members = document.getElementById('home-members');
    const goal = document.getElementById('home-goal');
    const goalContext = document.getElementById('home-goal-context');
    const tunnelTitle = document.getElementById('home-goal-tunnel-title');
    const endSection = document.getElementById('end-section');
    const footer = document.getElementById('footer-section');

    return {
      maxScroll: sm.maxScroll,
      scrollPixel: sm.scrollPixel,
      membersRange: sm.getDomRange(members),
      goalRange: sm.getDomRange(goal),
      endRange: sm.getDomRange(endSection),
      footerRange: sm.getDomRange(footer),
      goalClientHeight: goal ? goal.clientHeight : null,
      tunnelTitleDisplay: tunnelTitle ? window.getComputedStyle(tunnelTitle).display : null,
      tunnelTitleOpacity: tunnelTitle ? window.getComputedStyle(tunnelTitle).opacity : null,
      goalContextOffsetTop: goalContext ? goalContext.offsetTop : null,
      propGoalTunnels: window.__goalTunnels ? {
        hasIntroInitialized: window.__goalTunnels.hasIntroInitialized,
        goalTunnelsTargetAlpha: window.__goalTunnels.goalTunnelsTargetAlpha
      } : null
    };
  });

  console.log('DOM & Scroll Metrics:', JSON.stringify(metrics, null, 2));

  await browser.close();
})();
