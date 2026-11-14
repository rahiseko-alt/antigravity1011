const puppeteer = require('puppeteer-core');

async function inspectTubePixels() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 6500));

  for (const s of [3600, 3900, 4100, 4300, 4500, 4700]) {
    const data = await page.evaluate((pos) => {
      window.scrollTo({ top: pos, behavior: 'instant' });
      if (window.scrollManager) {
        window.scrollManager.scrollPixel = pos;
        window.scrollManager.scroll = pos;
      }
      // Return scrollManager and tube info if possible
      const canvas = document.getElementById('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return {
        pos,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height
      };
    }, s);
    console.log(`Evaluated at S=${s}`);
  }

  await browser.close();
}

inspectTubePixels().catch(console.error);
