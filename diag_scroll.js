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

  let shots = 0;
  for (let i = 0; i < 70; i++) {
    for (let j = 0; j < 5; j++) { await page.mouse.wheel({ deltaY: 300 }); await new Promise(r => setTimeout(r, 30)); }
    await new Promise(r => setTimeout(r, 400));
    const s = await page.evaluate(() => {
      const L = window.__lusion, g = window.goalTunnelAstronauts;
      const stage = L.visuals.currentStage3D;
      return {
        stage: stage.constructor.name,
        avatarPos: [g.customAvatar.position.x, g.customAvatar.position.y, g.customAvatar.position.z].map(v => +v.toFixed(2)),
        astroPos: [g.transformObjectList[0].position.x, g.transformObjectList[0].position.y, g.transformObjectList[0].position.z].map(v => +v.toFixed(2)),
        avatarVis: g.customAvatar.visible,
        containerParent: g.container.parent === L.homePage.preUfxContainer ? 'preUfxContainer' : (g.container.parent && g.container.parent.constructor.name),
        showRatio: +g.showRatio.toFixed(2)
      };
    });
    console.log(i, JSON.stringify(s));
    if (s.stage === 'GoalTunnels' && shots < 4 && i % 3 === 0) {
      await page.screenshot({ path: `diag_tunnel_${i}.png` });
      shots++;
    }
  }
  await browser.close();
})();
