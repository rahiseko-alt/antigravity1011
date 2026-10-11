const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  console.log('Navigating to live URL...');
  const resp = await page.goto('https://rahiseko-alt.github.io/antigravity1011/', { waitUntil: 'domcontentloaded' });
  console.log('Navigation response status:', resp.status());

  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: 'live_confirmed.png' });
  console.log('Captured live_confirmed.png');

  await browser.close();
})();
