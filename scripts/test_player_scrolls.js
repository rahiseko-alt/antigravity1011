const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function testScrolls() {
  console.log('=== TESTING PLAYER CARDS & TUBE VISUALIZATION ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const artifactDir = 'C:/Users/user/.gemini/antigravity/brain/07359358-72d8-4fef-a077-8ee4bc8215db';
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 6500));

  const scrollPositions = [1200, 2000, 2800, 3600, 3900, 4200, 4500, 4800];
  for (const s of scrollPositions) {
    await page.evaluate((pos) => {
      window.scrollTo({ top: pos, behavior: 'instant' });
      if (window.scrollManager) {
        window.scrollManager.scrollPixel = pos;
        window.scrollManager.scroll = pos;
      }
    }, s);
    await new Promise(r => setTimeout(r, 800));
    const outPath = path.join(artifactDir, `test_player_s${s}.png`);
    await page.screenshot({ path: outPath });
    console.log(`Saved screenshot at S=${s}: ${outPath}`);
  }

  await browser.close();
  console.log('Testing completed!');
}

testScrolls().catch(console.error);
