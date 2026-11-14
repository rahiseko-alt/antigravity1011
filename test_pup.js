const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
    ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  console.log('Using browser:', chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });

  const page = await browser.newPage();
  console.log('Navigating to http://127.0.0.1:3000 ...');
  const t0 = Date.now();
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
  console.log(`Navigation succeeded in ${Date.now() - t0}ms! Title:`, await page.title());
  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
