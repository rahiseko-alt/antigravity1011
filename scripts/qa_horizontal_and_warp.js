const puppeteer = require('puppeteer-core');
const fs = require('fs');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function getBrowserPath() {
  if (fs.existsSync(CHROME_PATH)) return CHROME_PATH;
  if (fs.existsSync(EDGE_PATH)) return EDGE_PATH;
  throw new Error('No browser executable found!');
}

async function runDesktopQA(browser) {
  console.log('\n=== Starting Test A: Desktop (1920x1080) ===');
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 30000 });
  await sleep(1500);

  const layout = await page.evaluate(() => {
    const members = document.getElementById('home-members');
    const range = window.scrollManager.getDomRange(members);
    const vh = window.innerHeight;
    const height = range.height || members.offsetHeight || (vh * 4);
    const scrollable = Math.max(1, height - vh);
    return {
      top: range.top,
      height: height,
      scrollable: scrollable,
      vh: vh
    };
  });

  console.log('Desktop Layout:', layout);

  const slides = [
    { name: 'member_page_desktop_01.png', pct: 0.00, label: 'Slide 1: 小齊平 (0%)' },
    { name: 'member_page_desktop_02.png', pct: 0.33, label: 'Slide 2: 伊藤 (33%)' },
    { name: 'member_page_desktop_03.png', pct: 0.66, label: 'Slide 3: 堺 (66%)' },
    { name: 'member_page_desktop_04.png', pct: 1.00, label: 'Slide 4: 岡本 (100%)' }
  ];

  for (const s of slides) {
    const scrollTarget = layout.top + layout.scrollable * s.pct;
    console.log(`Scrolling to ${s.label} at target px ${Math.round(scrollTarget)}...`);
    await page.evaluate(px => {
      window.scrollManager.scrollToPixel(px, true);
    }, scrollTarget);
    await sleep(900);

    // Get current transform and active elements
    const state = await page.evaluate(() => {
      const pin = document.getElementById('home-members-pin');
      const track = document.getElementById('home-members-track');
      const hud = document.getElementById('home-members-hud-page') || document.getElementById('home-members-progress-bar');
      const activeSlide = document.querySelector('.member-slide.is-active') || document.querySelector('.member-slide');
      return {
        pinTransform: pin ? pin.style.transform : 'none',
        trackTransform: track ? track.style.transform : 'none',
        hudText: hud ? hud.innerText : 'none'
      };
    });
    console.log(`State at ${s.pct * 100}%:`, state);

    await page.screenshot({ path: s.name, fullPage: false });
    console.log(`Saved screenshot: ${s.name}`);
  }

  // Scroll past #home-members into #home-goal
  console.log('Testing transition into #home-goal...');
  const goalTarget = layout.top + layout.scrollable + 600;
  await page.evaluate(px => {
    window.scrollManager.scrollToPixel(px, true);
  }, goalTarget);
  await sleep(900);

  const goalState = await page.evaluate(() => {
    const goal = document.getElementById('home-goal');
    const range = window.scrollManager.getDomRange(goal);
    return {
      goalTop: Math.round(range.screenY),
      isActive: range.isActive
    };
  });
  console.log('Goal State after scrolling past members:', goalState);
  await page.screenshot({ path: 'member_page_desktop_goal.png', fullPage: false });
  console.log('Saved screenshot: member_page_desktop_goal.png');

  await page.close();
}

