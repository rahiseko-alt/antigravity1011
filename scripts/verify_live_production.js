const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function verifyProduction() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log("Loading production live site...");
  await page.goto('https://rahiseko-alt.github.io/antigravity1011/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  await page.evaluate(() => {
    const end = document.getElementById('end-section');
    if (end && window.scrollManager) {
      window.scrollManager.scrollToPixel(end.offsetTop + 400, false);
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  const result = await page.evaluate(() => {
    const word = document.querySelector('.end-section-title-link-word');
    const firstWrapper = word ? word.querySelector('.char-wrapper') : null;
    if (!firstWrapper) return { error: 'firstWrapper not found' };

    const chars = firstWrapper.querySelectorAll('.char');
    if (chars.length < 2) return { error: 'chars < 2' };

    const origChar = chars[0];
    const cloneChar = chars[1];

    const wrapperStyle = window.getComputedStyle(firstWrapper);
    const origStyle = window.getComputedStyle(origChar);

    const origRect0 = origChar.getBoundingClientRect();
    firstWrapper.style.transform = 'translate3d(0px, -100%, 0px)';
    const cloneRect100 = cloneChar.getBoundingClientRect();
    firstWrapper.style.transform = '';

    const jumpGap = Math.abs(cloneRect100.top - origRect0.top);

    return {
      fontSize: origStyle.fontSize,
      charLineHeight: origStyle.lineHeight,
      wrapperLineHeight: wrapperStyle.lineHeight,
      origTop0: origRect0.top,
      cloneTop100: cloneRect100.top,
      jumpGap: jumpGap,
      isPerfect: jumpGap < 0.1
    };
  });

  console.log("Production Live Result:", JSON.stringify(result, null, 2));
  await browser.close();
}

verifyProduction().catch(console.error);
