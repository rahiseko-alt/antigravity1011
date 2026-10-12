import puppeteer from 'puppeteer-core';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1');

  const logs = [];
  page.on('console', msg => logs.push(`[CONSOLE ${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR]: ${err.message}`));
  page.on('requestfailed', req => logs.push(`[FAILED 404]: ${req.url()} (${req.failure()?.errorText})`));

  console.log('Navigating to live GitHub Pages...');
  await page.goto('https://rahiseko-alt.github.io/antigravity1011/', { waitUntil: 'domcontentloaded' });

  for (let i = 0; i < 20; i++) {
    const text = await page.evaluate(() => {
      const el = document.getElementById('preloader-percent-digits');
      return el ? el.innerText.replace(/\s+/g, '') : null;
    });
    console.log(`Step ${i} (${i * 300}ms): preloader text =`, text);
    if (text === '100' || text === null) {
      console.log('Reached 100 or disappeared!');
    }
    await new Promise(r => setTimeout(r, 300));
  }

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'live_mobile_verified.png' });
  console.log('Screenshot saved to live_mobile_verified.png');

  if (logs.length > 0) {
    console.log('--- Page Logs & Failures ---');
    console.log(logs.slice(-10).join('\n'));
  }

  await browser.close();
})();
