const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait for intro warp
  await new Promise(r => setTimeout(r, 2000));

  console.log('--- Scrolling with mouse wheel down step-by-step ---');
  // Scroll down incrementally and capture
  let totalDelta = 0;
  for (let i = 1; i <= 10; i++) {
    await page.mouse.wheel(0, 300);
    totalDelta += 300;
    await new Promise(r => setTimeout(r, 600));

    const info = await page.evaluate(() => {
      const sp = window.scrollManager ? window.scrollManager.scrollPixel : null;
      const reel = document.getElementById('home-reel');
      const r = reel ? reel.getBoundingClientRect() : null;
      let lineVisible = false;
      let showRatio = 0;
      window.homePage?.preUfxContainer?.traverse(obj => {
        if (obj.isMesh && obj.material?.uniforms?.u_showRatio) {
          lineVisible = obj.visible && (obj.parent ? obj.parent.parent ? obj.parent.parent.visible : true : true);
          showRatio = obj.material.uniforms.u_showRatio.value;
        }
      });
      return { sp, reelTop: r ? r.top : null, lineVisible, showRatio };
    });

    console.log(`Step ${i} (wheel ${totalDelta}):`, JSON.stringify(info));
    const shot = path.join(artifactDir, `wheel_step_${i}.png`);
    await page.screenshot({ path: shot });
  }

  await browser.close();
  console.log('Done wheel test!');
}

run().catch(console.error);
