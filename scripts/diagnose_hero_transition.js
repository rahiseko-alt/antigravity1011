const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

(async () => {
  console.log('=== STARTING HERO TRANSITION DIAGNOSTIC ===');
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--enable-webgl2-compute-context',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('Console Error: ' + msg.text());
  });
  page.on('pageerror', err => {
    errors.push('Page Error: ' + err.message);
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait until warp starts
  console.log('Waiting for isIntroWarp...');
  await page.waitForFunction(() => window.__properties && window.__properties.isIntroWarp, { timeout: 15000 });
  console.log('Intro warp active!');

  // Install frame sampler inside the page using requestAnimationFrame
  await page.evaluate(() => {
    window.__heroSamples = [];
    function sampleFrame() {
      const gt = window.__goalTunnels;
      const prop = window.__properties;
      const curtain = document.getElementById('intro-whiteout');
      const r = gt && gt.introStartTime ? (performance.now() - gt.introStartTime) / 1000 : 0;
      
      let bodySpeedSum = 0;
      let bodyCount = 0;
      let body0Speed = 0;
      let body0Pos = null;
      if (window.__hbp && window.__hbp.bodies) {
        bodyCount = window.__hbp.bodies.length;
        for (let i = 0; i < bodyCount; i++) {
          const b = window.__hbp.bodies[i];
          const spd = b.velocity.length();
          bodySpeedSum += spd;
          if (i === 0) {
            body0Speed = +spd.toFixed(3);
            body0Pos = { x: +b.position.x.toFixed(3), y: +b.position.y.toFixed(3), z: +b.position.z.toFixed(3) };
          }
        }
      }

      const sample = {
        r: +r.toFixed(4),
        time: window.homePage ? +window.homePage.time.toFixed(4) : null,
        dollyOffset: prop ? +prop.cameraDollyZoomFovOffset.toFixed(3) : null,
        camZ: prop ? +(prop.defaultCameraPosition ? prop.defaultCameraPosition.z : 0).toFixed(3) : null,
        camFov: prop && prop.camera ? +prop.camera.fov.toFixed(3) : null,
        curtainOpacity: curtain ? curtain.style.opacity : null,
        curtainDisplay: curtain ? curtain.style.display : null,
        pageContOpacity: document.getElementById('page-container')?.style.opacity || null,
        isIntroWarp: prop ? prop.isIntroWarp : false,
        avgBodySpeed: bodyCount > 0 ? +(bodySpeedSum / bodyCount).toFixed(3) : 0,
        body0Speed,
        body0Pos
      };

      if (r >= 6.4 && r <= 9.0) {
        window.__heroSamples.push(sample);
      }
      requestAnimationFrame(sampleFrame);
    }
    requestAnimationFrame(sampleFrame);
  });

  // Wait until r >= 9.2s
  await page.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.2;
  }, { timeout: 20000 });

  const samples = await page.evaluate(() => window.__heroSamples);
  console.log(`Collected ${samples.length} frame samples between r=6.4s and 9.0s.`);

  // Print selected samples around key milestones
  console.log('\n--- Selected samples ---');
  const keyR = [6.5, 6.6, 7.0, 7.4, 7.5, 7.6, 7.7, 7.8, 8.0, 8.2, 8.4, 8.6, 8.8];
  for (const kr of keyR) {
    const s = samples.find(x => x.r >= kr);
    if (s) {
      console.log(`r=${s.r.toFixed(2)}s | curtainOp=${s.curtainOpacity} | homePage.time=${s.time} | dollyOffset=${s.dollyOffset} | camZ=${s.camZ} | avgBodySpd=${s.avgBodySpeed} | body0Spd=${s.body0Speed} | isWarp=${s.isIntroWarp}`);
    }
  }

  fs.writeFileSync('scripts/current_hero_samples.json', JSON.stringify(samples, null, 2));
  await browser.close();
  console.log('Diagnostic finished.');
})();
