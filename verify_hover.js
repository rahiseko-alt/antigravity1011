const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

function getExecutablePath() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No browser executable found!');
}

async function verifyHover() {
  const execPath = getExecutablePath();
  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const distPath = path.resolve(__dirname, 'dist', 'index.html');
  await page.goto('file://' + distPath, { waitUntil: 'domcontentloaded' });
  await sleep(1500);

  // 1. Featured CTA
  const featuredBtn = await page.$('#home-featured-cta');
  if (featuredBtn) {
    await featuredBtn.scrollIntoView();
    await sleep(500);
    await featuredBtn.hover();
    await sleep(400);
    await featuredBtn.screenshot({ path: 'verify_hover_featured_settled.png' });
    console.log('Captured featured button screenshot');
  }

  // 2. Reel CTA
  const reelBtn = await page.$('#home-reel-cta');
  if (reelBtn) {
    await reelBtn.scrollIntoView();
    await sleep(500);
    await reelBtn.hover();
    await sleep(400);
    await reelBtn.screenshot({ path: 'verify_hover_reel_settled.png' });
    console.log('Captured reel button screenshot');
  }

  await browser.close();
  console.log('Done verifyHover!');
}

verifyHover().catch(console.error);
