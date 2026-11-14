const puppeteer = require('puppeteer-core');

async function debugScene() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 6500));

  const info = await page.evaluate(() => {
    window.scrollTo({ top: 4500, behavior: 'instant' });
    if (window.scrollManager) {
      window.scrollManager.scrollPixel = 4500;
      window.scrollManager.scroll = 4500;
    }

    // Inspect all meshes in three scene
    // Find window.app or three scene
    const meshes = [];
    function traverse(obj) {
      if (obj.isMesh && obj.visible) {
        meshes.push({
          name: obj.name,
          type: obj.type,
          material: obj.material ? obj.material.type : null,
          geometry: obj.geometry ? {
            type: obj.geometry.type,
            attributes: Object.keys(obj.geometry.attributes || {})
          } : null
        });
      }
      if (obj.children) {
        obj.children.forEach(traverse);
      }
    }

    // Find scene
    if (window.app && window.app.scene) {
      traverse(window.app.scene);
    }
    return { meshesCount: meshes.length, meshes };
  });

  console.log('Scene info at 4500:', JSON.stringify(info, null, 2));
  await browser.close();
}

debugScene().catch(console.error);
