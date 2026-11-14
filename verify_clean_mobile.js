const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const outDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

(async () => {
  console.log('1. Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1');

    console.log('2. Navigating to http://localhost:3000/...');
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.log('3. Navigated!');

    // Wait for preloader to complete
    console.log('4. Waiting for preloader...');
    for (let i = 0; i < 30; i++) {
      const state = await page.evaluate(() => {
        const p = window.__properties;
        const sm = window.scrollManager;
        return {
          hasStarted: p ? p.hasStarted : null,
          hasInitialized: p ? p.hasInitialized : null,
          smActive: sm ? sm.isActive : null,
          scrollPixel: sm ? sm.scrollPixel : null
        };
      }).catch(e => ({ err: e.message }));
      console.log(`[T=${(i*0.5).toFixed(1)}s] state:`, JSON.stringify(state));
      if (state && (state.hasStarted || state.smActive)) {
        console.log('Preloader completed / app active!');
        break;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    // Monitor for 4 seconds to verify no auto-scroll occurs
    console.log('5. Monitoring scroll for 4 seconds (scrollPixel should remain 0)...');
    const scrollLog = [];
    for (let i = 0; i < 8; i++) {
      const pos = await page.evaluate(() => {
        const sm = window.scrollManager;
        return {
          scrollPixel: sm ? sm.scrollPixel : null,
          targetScrollPixel: sm ? sm.targetScrollPixel : null,
          scrollY: window.scrollY
        };
      });
      scrollLog.push({ tSec: (i * 0.5).toFixed(1), ...pos });
      await new Promise(r => setTimeout(r, 500));
    }
    console.log('Scroll monitor log:', JSON.stringify(scrollLog));

    // Capture sp = 0
    console.log('6. Inspecting hero section & capturing sp=0...');
    const heroInfo = await page.evaluate(() => {
      const hero = document.querySelector('#home-hero-visual-container');
      const canvas = document.querySelector('canvas');
      const heroStyle = hero ? window.getComputedStyle(hero) : null;
      return {
        heroFound: !!hero,
        heroBg: heroStyle ? heroStyle.backgroundColor : null,
        heroOpacity: heroStyle ? heroStyle.opacity : null,
        heroDisplay: heroStyle ? heroStyle.display : null,
        canvasFound: !!canvas,
        canvasWidth: canvas ? canvas.width : null,
        canvasHeight: canvas ? canvas.height : null,
        scrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : null
      };
    });
    console.log('Hero info:', JSON.stringify(heroInfo, null, 2));

    const shot0 = path.join(outDir, 'mobile_sp_0.png');
    await page.screenshot({ path: shot0 });
    console.log('Saved:', shot0);

    // Scroll targets: 1000, 1800, 2500, 3200
    const scrollTargets = [1000, 1800, 2500, 3200];
    const scrollResults = [];

    for (const sp of scrollTargets) {
      console.log(`Setting scrollPixel to ${sp}...`);
      await page.evaluate((target) => {
        if (window.scrollManager) {
          window.scrollManager.scrollPixel = target;
          window.scrollManager.targetScrollPixel = target;
        }
        window.scrollTo(0, target);
      }, sp);

      await new Promise(r => setTimeout(r, 600));

      const info = await page.evaluate((target) => {
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
        const tunnel = document.querySelector('#tunnel-container, .warp-tunnel');
        const tunnelStyle = tunnel ? window.getComputedStyle(tunnel) : null;
        return {
          target,
          actualSp: window.scrollManager ? window.scrollManager.scrollPixel : null,
          scrollY: window.scrollY,
          bodyBg,
          htmlBg,
          tunnelFound: !!tunnel,
          tunnelOpacity: tunnelStyle ? tunnelStyle.opacity : null,
          tunnelDisplay: tunnelStyle ? tunnelStyle.display : null
        };
      }, sp);

      const shotPath = path.join(outDir, `mobile_sp_${sp}.png`);
      await page.screenshot({ path: shotPath });
      console.log(`Saved: ${shotPath}`, JSON.stringify(info));
      scrollResults.push({ ...info, shotPath });
    }

    const finalReport = {
      scrollLog,
      heroInfo,
      scrollResults
    };
    fs.writeFileSync(path.join(outDir, 'verification_report.json'), JSON.stringify(finalReport, null, 2));
    console.log('Verification finished successfully!');
  } catch (err) {
    console.error('Error during run:', err);
  } finally {
    await browser.close();
  }
})();
