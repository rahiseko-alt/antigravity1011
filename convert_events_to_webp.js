const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function convertImageToWebP(inputJpgPath, outputWebpPath, backupPath) {
  // Backup if exists
  if (fs.existsSync(outputWebpPath) && !fs.existsSync(backupPath)) {
    fs.copyFileSync(outputWebpPath, backupPath);
    console.log(`Backed up ${outputWebpPath} to ${backupPath}`);
  }

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const fullInputPath = path.resolve(inputJpgPath);
    const inputData = fs.readFileSync(fullInputPath);
    const base64Jpg = 'data:image/jpeg;base64,' + inputData.toString('base64');

    const webpDataUrl = await page.evaluate(async (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/webp', 0.92));
        };
        img.onerror = (e) => reject(e);
        img.src = src;
      });
    }, base64Jpg);

    const base64Data = webpDataUrl.replace(/^data:image\/webp;base64,/, '');
    fs.writeFileSync(path.resolve(outputWebpPath), Buffer.from(base64Data, 'base64'));
    console.log(`Successfully converted ${inputJpgPath} -> ${outputWebpPath} (${fs.statSync(outputWebpPath).size} bytes)`);
  } finally {
    await browser.close();
  }
}

(async () => {
  try {
    // 1. atlas_motion (AIアート展)
    await convertImageToWebP(
      'assets/images/events/event_ai_art.jpg',
      'assets/projects/atlas_motion/home.webp',
      'assets/projects/atlas_motion/home.webp.bak'
    );

    // 2. oryzo_ai (AI小技)
    await convertImageToWebP(
      'assets/images/events/event_koeda.jpg',
      'assets/projects/oryzo_ai/home.webp',
      'assets/projects/oryzo_ai/home.webp.bak'
    );

    console.log('All images converted to WebP successfully.');
  } catch (err) {
    console.error('Error converting images:', err);
    process.exit(1);
  }
})();
