const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });

  // 1. Proposals page
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1200, height: 800 });
  await page1.goto('https://aiueo-lp.vercel.app/member/proposals', { waitUntil: 'networkidle2', timeout: 30000 });
  await page1.screenshot({ path: 'aiueo_proposals_desktop.png' });

  // 2. Main LP top
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1200, height: 800 });
  await page2.goto('https://aiueo-lp.vercel.app/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page2.screenshot({ path: 'aiueo_top_hero.png' });

  // Scroll to events
  await page2.evaluate(() => {
    const el = document.getElementById('events');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 600));
  await page2.screenshot({ path: 'aiueo_events.png' });

  await browser.close();
  console.log('Done capturing aiueo pages');
})();
