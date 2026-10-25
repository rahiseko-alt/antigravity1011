const puppeteer = require('puppeteer-core');
const path = require('path');

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function verifyAllViewports() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const widths = [1920, 1440, 1280, 1024, 768, 390, 375];
  const results = [];

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

    const data = await page.evaluate(() => {
      const words = document.querySelectorAll('.end-section-title-link-word');
      const link = document.querySelector('#end-section-title-link');
      if (!words || words.length === 0) return { error: 'no words' };

      // Word 0..2: Join / Propose
      // Word 3: 企画を持ち込む・参加する
      const jpWord = words[words.length - 1];
      const jpWrappers = jpWord ? Array.from(jpWord.querySelectorAll('.char-wrapper')) : [];
      const jpChars = jpWrappers.map(w => {
        const c = w.querySelector('.char');
        const r = w.getBoundingClientRect();
        return { char: c ? c.innerText : '?', top: Math.round(r.top * 10) / 10, left: Math.round(r.left * 10) / 10, right: Math.round(r.right * 10) / 10 };
      });

      // Check if all characters in JP word have identical top (same line)
      const firstTop = jpChars.length > 0 ? jpChars[0].top : null;
      const allSameLine = jpChars.every(c => Math.abs(c.top - firstTop) < 1.0);

      // Check last char 'る'
      const lastChar = jpChars.length > 0 ? jpChars[jpChars.length - 1] : null;
      const isWithinWindow = lastChar ? lastChar.right <= window.innerWidth : false;

      // Check jumpGap on first char
      const firstWrapper = words[0].querySelector('.char-wrapper');
      const charsInFirst = firstWrapper ? firstWrapper.querySelectorAll('.char') : [];
      let jumpGap = null;
      if (charsInFirst.length >= 2) {
        const origR = charsInFirst[0].getBoundingClientRect();
        firstWrapper.style.transform = 'translate3d(0px, -100%, 0px)';
        const cloneR = charsInFirst[1].getBoundingClientRect();
        firstWrapper.style.transform = '';
        jumpGap = Math.abs(cloneR.top - origR.top);
      }

      return {
        viewportWidth: window.innerWidth,
        fontSize: window.getComputedStyle(link).fontSize,
        charCount: jpChars.length,
        firstChar: jpChars[0],
        lastChar: lastChar,
        allSameLine,
        isWithinWindow,
        jumpGap
      };
    });

    results.push(data);
    console.log(`[Viewport ${w}px]`, data);

    // Screenshot
    const shotPath = path.resolve(__dirname, `../verify_typography_fit_${w}px.png`);
    await page.screenshot({ path: shotPath });
    await page.close();
  }

  await browser.close();
  console.log("\n=== Final Verification Summary ===");
  console.log(JSON.stringify(results, null, 2));

  const allSuccess = results.every(r => r.allSameLine && r.isWithinWindow && r.jumpGap < 0.1);
  console.log("\n>>> ALL TESTS PASSED:", allSuccess);
}

verifyAllViewports().catch(console.error);
