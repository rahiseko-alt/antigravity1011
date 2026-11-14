const puppeteer = require('puppeteer-core');
const fs = require('fs');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runTest(viewport, prefix) {
  console.log(`\n========================================`);
  console.log(`Testing viewport: ${viewport.width}x${viewport.height} (${prefix})`);
  console.log(`========================================`);

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--no-sandbox',
      `--window-size=${viewport.width},${viewport.height}`
    ]
  });

  const page = await browser.newPage();
  await page.setViewport(viewport);

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  await page.waitForFunction(() => {
    return window.scrollManager && window.scrollManager.isActive;
  }, { timeout: 20000 });

  await sleep(1500);

  const layout = await page.evaluate(() => {
    const members = document.getElementById('home-members');
    const pin = document.getElementById('home-members-pin');
    const track = document.getElementById('home-members-track');
    const slides = document.querySelectorAll('.member-slide');
    const sm = window.scrollManager;
    const membersRange = sm.getDomRange(members);

    return {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      membersTop: membersRange.top,
      membersHeight: membersRange.height,
      slidesCount: slides.length,
      trackWidth: track ? track.offsetWidth : 0,
      pinWidth: pin ? pin.offsetWidth : 0,
      pinHeight: pin ? pin.offsetHeight : 0
    };
  });

  console.log('Layout:', JSON.stringify(layout, null, 2));

  const membersTop = layout.membersTop;
  const scrollable = layout.membersHeight - layout.windowHeight;

  // 4 slide target positions: progress 0.0, 0.33, 0.66, 1.0
  const testSteps = [
    { name: 'slide1_kosehira', progress: 0.0, desc: 'Slide 1: Kosehira (0%)' },
    { name: 'slide2_ito', progress: 0.333, desc: 'Slide 2: Ito (33.3%)' },
    { name: 'slide3_sakai', progress: 0.666, desc: 'Slide 3: Sakai (66.6%)' },
    { name: 'slide4_okamoto', progress: 1.0, desc: 'Slide 4: Okamoto (100%)' }
  ];

  for (const step of testSteps) {
    const targetPx = membersTop + scrollable * step.progress;
    console.log(`\nNavigating to ${step.desc} at scroll ${Math.round(targetPx)}px...`);
    await page.evaluate(px => {
      window.scrollManager.scrollToPixel(px, true);
    }, targetPx);

    await sleep(600);

    const slideData = await page.evaluate(() => {
      const pin = document.getElementById('home-members-pin');
      const track = document.getElementById('home-members-track');
      const counter = document.getElementById('members-hud-current');
      const bar = document.getElementById('home-members-progress-bar');
      const slides = Array.from(document.querySelectorAll('.member-slide')).map(s => {
        const rect = s.getBoundingClientRect();
        return {
          id: s.getAttribute('data-id'),
          slideNum: s.getAttribute('data-slide'),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          visible: rect.left >= -50 && rect.right <= window.innerWidth + 50
        };
      });

      return {
        counterText: counter ? counter.textContent : '',
        pinTransform: pin.style.transform,
        trackTransform: track.style.transform,
        barTransform: bar.style.transform,
        slides
      };
    });

    console.log(`State at ${step.name}:`, JSON.stringify(slideData, null, 2));

    const shotName = `${prefix}_${step.name}.png`;
    await page.screenshot({ path: shotName, fullPage: false });
    console.log(`Saved screenshot: ${shotName}`);
  }

  await browser.close();
}

(async () => {
  // Desktop 1920x1080
  await runTest({ width: 1920, height: 1080, deviceScaleFactor: 1 }, 'desktop');
  // Mobile 390x844 (iPhone 12/13/14)
  await runTest({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 'mobile');
  console.log('\nAll tests complete!');
})();
