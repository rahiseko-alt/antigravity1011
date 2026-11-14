import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://rahiseko-alt.github.io/antigravity1011/';

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=gl',
      '--enable-webgl',
      '--window-size=1440,900'
    ],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  
  // Collect console logs
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    logs.push(`[PAGE ERROR] ${err.toString()}`);
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  const t0 = Date.now();
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log(`DOM loaded in ${Date.now() - t0}ms`);

  // Wait 3 seconds
  await new Promise(r => setTimeout(r, 3000));
  
  const title = await page.title();
  console.log('Title:', title);
  console.log('Console logs (first 10):', logs.slice(0, 10));

  await browser.close();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
