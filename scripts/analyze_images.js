const fs = require('fs');
const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function checkColors(imgPath) {
  if (!fs.existsSync(imgPath)) {
    console.log(`File not found: ${imgPath}`);
    return;
  }
  const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new' });
  const page = await browser.newPage();
  const b64 = fs.readFileSync(imgPath).toString('base64');
  const html = `
    <html>
      <body>
        <img id="img" src="data:image/png;base64,${b64}" />
        <canvas id="cvs"></canvas>
      </body>
    </html>
  `;
  await page.setContent(html);
  const colors = await page.evaluate(() => {
    const img = document.getElementById('img');
    const cvs = document.getElementById('cvs');
    cvs.width = img.naturalWidth;
    cvs.height = img.naturalHeight;
    const ctx = cvs.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, cvs.width, cvs.height).data;
    let redCount = 0, cyanCount = 0, greenCount = 0, whiteCount = 0;
    // Samples of visible non-black pixels
    const nonBlackSamples = [];
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (r > 40 || g > 40 || b > 40) {
        if (r > 160 && g < 80 && b < 80) redCount++;
        else if (r < 80 && g > 160 && b < 100) greenCount++;
        else if (r < 100 && g > 160 && b > 180) cyanCount++;
        else if (r > 180 && g > 180 && b > 180) whiteCount++;

        if (nonBlackSamples.length < 15 && (r > 100 || g > 100 || b > 100)) {
          nonBlackSamples.push({ r, g, b });
        }
      }
    }
    return { width: cvs.width, height: cvs.height, redCount, greenCount, cyanCount, whiteCount, nonBlackSamples };
  });
  console.log(imgPath, JSON.stringify(colors));
  await browser.close();
}

(async () => {
  await checkColors('mobile_02_reel_red_swoop.png');
  await checkColors('mobile_03_initiatives_green_loop.png');
  await checkColors('investigate_mobile_1200.png');
  await checkColors('investigate_mobile_1800.png');
  await checkColors('investigate_mobile_2200.png');
  await checkColors('investigate_mobile_2600.png');
})();
