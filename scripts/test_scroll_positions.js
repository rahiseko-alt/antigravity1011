import puppeteer from 'puppeteer-core';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 7000));

  const info = await page.evaluate(() => {
    const getRect = id => {
      const el = document.getElementById(id) || document.querySelector(id);
      if (!el) return null;
      return {
        top: el.offsetTop,
        height: el.offsetHeight,
        id: el.id || el.className
      };
    };
    return {
      hero: getRect('home-hero'),
      reel: getRect('home-reel'),
      featured: getRect('home-featured'),
      ctaGroup: getRect('.initiatives-cta-group'),
      members: getRect('home-members'),
      goal: getRect('home-goal'),
      goalDetails: getRect('home-goal-details-btn'),
      maxScroll: window.scrollManager ? window.scrollManager.contentSizePixel : null
    };
  });

  console.log("Section positions:", JSON.stringify(info, null, 2));

  // Now scroll right to ctaGroup.top
  if (info.ctaGroup) {
    console.log("Scrolling to ctaGroup:", info.ctaGroup.top);
    await page.evaluate(y => {
      window.scrollManager.scrollPixel = y - 300;
      window.scrollManager.targetScrollPixel = y - 300;
      window.scrollManager.syncDom();
    }, info.ctaGroup.top);
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'verify_direct_cta_group.png' });
    console.log("Saved verify_direct_cta_group.png");
  }

  // Scroll to goalDetails
  if (info.goal) {
    console.log("Scrolling to goal:", info.goal.top);
    await page.evaluate(y => {
      window.scrollManager.scrollPixel = y;
      window.scrollManager.targetScrollPixel = y;
      window.scrollManager.syncDom();
    }, info.goal.top);
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'verify_direct_home_goal.png' });
    console.log("Saved verify_direct_home_goal.png");
  }

  await browser.close();
})();
