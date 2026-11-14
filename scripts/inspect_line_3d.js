const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function inspect() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // イントロ解除
  await page.evaluate(() => {
    if (window.properties) window.properties.isIntroWarp = false;
    if (window.scrollManager) window.scrollManager.isActive = true;
    document.body.style.overflow = '';
    const wo = document.getElementById('intro-whiteout'); if (wo) wo.remove();
    const it = document.getElementById('intro-warp-title'); if (it) it.remove();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    window.scrollManager.scrollToPixel(600, true);
  });
  await new Promise(r => setTimeout(r, 500));

  const debugInfo = await page.evaluate(() => {
    const line = window.__line0;
    if (!line) return { error: 'No __line0' };

    // ワールド座標の変換
    const mesh = line.mesh;
    const geom = line.geometry;
    const cam = window.visuals ? window.visuals.camera : null;

    let samplePointsScreen = [];
    if (geom && geom.attributes && geom.attributes.CP && cam) {
      const cp = geom.attributes.CP.array;
      for (let i = 0; i < Math.min(geom.attributes.CP.count, 20); i++) {
        const v = new THREE.Vector3(cp[i*3], cp[i*3+1], cp[i*3+2]);
        v.applyMatrix4(line.innerContainer.matrixWorld);
        const screenV = v.clone().project(cam);
        samplePointsScreen.push({
          idx: i,
          local: { x: cp[i*3], y: cp[i*3+1] },
          world: { x: v.x, y: v.y, z: v.z },
          screen: { x: (screenV.x * 0.5 + 0.5) * window.innerWidth, y: (-screenV.y * 0.5 + 0.5) * window.innerHeight, z: screenV.z }
        });
      }
    }

    // Canvas と DOM の z-index と背景色
    const canvas = document.querySelector('canvas');
    const reel = document.getElementById('home-reel');
    const pageContainer = document.getElementById('page-container');

    return {
      scrollPixel: window.scrollManager.scrollPixel,
      lineVisible: line.container.visible,
      meshVisible: line.mesh.visible,
      showRatio: line.mesh.material.uniforms.u_showRatio.value,
      radius: line.mesh.material.uniforms.u_radius.value,
      canvasStyle: canvas ? {
        position: getComputedStyle(canvas).position,
        zIndex: getComputedStyle(canvas).zIndex,
        pointerEvents: getComputedStyle(canvas).pointerEvents
      } : null,
      reelBg: reel ? getComputedStyle(reel).backgroundColor : null,
      pageContainerBg: pageContainer ? getComputedStyle(pageContainer).backgroundColor : null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      samplePointsScreen: samplePointsScreen.slice(0, 5)
    };
  });

  console.log('DEBUG INFO:', JSON.stringify(debugInfo, null, 2));
  await browser.close();
}

inspect().catch(console.error);
