import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

async function findAndCapture(width, height, isMobile, prefix) {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile, hasTouch: isMobile });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 6500));

  // Find scroll for CTA group
  const ctaResult = await page.evaluate(async () => {
    const el = document.querySelector('.initiatives-cta-group');
    if (!el) return { error: 'No cta element' };
    
    // We want el.getBoundingClientRect().top to be around window.innerHeight / 2
    for (let sp = 0; sp <= window.scrollManager.contentSizePixel; sp += 50) {
      window.scrollManager.scrollToPixel(sp, true);
      const rect = el.getBoundingClientRect();
      if (rect.top >= 100 && rect.top <= window.innerHeight - 200) {
        return { sp, rect: { top: rect.top, height: rect.height } };
      }
    }
    return { error: 'Not in range' };
  });
  console.log(`${prefix} CTA find:`, ctaResult);

  if (ctaResult.sp !== undefined) {
    await page.evaluate(sp => window.scrollManager.scrollToPixel(sp, true), ctaResult.sp);
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${prefix}_initiatives_dual_cta.png`) });
    console.log(`Saved ${prefix}_initiatives_dual_cta.png`);
  }

  // Find scroll for home-goal
  const goalResult = await page.evaluate(async () => {
    const el = document.getElementById('home-goal');
    if (!el) return { error: 'No goal element' };
    
    for (let sp = 0; sp <= window.scrollManager.contentSizePixel; sp += 50) {
      window.scrollManager.scrollToPixel(sp, true);
      const rect = el.getBoundingClientRect();
      if (rect.top >= 50 && rect.top <= window.innerHeight - 150) {
        return { sp, rect: { top: rect.top, height: rect.height } };
      }
    }
    return { error: 'Goal not in range' };
  });
  console.log(`${prefix} Goal find:`, goalResult);

  if (goalResult.sp !== undefined) {
    await page.evaluate(sp => window.scrollManager.scrollToPixel(sp, true), goalResult.sp);
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, `${prefix}_compact_goal_details.png`) });
    console.log(`Saved ${prefix}_compact_goal_details.png`);
  }

  await browser.close();
}

(async () => {
  await findAndCapture(1440, 900, false, 'desktop');
  await findAndCapture(390, 844, true, 'mobile');
})();
