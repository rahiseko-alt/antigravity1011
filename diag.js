const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' || m.text().includes('Lusion')) console.log('LOG:', m.text()); });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 8000));

  const r = await page.evaluate(() => {
    const L = window.__lusion;
    if (!L) return { error: 'no __lusion hook' };
    const { visuals, cameraControls, Box3, Vector3, model } = L;
    const g = window.goalTunnelAstronauts;

    // 1. model size
    const box = new Box3().setFromObject(model);
    const size = new Vector3(); box.getSize(size);

    // 2. root of the model
    let root = model; const chain = [];
    while (root.parent) { root = root.parent; chain.push(root.type + (root === g.container ? '(astroContainer)' : '')); }

    // 3. active stage + camera
    const stage = visuals.currentStage3D;
    const cam = cameraControls && cameraControls._camera;

    // 4. materials
    const mats = [];
    model.traverse(c => { if (c.isMesh) mats.push({ name: c.name, type: c.material.type, skinned: !!c.isSkinnedMesh, hasMap: !!c.material.map, vis: c.visible }); });

    // 5. astronaut reference
    const astroWorld = new Vector3(); g.transformObjectList[0].getWorldPosition(astroWorld);

    return {
      modelSize: size, boxMin: box.min, boxMax: box.max,
      modelPos: model.position, modelScale: model.scale, modelVisible: model.visible,
      parentChain: chain,
      rootIsActiveStage: root === stage,
      activeStageClass: stage && stage.constructor.name,
      stageCount: visuals.stage3DList.length,
      stageActive: visuals.stage3DList.map(s => ({ cls: s.constructor.name, active: s.isActive })),
      astroContainerParentIsActiveStage: g.container.parent === stage,
      camPos: cam ? cam.position : null,
      camNear: cam ? cam.near : null, camFar: cam ? cam.far : null,
      mats,
      astroPos: astroWorld,
      showRatio: g.showRatio
    };
  });
  console.log(JSON.stringify(r, null, 2));
  console.log('PAGE ERRORS:', errors);
  await page.screenshot({ path: 'diag_top.png' });
  await browser.close();
})();
