const fs = require('fs');
const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new' });
  const page = await browser.newPage();
  const b64 = fs.readFileSync('mobile_02_reel_red_swoop.png').toString('base64');
  await page.setContent(`<html><body><img id="img" src="data:image/png;base64,${b64}" /><canvas id="c"></canvas></body></html>`);
  const details = await page.evaluate(() => {
    const img = document.getElementById('img');
    const c = document.getElementById('c');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;

    const colored = [];
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        const r = data[i], g = data[i+1], b = data[i+2];
        if (!(r >= 230 && g >= 230 && b >= 235)) {
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min > 30) {
            colored.push({ x, y, r, g, b });
          }
        }
      }
    }
    return {
      totalColored: colored.length,
      redSample: colored.filter(p => p.r > 150 && p.g < 100),
      cyanSample: colored.filter(p => p.b > 150 && p.g > 150 && p.r < 100)
    };
  });
  console.log('Total colored:', details.totalColored);
  console.log('Red samples count:', details.redSample.length, 'sample:', details.redSample.slice(0, 5));
  console.log('Cyan samples count:', details.cyanSample.length, 'sample:', details.cyanSample.slice(0, 5));
  await browser.close();
})();
