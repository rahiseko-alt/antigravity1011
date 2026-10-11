const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 8000));
  await page.mouse.move(720, 450);

  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 5; j++) { await page.mouse.wheel({ deltaY: 300 }); await new Promise(r => setTimeout(r, 30)); }
    await new Promise(r => setTimeout(r, 400));
  }
  await new Promise(r => setTimeout(r, 1500));

  const probe = await page.evaluate(() => {
    const L = window.__lusion, g = window.goalTunnelAstronauts;
    const { Vector3, Box3, cameraControls, visuals, properties } = L;
    const cam = cameraControls._camera;
    const stage = visuals.currentStage3D;
    cam.updateMatrixWorld();
    const wp = new Vector3(); g.customAvatar.getWorldPosition(wp);
    const ndc = wp.clone().project(cam);
    const box = new Box3().setFromObject(g.customAvatar);
    const astroMesh = g.meshes.wearpack;
    const astroBox = new Box3().setFromObject(astroMesh);
    return {
      stage: stage.constructor.name,
      stageCam: stage.camera ? { pos: stage.camera.position, isSame: stage.camera === cam } : null,
      ctrlCam: { pos: cam.position, near: cam.near, far: cam.far, fov: cam.fov },
      avatarWorld: wp, avatarNDC: ndc,
      avatarBox: { min: box.min, max: box.max },
      astroMeshGeoBox: astroBox.isEmpty() ? 'empty(GPU skinned)' : { min: astroBox.min, max: astroBox.max },
      astroMeshVisible: astroMesh.visible,
      bg: properties.bgColor ? properties.bgColor.getHexString() : null
    };
  });
  console.log(JSON.stringify(probe, null, 2));
  await page.screenshot({ path: 'diag_A_avatar.png' });

  await page.evaluate(() => window.toggleCharacter());
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: 'diag_B_astronaut.png' });
  await browser.close();
})();
