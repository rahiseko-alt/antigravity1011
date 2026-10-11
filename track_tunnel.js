const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080', '--use-gl=angle', '--use-angle=d3d11']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 15000));

  console.log('Stepping scroll down to inspect tunnel transition...');
  for (let step = 0; step < 130; step++) {
    await page.mouse.wheel({ deltaY: 600 });
    await new Promise(r => setTimeout(r, 80));

    if (step === 75 || step === 90 || step === 100 || step === 110 || step === 125) {
      const info = await page.evaluate(() => {
        const astro = window.goalTunnelAstronauts;
        if (!astro) return 'no astro';
        return {
          showRatio: astro.showRatio,
          customMeshVisible: astro.customAvatarMesh ? astro.customAvatarMesh.visible : false,
          customMeshParent: astro.customAvatarMesh && astro.customAvatarMesh.parent ? astro.customAvatarMesh.parent.type : null,
          containerParent: astro.container && astro.container.parent ? astro.container.parent.type : null,
          transPos: astro.transformObjectList && astro.transformObjectList[0] ? astro.transformObjectList[0].position : null
        };
      });
      console.log('Step ' + step + ' status:', info);
      await page.screenshot({ path: 'tunnel_step_' + step + '.png', fullPage: false });
    }
  }

  await browser.close();
  console.log('Done captures!');
})();
