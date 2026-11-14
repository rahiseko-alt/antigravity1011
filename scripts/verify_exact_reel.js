const puppeteer = require('puppeteer-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

(async () => {
  console.log('=== VERIFYING REEL TUBE SECTION (MOBILE 390x844) ===');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=390,844']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  console.log('Waiting 6.5s for intro warp to settle...');
  await new Promise(r => setTimeout(r, 6500));

  const scrolls = [250, 400, 550, 700, 850];

  for (const px of scrolls) {
    const info = await page.evaluate((s) => {
      window.scrollManager.scrollToPixel(s, true);
      const reel = document.getElementById('home-reel');
      const r = reel ? reel.getBoundingClientRect() : null;
      let lineData = null;
      window.homePage?.preUfxContainer?.traverse(obj => {
        if (obj.isMesh && obj.material?.uniforms?.u_showRatio) {
          lineData = {
            meshVisible: obj.visible,
            u_showRatio: obj.material.uniforms.u_showRatio.value,
            u_radius: obj.material.uniforms.u_radius.value,
            containerPosY: obj.parent?.position?.y
          };
        }
      });
      return { scrollPixel: window.scrollManager.scrollPixel, reelRect: r, lineData };
    }, px);

    await new Promise(r => setTimeout(r, 700));

    console.log(`Mobile ${px}px:`, JSON.stringify(info));
    const outPath = path.join(artifactDir, `exact_reel_sp${px}.png`);
    await page.screenshot({ path: outPath });
    console.log(`Saved: ${outPath}`);
  }

  await browser.close();
  console.log('=== MOBILE REEL VERIFICATION COMPLETE ===');
})();
