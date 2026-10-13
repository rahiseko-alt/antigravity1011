const puppeteer = require('puppeteer-core');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

(async () => {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--enable-webgl2-compute-context', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  const start = Date.now();
  let matched = false;
  while (Date.now() - start < 8000) {
    const s = await page.evaluate(() => {
      const gt = window.goalTunnels || window.__goalTunnels;
      const prop = window.__properties;
      const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : -1;
      return {
        r,
        isIntroWarp: prop ? prop.isIntroWarp : false,
        isBlackActive: gt ? gt.isBlackTunnelActive : false
      };
    });
    if (s.r >= 0.5) {
      console.log('Sample:', s);
    }
    if (s.isIntroWarp && s.r >= 0.58 && s.r <= 1.12 && s.isBlackActive) {
      matched = true;
      console.log('MATCHED 1c!', s);
      break;
    }
    await new Promise(r => setTimeout(r, 20));
  }
  await browser.close();
  console.log('Finished 1c test. Matched:', matched);
})();
