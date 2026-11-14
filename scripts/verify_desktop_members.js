import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE_PATH, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 9000));
  
  const membersBox = await page.evaluate(() => {
    const el = document.getElementById('home-members');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top,
      offsetTop: el.offsetTop,
      scrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : null
    };
  });
  console.log('Members box:', membersBox);

  // Scroll into members section (cards 1 & 2)
  await page.evaluate((top) => {
    window.scrollManager.scrollToPixel(top + 260, false);
  }, membersBox.offsetTop);

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'verify_desktop_members_top.png' });
  console.log('Saved verify_desktop_members_top.png');

  // Scroll to members bottom (cards 3, 4, 5)
  await page.evaluate((top) => {
    window.scrollManager.scrollToPixel(top + 580, false);
  }, membersBox.offsetTop);

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'verify_desktop_members_bottom.png' });
  console.log('Saved verify_desktop_members_bottom.png');

  await browser.close();
})();
