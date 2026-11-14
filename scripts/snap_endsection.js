const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function snapEndSection() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const end = document.getElementById('end-section');
    if (end && window.scrollManager) {
      window.scrollManager.scrollToPixel(end.offsetTop + 400, false);
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  const endOuter = await page.$('#end-section-inner');
  if (endOuter) {
    const shotPath = path.resolve(__dirname, '../verify_endsection_fixed_visual.png');
    await endOuter.screenshot({ path: shotPath });
    console.log("Saved screenshot:", shotPath);
  }

  // Also mobile
  const mobPage = await browser.newPage();
  await mobPage.setViewport({ width: 390, height: 844 });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  await mobPage.evaluate(() => {
    const end = document.getElementById('end-section');
    if (end && window.scrollManager) {
      window.scrollManager.scrollToPixel(end.offsetTop + 300, false);
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  const mobOuter = await mobPage.$('#end-section-inner');
  if (mobOuter) {
    const mobShotPath = path.resolve(__dirname, '../verify_endsection_mob_fixed_visual.png');
    await mobOuter.screenshot({ path: mobShotPath });
    console.log("Saved mob screenshot:", mobShotPath);
  }

  await browser.close();
}

snapEndSection().catch(console.error);
