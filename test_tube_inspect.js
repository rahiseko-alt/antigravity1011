const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const DESKTOP_SCROLLS = [650, 1800, 2800, 3800, 5000, 6000];
const MOBILE_SCROLLS = [500, 1800, 3000, 4200, 5400, 6400];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function inspectLine(page) {
  return await page.evaluate(() => {
    const l = window.__line0;
    if (!l) {
      return { exists: false };
    }
    return {
      exists: true,
      containerVisible: l.container ? l.container.visible : null,
      innerContainer: l.innerContainer ? {
        position: { x: l.innerContainer.position.x, y: l.innerContainer.position.y, z: l.innerContainer.position.z },
        scale: { x: l.innerContainer.scale.x, y: l.innerContainer.scale.y, z: l.innerContainer.scale.z },
        visible: l.innerContainer.visible,
      } : null,
      circle: l.circle ? {
        position: { x: l.circle.position.x, y: l.circle.position.y, z: l.circle.position.z },
        visible: l.circle.visible,
        scale: { x: l.circle.scale.x, y: l.circle.scale.y, z: l.circle.scale.z }
      } : null,
      meshUniforms: (l.mesh && l.mesh.material && l.mesh.material.uniforms) ? {
        u_showRatio: l.mesh.material.uniforms.u_showRatio ? l.mesh.material.uniforms.u_showRatio.value : null
      } : null,
      scrollManagerPixel: window.scrollManager ? window.scrollManager.pixel : null,
    };
  });
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=d3d11'
    ],
    defaultViewport: null
  });

  const results = {
    desktop: {},
    mobile: {},
    errors: []
  };

  try {
    // 1. Desktop Test
    console.log('--- Starting Desktop Tests (1440x900) ---');
    const pageDt = await browser.newPage();
    await pageDt.setViewport({ width: 1440, height: 900 });

    pageDt.on('pageerror', err => {
      console.error('[Browser Desktop PageError]:', err.message);
      results.errors.push(`[Desktop PageError] ${err.message}`);
    });

    console.log('Navigating to http://localhost:3000/ ...');
    await pageDt.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 30000 });

    console.log('Unlocking intro...');
    await pageDt.evaluate(() => {
      if (window.__unlockNow) window.__unlockNow();
    });
    await sleep(1500);

    for (const s of DESKTOP_SCROLLS) {
      console.log(`Desktop: scrolling to s=${s}...`);
      await pageDt.evaluate((val) => {
        if (window.scrollManager && window.scrollManager.scrollToPixel) {
          window.scrollManager.scrollToPixel(val);
        } else if (window.scrollManager && window.scrollManager.scrollTo) {
          window.scrollManager.scrollTo(val, 0);
        }
      }, s);
      await sleep(500);

      const debug = await inspectLine(pageDt);
      results.desktop[s] = debug;
      console.log(`Desktop s=${s} debug:`, JSON.stringify(debug));

      const screenshotPath = path.resolve(__dirname, `test_tube_dt_${s}.png`);
      await pageDt.screenshot({ path: screenshotPath });
      console.log(`Saved screenshot: ${screenshotPath}`);
    }

    await pageDt.close();

    // 2. Mobile Test
    console.log('--- Starting Mobile Tests (390x844) ---');
    const pageMb = await browser.newPage();
    await pageMb.setViewport({ width: 390, height: 844 });

    pageMb.on('pageerror', err => {
      console.error('[Browser Mobile PageError]:', err.message);
      results.errors.push(`[Mobile PageError] ${err.message}`);
    });

    console.log('Navigating to http://localhost:3000/ (Mobile)...');
    await pageMb.goto('http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 30000 });

    console.log('Unlocking intro (Mobile)...');
    await pageMb.evaluate(() => {
      if (window.__unlockNow) window.__unlockNow();
    });
    await sleep(1500);

    for (const s of MOBILE_SCROLLS) {
      console.log(`Mobile: scrolling to s=${s}...`);
      await pageMb.evaluate((val) => {
        if (window.scrollManager && window.scrollManager.scrollToPixel) {
          window.scrollManager.scrollToPixel(val);
        } else if (window.scrollManager && window.scrollManager.scrollTo) {
          window.scrollManager.scrollTo(val, 0);
        }
      }, s);
      await sleep(500);

      const debug = await inspectLine(pageMb);
      results.mobile[s] = debug;
      console.log(`Mobile s=${s} debug:`, JSON.stringify(debug));

      const screenshotPath = path.resolve(__dirname, `test_tube_mb_${s}.png`);
      await pageMb.screenshot({ path: screenshotPath });
      console.log(`Saved screenshot: ${screenshotPath}`);
    }

    await pageMb.close();

  } catch (err) {
    console.error('Fatal error during test run:', err);
    results.errors.push(`[Fatal] ${err.message}`);
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.resolve(__dirname, 'test_tube_results.json'), JSON.stringify(results, null, 2));
  console.log('Finished test run. Results saved to test_tube_results.json');
}

run();
