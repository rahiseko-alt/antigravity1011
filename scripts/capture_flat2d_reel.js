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

  // 1. Mobile verification
  console.log('--- Starting Mobile Reel Verification ---');
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait for intro warp to settle
  await page.waitForFunction(() => {
    return !window.properties?.isIntroWarp && window.scrollManager?.isActive;
  }, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 600));

  const mobScrolls = [450, 550, 650, 750, 850];
  for (const s of mobScrolls) {
    const status = await page.evaluate(async (scroll) => {
      window.scrollManager.scrollToPixel(scroll, true);
      await new Promise(r => {
        let f = 0;
        function t() { f++; if (f > 25) r(); else requestAnimationFrame(t); }
        requestAnimationFrame(t);
      });
      let lineData = null;
      window.homePage?.preUfxContainer?.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
          lineData = {
            visible: obj.visible,
            parentVisible: obj.parent?.visible,
            containerVisible: obj.parent?.parent?.visible,
            u_showRatio: obj.material.uniforms.u_showRatio.value,
            u_radius: obj.material.uniforms.u_radius.value,
            containerPosY: obj.parent?.position?.y
          };
        }
      });
      return { scroll, lineData };
    }, s);
    console.log(`Mobile s=${s}:`, JSON.stringify(status));
    const shot = path.join(artifactDir, `reel_flat2d_mob_${s}.png`);
    await page.screenshot({ path: shot });
    console.log(`Saved: ${shot}`);
  }
  await page.close();

  // 2. Desktop verification
  console.log('--- Starting Desktop Reel Verification ---');
  const deskPage = await browser.newPage();
  await deskPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await deskPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  await deskPage.waitForFunction(() => {
    return !window.properties?.isIntroWarp && window.scrollManager?.isActive;
  }, { timeout: 15000 });
  await new Promise(r => setTimeout(r, 600));

  const deskScrolls = [800, 1000, 1200, 1400];
  for (const s of deskScrolls) {
    const status = await deskPage.evaluate(async (scroll) => {
      window.scrollManager.scrollToPixel(scroll, true);
      await new Promise(r => {
        let f = 0;
        function t() { f++; if (f > 25) r(); else requestAnimationFrame(t); }
        requestAnimationFrame(t);
      });
      let lineData = null;
      window.homePage?.preUfxContainer?.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius) {
          lineData = {
            visible: obj.visible,
            parentVisible: obj.parent?.visible,
            containerVisible: obj.parent?.parent?.visible,
            u_showRatio: obj.material.uniforms.u_showRatio.value,
            u_radius: obj.material.uniforms.u_radius.value,
            containerPosY: obj.parent?.position?.y
          };
        }
      });
      return { scroll, lineData };
    }, s);
    console.log(`Desktop s=${s}:`, JSON.stringify(status));
    const shot = path.join(artifactDir, `reel_flat2d_desk_${s}.png`);
    await deskPage.screenshot({ path: shot });
    console.log(`Saved: ${shot}`);
  }
  await deskPage.close();

  await browser.close();
  console.log('--- ALL VERIFICATIONS COMPLETE ---');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
