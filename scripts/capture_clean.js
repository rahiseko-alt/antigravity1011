const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function run() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  const endTop = await page.evaluate(() => document.getElementById('end-section').offsetTop);
  await page.evaluate((y) => window.scrollManager.scrollToPixel(y, false), endTop + 400);
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.resolve(__dirname, '../verify_clean_pc.png') });
  console.log("Saved verify_clean_pc.png");

  const mobPage = await browser.newPage();
  await mobPage.setViewport({ width: 390, height: 844 });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  const mobEndTop = await mobPage.evaluate(() => document.getElementById('end-section').offsetTop);
  await mobPage.evaluate((y) => window.scrollManager.scrollToPixel(y, false), mobEndTop + 300);
  await new Promise(r => setTimeout(r, 2000));

  await mobPage.screenshot({ path: path.resolve(__dirname, '../verify_clean_mob.png') });
  console.log("Saved verify_clean_mob.png");

  await browser.close();
}

run().catch(console.error);
