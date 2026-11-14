const puppeteer = require('puppeteer-core');

async function checkColors() {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 6500));

  for (const s of [3600, 3900, 4200]) {
    await page.evaluate((pos) => {
      window.scrollTo({ top: pos, behavior: 'instant' });
      if (window.scrollManager) {
        window.scrollManager.scrollPixel = pos;
        window.scrollManager.scroll = pos;
      }
    }, s);
    await new Promise(r => setTimeout(r, 500));

    // Get pixel colors from canvas
    const colors = await page.evaluate(() => {
      const canvas = document.getElementById('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      const pixels = new Uint8Array(4 * canvas.width * canvas.height);
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      
      const found = {};
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i+1];
        const b = pixels[i+2];
        const a = pixels[i+3];
        if (a > 100) {
          // Identify primary colors
          let col = null;
          if (b > 200 && r < 50 && g < 150) col = 'Blue';
          else if (r > 200 && g > 180 && b < 50) col = 'Yellow';
          else if (r > 200 && g < 50 && b < 70) col = 'Red';
          else if (g > 180 && r < 50 && b < 100) col = 'Green';
          else if (r > 140 && b > 200 && g < 50) col = 'Purple';
          else if (r > 220 && g > 80 && g < 160 && b < 50) col = 'Orange';
          if (col) found[col] = (found[col] || 0) + 1;
        }
      }
      return found;
    });

    console.log(`Scroll S=${s} canvas colors:`, colors);
  }

  await browser.close();
}

checkColors().catch(console.error);
