import puppeteer from 'puppeteer-core';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const mobPage = await browser.newPage();
  await mobPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 10000));

  const info = await mobPage.evaluate(() => {
    const el = document.getElementById('home-goal');
    const container = document.getElementById('page-container');
    const sections = Array.from(document.querySelectorAll('.section')).map(s => ({
      id: s.id,
      top: s.offsetTop,
      height: s.offsetHeight
    }));
    return {
      goal: el ? { top: el.offsetTop, height: el.offsetHeight } : null,
      maxScroll: window.scrollManager ? window.scrollManager.contentSizePixel : null,
      sections
    };
  });
  console.log("Mobile layout info:", JSON.stringify(info, null, 2));

  await browser.close();
})();
