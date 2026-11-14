const puppeteer = require('puppeteer-core');
const fs = require('fs');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl', '--window-size=1920,1080']
  });

  const errors = [];
  const networkErrors = [];

  const check = async (viewport, prefix) => {
    const page = await browser.newPage();
    await page.setViewport(viewport);

    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('error') || msg.text().includes('Error')) {
        errors.push(`[${prefix} Console ${msg.type()}] ${msg.text()}`);
      }
    });

    page.on('pageerror', err => {
      errors.push(`[${prefix} PageError] ${err.message}\n${err.stack}`);
    });

    page.on('response', res => {
      if (!res.ok() && res.status() >= 400) {
        networkErrors.push(`[${prefix} Network ${res.status()}] ${res.url()}`);
      }
    });

    console.log(`Loading live site for ${prefix}...`);
    await page.goto('https://rahiseko-alt.github.io/antigravity1011/', { waitUntil: 'networkidle2', timeout: 30000 }).catch(e => console.log('load timeout:', e.message));

    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: `audit_live_${prefix}_top.png` });

    // Scroll down gradually and capture
    for (const p of [800, 1500, 2500, 3500, 4500, 5500, 6500]) {
      await page.evaluate(y => window.scrollTo(0, y), p);
      await page.evaluate(y => {
        if (window.scrollManager) window.scrollManager.targetScrollPixel = y;
      }, p);
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: `audit_live_${prefix}_${p}.png` });
    }

    await page.close();
  };

  await check({ width: 1920, height: 1080 }, 'pc');
  await check({ width: 390, height: 844, isMobile: true, hasTouch: true }, 'mobile');

  await browser.close();

  console.log('=== ERRORS ===\n', errors.join('\n') || 'None');
  console.log('=== NETWORK 404s ===\n', networkErrors.join('\n') || 'None');
})();
