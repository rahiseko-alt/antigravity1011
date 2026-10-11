const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), failure: req.failure() ? req.failure().errorText : 'failed' });
  });

  console.log('Navigating to live GitHub Pages URL: https://rahiseko-alt.github.io/antigravity1011/ ...');
  await page.goto('https://rahiseko-alt.github.io/antigravity1011/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6000));

  await page.screenshot({ path: 'github_pages_live.png' });
  console.log('Captured github_pages_live.png');

  console.log('Failed requests count:', failedRequests.length);
  if (failedRequests.length > 0) {
    console.log('Failed sample:', failedRequests.slice(0, 5));
  }

  await browser.close();
})();
