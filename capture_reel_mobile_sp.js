const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

const scrollPositions = [450, 520, 580, 640, 700, 760, 820];

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--window-size=390,844'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  console.log('Waiting for app readiness...');
  for (let i = 0; i < 50; i++) {
    const ready = await page.evaluate(() => {
      return window.properties && window.properties.hasStarted && !window.properties.isIntroWarp;
    }).catch(() => false);
    if (ready) break;
    await new Promise(r => setTimeout(r, 200));
  }
  await new Promise(r => setTimeout(r, 1000));

  const results = [];

  for (const sp of scrollPositions) {
    console.log(`Setting sp = ${sp}...`);
    await page.evaluate((px) => {
      window.scrollManager.scrollToPixel(px, true);
    }, sp);
    await new Promise(r => setTimeout(r, 500));

    const state = await page.evaluate(() => {
      let lineMesh = null;
      if (window.homePage && window.homePage.preUfxContainer) {
        window.homePage.preUfxContainer.traverse(obj => {
          if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius && !lineMesh) {
            lineMesh = obj;
          }
        });
      }

      const inner = lineMesh ? lineMesh.parent : null;
      const container = inner ? inner.parent : null;
      const showRatio = lineMesh ? lineMesh.material.uniforms.u_showRatio.value : null;

      const reel = document.getElementById('home-reel');
      const r = reel ? reel.getBoundingClientRect() : null;

      let tubeHeadScreenX = null;
      let tubeHeadScreenY = null;
      let visiblePoints = 0;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

      if (lineMesh && lineMesh.geometry && lineMesh.geometry.attributes && lineMesh.geometry.attributes.CP) {
        const u = Math.hypot(window.properties.viewportWidth, window.properties.viewportHeight);
        const sx = (window.properties.viewportWidth / u) / 0.87157;
        const cp = lineMesh.geometry.attributes.CP.array;
        const count = lineMesh.geometry.attributes.CP.count;
        const maxIdx = Math.floor((showRatio || 0) * (count - 1));

        if (maxIdx >= 0 && maxIdx < count) {
          const hx = inner.position.x + cp[maxIdx * 3 + 0] * sx * inner.scale.x;
          const hy = inner.position.y + cp[maxIdx * 3 + 1] * inner.scale.y;
          tubeHeadScreenX = Math.round(hx);
          tubeHeadScreenY = Math.round(-hy);
        }

        for (let i = 0; i <= maxIdx; i++) {
          const px3d = inner.position.x + cp[i * 3 + 0] * sx * inner.scale.x;
          const py3d = inner.position.y + cp[i * 3 + 1] * inner.scale.y;
          const sxScreen = px3d;
          const syScreen = -py3d;
          if (sxScreen >= -50 && sxScreen <= window.properties.viewportWidth + 50 &&
              syScreen >= -50 && syScreen <= window.properties.viewportHeight + 50) {
            visiblePoints++;
            if (sxScreen < minX) minX = sxScreen;
            if (sxScreen > maxX) maxX = sxScreen;
            if (syScreen < minY) minY = syScreen;
            if (syScreen > maxY) maxY = syScreen;
          }
        }
      }

      return {
        sp: window.scrollManager.scrollPixel,
        reelRect: r ? { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height) } : null,
        containerVisible: container ? container.visible : false,
        showRatio: showRatio !== null ? Number(showRatio.toFixed(4)) : null,
        tubeHead: tubeHeadScreenX !== null ? { x: tubeHeadScreenX, y: tubeHeadScreenY } : null,
        visiblePoints,
        tubeBounds: visiblePoints > 0 ? {
          minX: Math.round(minX),
          maxX: Math.round(maxX),
          minY: Math.round(minY),
          maxY: Math.round(maxY)
        } : null
      };
    });

    const filename = `mobile_reel_sp_${sp}.png`;
    const fullPath = path.join(artifactDir, filename);
    await page.screenshot({ path: fullPath });
    console.log(`Saved screenshot: ${fullPath}`, state);

    results.push({
      sp,
      filename,
      fullPath,
      state
    });
  }

  await browser.close();

  const reportPath = path.join(artifactDir, 'mobile_reel_capture_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`Saved report: ${reportPath}`);
})();
