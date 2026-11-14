const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.join(__dirname, '..', 'audit_artifacts', 'diagnosis');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function auditTarget(name, url) {
  console.log(`\n======================================================`);
  console.log(`AUDITING TARGET: ${name} (${url})`);
  console.log(`======================================================`);

  const results = {
    url,
    name,
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    requestFailures: [],
    webglIssues: [],
    measurements: {}
  };

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  try {
    // 1. Desktop Audit (1920x1080)
    console.log(`\n--- Desktop 1920x1080 ---`);
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log(`[CONSOLE ERROR] ${text}`);
        results.consoleErrors.push({ viewport: 'desktop', text });
      } else if (type === 'warning') {
        results.consoleWarnings.push({ viewport: 'desktop', text });
      }
    });

    page.on('pageerror', err => {
      console.log(`[PAGE ERROR] ${err.toString()}`);
      results.pageErrors.push({ viewport: 'desktop', error: err.toString(), stack: err.stack });
    });

    page.on('requestfailed', req => {
      const failure = req.failure();
      console.log(`[REQ FAILED] ${req.url()} - ${failure ? failure.errorText : 'unknown'}`);
      results.requestFailures.push({
        url: req.url(),
        error: failure ? failure.errorText : 'unknown'
      });
    });

    page.on('response', resp => {
      if (resp.status() >= 400) {
        console.log(`[HTTP ${resp.status()}] ${resp.url()}`);
        results.requestFailures.push({
          url: resp.url(),
          status: resp.status()
        });
      }
    });

    console.log(`Navigating to ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (e) {
      console.error(`Navigation error: ${e.message}`);
    }

    // Wait 9 seconds for intro sequence settlement
    console.log('Waiting for initial settlement (9s)...');
    await new Promise(r => setTimeout(r, 9000));

    // Check WebGL context status and errors
    const webglInfo = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      const details = [];
      for (const c of canvases) {
        try {
          const gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
          if (gl) {
            const err = gl.getError();
            details.push({
              id: c.id,
              className: c.className,
              width: c.width,
              height: c.height,
              styleWidth: c.style.width,
              styleHeight: c.style.height,
              glError: err,
              isContextLost: gl.isContextLost()
            });
          }
        } catch (e) {
          details.push({ error: e.message });
        }
      }
      return {
        canvasCount: canvases.length,
        details,
        windowScrollManager: !!window.scrollManager,
        totalScrollPixel: window.scrollManager ? window.scrollManager.totalScrollPixel : null,
        scrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : null
      };
    });
    console.log('WebGL / DOM state:', JSON.stringify(webglInfo, null, 2));
    results.webglIssues.push(webglInfo);

    // Initial capture at top
    await page.screenshot({ path: path.join(outDir, `${name}_pc_0000_top.png`) });

    // Scroll through checkpoints on Desktop
    // Check total height
    const maxScroll = await page.evaluate(() => {
      return (window.scrollManager && window.scrollManager.totalScrollPixel) || document.body.scrollHeight || 7000;
    });
    console.log(`Max scroll pixel: ${maxScroll}`);

    const scrollStepsDesktop = [0, 500, 1000, 1500, 2000, 2800, 3600, 4500, 5400, 6300, Math.floor(maxScroll)];
    for (const y of scrollStepsDesktop) {
      await page.evaluate((targetY) => {
        if (window.scrollManager && window.scrollManager.scrollToPixel) {
          window.scrollManager.scrollToPixel(targetY, true);
        } else {
          window.scrollTo(0, targetY);
        }
      }, y);
      await new Promise(r => setTimeout(r, 600));
      const filename = `${name}_pc_${String(y).padStart(5, '0')}.png`;
      await page.screenshot({ path: path.join(outDir, filename) });
      console.log(`Saved screenshot: ${filename}`);
    }

    await page.close();

    // 2. Mobile Audit (390x844)
    console.log(`\n--- Mobile 390x844 ---`);
    const mobPage = await browser.newPage();
    await mobPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    mobPage.on('console', msg => {
      if (msg.type() === 'error') {
        results.consoleErrors.push({ viewport: 'mobile', text: msg.text() });
      }
    });
    mobPage.on('pageerror', err => {
      results.pageErrors.push({ viewport: 'mobile', error: err.toString() });
    });

    await mobPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 9000));

    const maxScrollMob = await mobPage.evaluate(() => {
      return (window.scrollManager && window.scrollManager.totalScrollPixel) || document.body.scrollHeight || 7000;
    });

    const scrollStepsMobile = [0, 500, 1000, 1800, 2600, 3400, 4200, 5000, Math.floor(maxScrollMob)];
    for (const y of scrollStepsMobile) {
      await mobPage.evaluate((targetY) => {
        if (window.scrollManager && window.scrollManager.scrollToPixel) {
          window.scrollManager.scrollToPixel(targetY, true);
        } else {
          window.scrollTo(0, targetY);
        }
      }, y);
      await new Promise(r => setTimeout(r, 600));
      const filename = `${name}_mob_${String(y).padStart(5, '0')}.png`;
      await mobPage.screenshot({ path: path.join(outDir, filename) });
      console.log(`Saved screenshot: ${filename}`);
    }

    await mobPage.close();

  } catch (err) {
    console.error(`Error auditing ${name}:`, err);
  } finally {
    await browser.close();
  }

  return results;
}

(async () => {
  const summary = {};
  summary['remote'] = await auditTarget('github_pages', 'https://rahiseko-alt.github.io/antigravity1011/');
  summary['local'] = await auditTarget('localhost', 'http://localhost:3000');

  fs.writeFileSync(path.join(outDir, 'audit_report.json'), JSON.stringify(summary, null, 2));
  console.log(`\nAudit complete! Report saved to ${path.join(outDir, 'audit_report.json')}`);
})();
