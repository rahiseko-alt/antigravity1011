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
  await page.setViewport({ width: 1280, height: 800 });

  const logs = [];
  page.on('console', msg => logs.push(`[CONSOLE ${msg.type()}]: ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR]: ${err.message}`));

  console.log('Navigating to live production site...');
  await page.goto('https://rahiseko-alt.github.io/antigravity1011/', { waitUntil: 'networkidle2' });

  // Wait for preloader countdown to finish (e.g. 3-4s)
  await new Promise(r => setTimeout(r, 4000));

  await page.screenshot({ path: 'live_production_letters_deployed.png' });
  console.log('Screenshot saved to live_production_letters_deployed.png');

  fs.copyFileSync('live_production_letters_deployed.png', 'C:/Users/user/.gemini/antigravity/brain/2e80ee98-e28f-4bf0-bf90-c8e381874417/live_production_letters_deployed.png');
  console.log('Copied to artifact directory.');

  console.log('Logs:');
  console.log(logs.filter(l => !l.includes('Turnstile')).slice(-10).join('\n'));

  await browser.close();
})();
