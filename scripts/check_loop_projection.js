const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 35000 });

  const info = await page.evaluate(async () => {
    window.scrollManager.scrollToPixel(2200, true);
    await new Promise(r => {
      let f = 0;
      function tick() { if (++f > 30) r(); else requestAnimationFrame(tick); }
      requestAnimationFrame(tick);
    });

    let lineMesh = null;
    window.homePage.preUfxContainer.traverse(obj => {
      if (obj.isMesh && obj.material && obj.material.defines && obj.material.defines.IS_LINE) {
        lineMesh = obj;
      }
    });

    // Find camera
    const camera = window.homePage.camera || window.visuals.camera;
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    // Get screen coordinates of loop center (0.50, -1.46)
    // In vertex shader:
    // float sx = (u_viewportResolution.x / length(u_viewportResolution)) / 0.87157;
    // vec2 cpx = vec2(CP.x * sx, CP.y);
    // pos = vec3(cpx, 0.0);
    // gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    const u_viewportResolution = lineMesh.material.uniforms.u_viewportResolution.value;
    const sx = (u_viewportResolution.x / Math.hypot(u_viewportResolution.x, u_viewportResolution.y)) / 0.87157;
    const cpx = 0.50 * sx;
    const cpy = -1.46;

    // Project (cpx, cpy, 0) through lineMesh.modelViewMatrix and camera.projectionMatrix
    // Note: lineMesh.matrixWorld
    const vec = new window.THREE.Vector3(cpx, cpy, 0);
    vec.applyMatrix4(lineMesh.matrixWorld);
    const worldPos = { x: vec.x, y: vec.y, z: vec.z };
    vec.project(camera);
    // NDC: -1 to 1
    const screenX = (vec.x * 0.5 + 0.5) * vw;
    const screenY = (-vec.y * 0.5 + 0.5) * vh;

    // Check where initiatives section is on DOM
    const initiativesEl = document.querySelector('#home-initiatives') || document.querySelector('.home-initiatives');
    const initiativesRect = initiativesEl ? initiativesEl.getBoundingClientRect() : null;

    return {
      u_viewportResolution: { x: u_viewportResolution.x, y: u_viewportResolution.y },
      sx,
      loopWorldPos: worldPos,
      loopNDC: { x: vec.x, y: vec.y, z: vec.z },
      loopScreenPos: { x: screenX, y: screenY },
      cameraPos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
      initiativesRect: initiativesRect ? {
        top: initiativesRect.top,
        bottom: initiativesRect.bottom,
        height: initiativesRect.height
      } : null,
      scrollPixel: window.scrollManager.scrollPixel
    };
  });

  console.log('Mobile 2200 Analysis:', JSON.stringify(info, null, 2));
  await browser.close();
})();
