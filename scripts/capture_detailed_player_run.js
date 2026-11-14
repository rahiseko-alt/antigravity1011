const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function capture() {
  console.log('=== CAPTURING PLAYER CARDS SCROLL DETAILS ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--enable-webgl']
  });

  const artifactDir = 'C:/Users/user/.gemini/antigravity/brain/07359358-72d8-4fef-a077-8ee4bc8215db';

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 6500));

  const scrolls = [3500, 3700, 3900, 4100, 4300, 4400, 4500, 4600];
  for (const s of scrolls) {
    await page.evaluate((pos) => {
      window.scrollTo({ top: pos, behavior: 'instant' });
      if (window.scrollManager) {
        window.scrollManager.scrollPixel = pos;
        window.scrollManager.scroll = pos;
      }
    }, s);
    await new Promise(r => setTimeout(r, 600));
    const outPath = path.join(artifactDir, `player_card_flow_s${s}.png`);
    await page.screenshot({ path: outPath });
    console.log(`Saved screenshot at S=${s}: ${outPath}`);
  }

  await browser.close();
  console.log('Done capturing detailed player run!');
}

capture().catch(console.error);
