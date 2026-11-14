const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function inspectBreakages() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const widths = [1920, 1440, 1280, 1024, 820, 768, 480, 390];

  for (const w of widths) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    // Scroll to end section
    await page.evaluate(() => {
      const end = document.getElementById('end-section');
      if (end && window.scrollManager) {
        window.scrollManager.scrollToPixel(end.offsetTop + 400, false);
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    const info = await page.evaluate(() => {
      const link = document.querySelector('#end-section-title-link');
      const title = document.querySelector('#end-section-title');
      const lines = document.querySelectorAll('.end-section-title-link-line');
      const words = document.querySelectorAll('.end-section-title-link-word');
      
      return {
        viewportWidth: window.innerWidth,
        titleWidth: title ? title.offsetWidth : null,
        titleScrollWidth: title ? title.scrollWidth : null,
        linkWidth: link ? link.offsetWidth : null,
        linkScrollWidth: link ? link.scrollWidth : null,
        fontSize: window.getComputedStyle(link).fontSize,
        lineCount: lines.length,
        linesText: Array.from(lines).map(l => l.innerText.replace(/\s+/g, ' ').trim()),
        wordsCount: words.length
      };
    });

    console.log(`\n--- Width: ${w}px ---`);
    console.log(info);

    const shotPath = path.resolve(__dirname, `../verify_title_w${w}.png`);
    // capture title element
    const titleElem = await page.$('#end-section-title');
    if (titleElem) {
      await titleElem.screenshot({ path: shotPath });
    }
    await page.close();
  }

  await browser.close();
}

inspectBreakages().catch(console.error);
