const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.resolve('audit_artifacts/visual_diagnosis');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=1920,1080']
  });

  const scrollOffsets = [0, 800, 1400, 2000, 2800, 3800, 4800, 5800, 6500];

  // 1. Desktop 1920x1080
  console.log('Capturing Desktop 1920x1080...');
  const pageD = await browser.newPage();
  await pageD.setViewport({ width: 1920, height: 1080 });
  await pageD.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6500)); // wait for intro to settle

  for (const s of scrollOffsets) {
    await pageD.evaluate((scrollY) => {
      window.scrollTo(0, scrollY);
    }, s);
    await new Promise(r => setTimeout(r, 400));
    const dest = path.join(outDir, `desktop_s${s}.png`);
    await pageD.screenshot({ path: dest, fullPage: false });
    console.log(`Saved ${dest}`);
  }
  await pageD.close();

  // 2. Mobile 390x844
  console.log('Capturing Mobile 390x844...');
  const pageM = await browser.newPage();
  await pageM.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await pageM.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6500));

  for (const s of scrollOffsets) {
    await pageM.evaluate((scrollY) => {
      window.scrollTo(0, scrollY);
    }, s);
    await new Promise(r => setTimeout(r, 400));
    const dest = path.join(outDir, `mobile_s${s}.png`);
    await pageM.screenshot({ path: dest, fullPage: false });
    console.log(`Saved ${dest}`);
  }
  await pageM.close();

  await browser.close();
  console.log('Done captures!');
})();
