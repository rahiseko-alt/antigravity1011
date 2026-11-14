const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function testWhiteHeader() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Apply white gradient with existing opacity & blur
  await page.evaluate(() => {
    const el = document.getElementById('header-protection-styles');
    if (el) {
      el.innerHTML = `
        #header {
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.5) 70%, transparent 100%) !important;
          padding-bottom: 24px !important;
          pointer-events: none !important;
        }
        #header-container {
          pointer-events: auto !important;
        }
      `;
    }
  });

  // 1. Top of page
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.resolve(__dirname, '../verify_header_white_top.png') });
  console.log("Saved top screenshot");

  // 2. Middle of page (scroll to featured/projects)
  await page.evaluate(() => {
    if (window.scrollManager) {
      window.scrollManager.scrollToPixel(1200, false);
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.resolve(__dirname, '../verify_header_white_mid.png') });
  console.log("Saved mid screenshot");

  // 3. Dark section (EndSection / Goal)
  await page.evaluate(() => {
    const end = document.getElementById('end-section');
    if (end && window.scrollManager) {
      window.scrollManager.scrollToPixel(end.offsetTop + 400, false);
    }
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.resolve(__dirname, '../verify_header_white_dark.png') });
  console.log("Saved dark screenshot");

  await browser.close();
}

testWhiteHeader().catch(console.error);
