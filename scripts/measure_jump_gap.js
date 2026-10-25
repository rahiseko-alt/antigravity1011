const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function measureJumpGap(viewport, isMobile = false) {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport(viewport);

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  // Scroll to EndSection
  await page.evaluate(() => {
    const end = document.getElementById('end-section');
    if (end && window.scrollManager) {
      window.scrollManager.scrollToPixel(end.offsetTop + 400, false);
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  const result = await page.evaluate(() => {
    const link = document.querySelector('#end-section-title-link');
    const word = document.querySelector('.end-section-title-link-word');
    const firstWrapper = word ? word.querySelector('.char-wrapper') : null;
    if (!firstWrapper) {
      return { 
        error: 'firstWrapper not found',
        linkExists: !!link,
        linkInner: link ? link.innerHTML.slice(0, 200) : null
      };
    }

    const chars = firstWrapper.querySelectorAll('.char');
    if (chars.length < 2) {
      return {
        error: 'chars < 2',
        charsCount: chars.length
      };
    }

    const origChar = chars[0];
    const cloneChar = chars[1];

    const wrapperStyle = window.getComputedStyle(firstWrapper);
    const origStyle = window.getComputedStyle(origChar);
    const cloneStyle = window.getComputedStyle(cloneChar);

    const origRect0 = origChar.getBoundingClientRect();
    const cloneRect0 = cloneChar.getBoundingClientRect();

    const wrapperHeight = firstWrapper.offsetHeight;
    const initialOffset = cloneRect0.top - origRect0.top;

    // Simulate rollup end: translate3d(0, -100%, 0)
    // -100% of wrapper = -wrapperHeight
    firstWrapper.style.transform = 'translate3d(0px, -100%, 0px)';
    const origRect100 = origChar.getBoundingClientRect();
    const cloneRect100 = cloneChar.getBoundingClientRect();

    // Reset transform
    firstWrapper.style.transform = '';

    const jumpGap = Math.abs(cloneRect100.top - origRect0.top);

    return {
      fontSize: origStyle.fontSize,
      wrapperLineHeight: wrapperStyle.lineHeight,
      charLineHeight: origStyle.lineHeight,
      wrapperHeight: wrapperHeight,
      initialOffset: initialOffset,
      origTop0: origRect0.top,
      cloneTop0: cloneRect0.top,
      cloneTop100: cloneRect100.top,
      jumpGap: jumpGap,
      isPerfect: jumpGap < 0.1
    };
  });

  const shotPath = path.resolve(__dirname, `../verify_rollup_jump_${viewport.width}x${viewport.height}.png`);
  await page.screenshot({ path: shotPath, fullPage: false });

  await browser.close();
  return { viewport, result, shotPath };
}

async function run() {
  console.log("=== Testing Desktop (1920x1080) ===");
  const desktop = await measureJumpGap({ width: 1920, height: 1080 });
  console.log(JSON.stringify(desktop.result, null, 2));

  console.log("\n=== Testing Mobile (390x844) ===");
  const mobile = await measureJumpGap({ width: 390, height: 844, isMobile: true });
  console.log(JSON.stringify(mobile.result, null, 2));

  const allPerfect = desktop.result.isPerfect && mobile.result.isPerfect;
  console.log("\n>>> ALL PERFECT 0.0px:", allPerfect);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