async function runMobileQA(browser) {
  console.log('\n=== Starting Test B: Mobile Smartphone (390x844 iPhone 14) ===');
  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 30000 });
  await sleep(1500);

  const layout = await page.evaluate(() => {
    const members = document.getElementById('home-members');
    const range = window.scrollManager.getDomRange(members);
    const vh = window.innerHeight;
    const height = range.height || members.offsetHeight || (vh * 4);
    const scrollable = Math.max(1, height - vh);
    return {
      top: range.top,
      height: height,
      scrollable: scrollable,
      vh: vh,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight
    };
  });

  console.log('Mobile Layout:', layout);

  const slides = [
    { name: 'member_page_mobile_01.png', pct: 0.00, label: 'Slide 1: 小齊平 (0%)' },
    { name: 'member_page_mobile_02.png', pct: 0.33, label: 'Slide 2: 伊藤 (33%)' },
    { name: 'member_page_mobile_03.png', pct: 0.66, label: 'Slide 3: 堺 (66%)' },
    { name: 'member_page_mobile_04.png', pct: 1.00, label: 'Slide 4: 岡本 (100%)' }
  ];

  for (const s of slides) {
    const scrollTarget = layout.top + layout.scrollable * s.pct;
    console.log(`Mobile: Scrolling to ${s.label} at target px ${Math.round(scrollTarget)}...`);
    await page.evaluate(px => {
      window.scrollManager.scrollToPixel(px, true);
    }, scrollTarget);
    await sleep(900);

    const check = await page.evaluate(() => {
      const pin = document.getElementById('home-members-pin');
      const track = document.getElementById('home-members-track');
      const slides = Array.from(document.querySelectorAll('.member-slide'));
      const activeSlide = slides.find(el => {
        const r = el.getBoundingClientRect();
        return r.left >= -50 && r.left < window.innerWidth * 0.5;
      }) || slides[0];

      return {
        bodyScrollWidth: document.body.scrollWidth,
        windowWidth: window.innerWidth,
        pinTransform: pin ? pin.style.transform : 'none',
        trackTransform: track ? track.style.transform : 'none',
        hasHorizontalOverflow: document.body.scrollWidth > window.innerWidth,
        activeSlideName: activeSlide ? (activeSlide.querySelector('.member-slide-name') || {}).innerText : 'N/A'
      };
    });
    console.log(`Mobile State at ${s.pct * 100}%:`, check);

    await page.screenshot({ path: s.name, fullPage: false });
    console.log(`Saved screenshot: ${s.name}`);
  }

  await page.close();
}

async function runWarpCheck(browser) {
  console.log('\n=== Starting Test C: Warp Bold Arial Text Check ===');
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.goalTunnels && window.goalTunnels.hasIntroInitialized, { timeout: 35000 });

  // Phase 1: PLAY WITH AI (t ~ 1.8s)
  await page.evaluate(elapsed => {
    window.goalTunnels.introStartTime = performance.now() - (elapsed * 1000);
    window.visuals.syncProperties(1/60);
    window.visuals.update(1/60);
  }, 1.8);
  await sleep(150);

  const phase1Styles = await page.evaluate(() => {
    const el = document.querySelector('#tunnel-title-phase1 .home-goal-tunnel-title-line');
    const comp = el ? window.getComputedStyle(el) : null;
    return comp ? {
      fontFamily: comp.fontFamily,
      fontWeight: comp.fontWeight,
      fontSize: comp.fontSize,
      textShadow: comp.textShadow,
      color: comp.color
    } : null;
  });
  console.log('Phase 1 Warp Text Styles:', phase1Styles);
  await page.screenshot({ path: 'bold_warp_phase1.png' });
  console.log('Saved bold_warp_phase1.png');

  // Phase 2: THIS WAY TOGETHER (t ~ 3.8s)
  await page.evaluate(elapsed => {
    window.goalTunnels.introStartTime = performance.now() - (elapsed * 1000);
    window.visuals.syncProperties(1/60);
    window.visuals.update(1/60);
  }, 3.8);
  await sleep(150);

  const phase2Styles = await page.evaluate(() => {
    const el = document.querySelector('#tunnel-title-phase2 .home-goal-tunnel-title-line');
    const comp = el ? window.getComputedStyle(el) : null;
    return comp ? {
      fontFamily: comp.fontFamily,
      fontWeight: comp.fontWeight,
      fontSize: comp.fontSize,
      textShadow: comp.textShadow,
      color: comp.color
    } : null;
  });
  console.log('Phase 2 Warp Text Styles:', phase2Styles);
  await page.screenshot({ path: 'bold_warp_phase2.png' });
  console.log('Saved bold_warp_phase2.png');

  await page.close();
}

(async () => {
  const execPath = getBrowserPath();
  console.log(`Using browser: ${execPath}`);
  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--no-sandbox',
      '--window-size=1920,1080'
    ]
  });

  try {
    await runDesktopQA(browser);
    await runMobileQA(browser);
    await runWarpCheck(browser);
    console.log('\n=== ALL QA TESTS COMPLETED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('QA Test encountered an error:', err);
  } finally {
    await browser.close();
  }
})();
