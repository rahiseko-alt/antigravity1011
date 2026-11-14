const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function checkClipping() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const widths = [1920, 1600, 1440, 1366, 1280, 1024, 820, 768, 414, 390, 375];

  for (const w of widths) {
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: 900 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    await page.evaluate(() => {
      const end = document.getElementById('end-section');
      if (end && window.scrollManager) {
        window.scrollManager.scrollToPixel(end.offsetTop + 400, false);
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    const check = await page.evaluate(() => {
      const link = document.querySelector('#end-section-title-link');
      const lines = document.querySelectorAll('.end-section-title-link-line');
      const words = document.querySelectorAll('.end-section-title-link-word');
      const jpWord = words[words.length - 1]; // "企画を持ち込む・参加する"
      
      const jpChars = jpWord ? jpWord.querySelectorAll('.char-wrapper') : [];
      const lastChar = jpChars.length > 0 ? jpChars[jpChars.length - 1] : null;

      const windowW = window.innerWidth;
      const lastCharRect = lastChar ? lastChar.getBoundingClientRect() : null;
      const jpWordRect = jpWord ? jpWord.getBoundingClientRect() : null;
      const linkRect = link ? link.getBoundingClientRect() : null;

      const isClippedRight = lastCharRect ? (lastCharRect.right > windowW) : false;
      const isWordClippedRight = jpWordRect ? (jpWordRect.right > windowW) : false;

      return {
        windowW,
        fontSize: window.getComputedStyle(link).fontSize,
        jpWordWidth: jpWordRect ? jpWordRect.width : 0,
        jpWordRight: jpWordRect ? jpWordRect.right : 0,
        lastCharRight: lastCharRect ? lastCharRect.right : 0,
        overflowRight: lastCharRect ? Math.max(0, lastCharRect.right - windowW) : 0,
        isClippedRight
      };
    });

    console.log(`Viewport ${w}px:`, check);
    await page.close();
  }

  await browser.close();
}

checkClipping().catch(console.error);
