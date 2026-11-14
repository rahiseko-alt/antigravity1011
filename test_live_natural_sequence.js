const puppeteer = require('puppeteer-core');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

(async () => {
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // wait until warp starts
  console.log('Waiting for preloader to reach 100 and warp to start...');
  while (true) {
    const isWarp = await page.evaluate(() => window.__properties && window.__properties.isIntroWarp);
    if (isWarp) {
      console.log('Warp has started naturally!');
      break;
    }
    await new Promise(r => setTimeout(r, 40));
  }

  // Now capture live sequence every 400ms across the full 6.5s!
  const startMs = Date.now();
  for (let i = 0; i <= 16; i++) {
    const elapsedSec = (i * 0.4);
    const targetMs = startMs + elapsedSec * 1000;
    const diff = targetMs - Date.now();
    if (diff > 0) await new Promise(r => setTimeout(r, diff));

    const state = await page.evaluate(() => {
      const gt = window.__goalTunnels;
      const prop = window.__properties;
      const curtain = document.getElementById('intro-whiteout');
      const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime)/1000 : null;
      return {
        r: r ? r.toFixed(2) : null,
        isIntroWarp: prop ? prop.isIntroWarp : false,
        bgColor: prop ? prop.bgColorHex : null,
        stage: window.visuals ? window.visuals.currentStage3D?.constructor?.name : null,
        blackRatio: gt ? gt.blackTunnelRatio?.toFixed(3) : null,
        whiteRatio: gt ? gt.whiteTunnelRatio?.toFixed(3) : null,
        isBlackActive: gt ? gt.isBlackTunnelActive : false,
        isWhiteActive: gt ? gt.isWhiteTunnelActive : false,
        curtainOpacity: curtain ? curtain.style.opacity : null,
        curtainDisplay: curtain ? curtain.style.display : null,
        pageOpacity: document.getElementById('page-container')?.style.opacity
      };
    });
    console.log(`step ${i} (t~${elapsedSec.toFixed(1)}s):`, state);
    await page.screenshot({ path: `live_step_${i}_${elapsedSec.toFixed(1)}s.png` });
  }

  await browser.close();
})();
