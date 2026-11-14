const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait for initial load
  await page.waitForFunction(() => window.scrollManager && window.homePage, { timeout: 15000 });

  const metrics = await page.evaluate(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const scrollHeight = document.documentElement.scrollHeight;
    const bodyHeight = document.body.scrollHeight;
    const pageContainer = document.getElementById('page-container');
    const containerHeight = pageContainer ? pageContainer.getBoundingClientRect().height : null;

    // Query sections
    const sections = ['#home-hero', '#home-reel', '#home-featured', '#home-members', '#home-goal', '#end-section', '#footer-section'];
    const sectionInfo = {};
    for (const s of sections) {
      const el = document.querySelector(s);
      if (el) {
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        sectionInfo[s] = {
          top: top,
          height: rect.height,
          bottom: top + rect.height
        };
      } else {
        sectionInfo[s] = null;
      }
    }

    // Scroll manager max scroll
    const maxScroll = window.scrollManager.maxScroll || (scrollHeight - vh);

    return {
      vw,
      vh,
      scrollHeight,
      bodyHeight,
      containerHeight,
      maxScroll,
      scrollManagerContentSize: window.scrollManager.contentSize,
      sectionInfo
    };
  });

  console.log('=== PAGE METRICS (DESKTOP 1920x1080) ===');
  console.log(JSON.stringify(metrics, null, 2));

  // Now test line visibility and a across scroll range
  const scrollTestValues = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 7000, 8000];
  console.log('\n=== SCROLL TEST RANGE ===');
  for (const sy of scrollTestValues) {
    const status = await page.evaluate((targetY) => {
      window.scrollManager.scrollToPixel(targetY, true);
      
      // Look for lines
      let line0Info = null;
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
          line0Info = {
            meshVisible: obj.visible,
            innerContainerVisible: obj.parent ? obj.parent.visible : null,
            containerVisible: obj.parent && obj.parent.parent ? obj.parent.parent.visible : null,
            showRatio: obj.material.uniforms.u_showRatio ? obj.material.uniforms.u_showRatio.value : null,
            innerPosY: obj.parent ? obj.parent.position.y : null,
            scrollPixel: window.scrollManager.scrollPixel
          };
        }
      });
      return line0Info;
    }, sy);
    console.log(`Scroll ${sy}px:`, JSON.stringify(status));
  }

  // Mobile test (390x844)
  console.log('\n=== MOBILE METRICS (390x844) ===');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForFunction(() => window.scrollManager && window.homePage, { timeout: 15000 });

  const mobileMetrics = await mobilePage.evaluate(() => {
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const scrollHeight = document.documentElement.scrollHeight;
    const sections = ['#home-hero', '#home-reel', '#home-featured', '#home-members', '#home-goal', '#end-section', '#footer-section'];
    const sectionInfo = {};
    for (const s of sections) {
      const el = document.querySelector(s);
      if (el) {
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        sectionInfo[s] = {
          top: top,
          height: rect.height,
          bottom: top + rect.height
        };
      }
    }
    return { vw, vh, scrollHeight, sectionInfo };
  });
  console.log(JSON.stringify(mobileMetrics, null, 2));

  await browser.close();
})();
