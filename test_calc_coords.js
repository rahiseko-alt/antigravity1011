const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=default', '--enable-webgl', '--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 20000 });

  const testCoords = await page.evaluate(() => {
    window.scrollManager.scrollToPixel(1000, true);
    // wait a frame for update
    const l0 = window.__line0;
    const preUfx = window.properties.postprocessing.queue.find(q => q.constructor.name === 'PreUfx');
    const cam = preUfx.camera;

    // Force matrix update
    l0.circle.updateWorldMatrix(true, false);
    cam.updateMatrixWorld(true);

    const worldPos = l0.circle.position.clone();
    l0.circle.getWorldPosition(worldPos);

    const ndc = worldPos.clone().project(cam);
    const screenX = (ndc.x + 1) * 0.5 * window.innerWidth;
    const screenY = (1 - ndc.y) * 0.5 * window.innerHeight;

    // Also manual innerContainer calculation:
    // innerContainer: scaleX, scaleY, pos.x, pos.y
    const innerPos = l0.innerContainer.position;
    const innerScale = l0.innerContainer.scale;
    const circlePos = l0.circle.position;

    // In 3D:
    // camera at (W/2, -H/2, Z_cam)
    // screenX = W/2 + (worldX - W/2) * (Z_cam / (Z_cam - worldZ))
    // screenY = H/2 - (worldY - (-H/2)) * (Z_cam / (Z_cam - worldZ))
    const W = window.innerWidth;
    const H = window.innerHeight;
    const Z_cam = H / (2 * Math.tan(cam.fov * Math.PI / 360));
    const perspScale = Z_cam / (Z_cam - worldPos.z);
    const manualScreenX = W * 0.5 + (worldPos.x - W * 0.5) * perspScale;
    const manualScreenY = H * 0.5 - (worldPos.y + H * 0.5) * perspScale;

    return {
      circlePos: { x: circlePos.x, y: circlePos.y, z: circlePos.z },
      innerPos: { x: innerPos.x, y: innerPos.y },
      innerScale: { x: innerScale.x, y: innerScale.y },
      worldPos: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
      ndc: { x: ndc.x, y: ndc.y, z: ndc.z },
      screenX,
      screenY,
      manualScreenX,
      manualScreenY,
      camPos: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
      Z_cam,
      perspScale
    };
  });

  console.log('Test Coords at 1000px:', JSON.stringify(testCoords, null, 2));
  await browser.close();
})();
