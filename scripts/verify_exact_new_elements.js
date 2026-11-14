import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  // 1. Desktop Test for index.html
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 7000));

  // Get offsetTops of target sections
  const { ctaY, goalY } = await page.evaluate(() => {
    const cta = document.querySelector('.initiatives-cta-group') || document.getElementById('home-featured-cta');
    const goal = document.getElementById('home-goal');
    return {
      ctaY: cta ? cta.offsetTop : 0,
      goalY: goal ? goal.offsetTop : 0
    };
  });
  console.log("Desktop offsets -> CTA:", ctaY, "Goal:", goalY);

  // Scroll to Initiatives CTA Group (LINE & Email buttons)
  if (ctaY) {
    await page.evaluate(y => window.scrollManager.scrollToPixel(y - 200, false), ctaY);
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_desktop_initiatives_cta.png') });
    console.log("Saved verify_desktop_initiatives_cta.png");
  }

  // Scroll to Home Goal (Compact Stance & Details Link)
  if (goalY) {
    await page.evaluate(y => window.scrollManager.scrollToPixel(y + 50, false), goalY);
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_desktop_home_goal_compact.png') });
    console.log("Saved verify_desktop_home_goal_compact.png");
  }

  // 2. Mobile Test for index.html (390x844)
  const mobPage = await browser.newPage();
  await mobPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 7000));

  const { mobCtaY, mobGoalY } = await mobPage.evaluate(() => {
    const cta = document.querySelector('.initiatives-cta-group') || document.getElementById('home-featured-cta');
    const goal = document.getElementById('home-goal');
    return {
      mobCtaY: cta ? cta.offsetTop : 0,
      mobGoalY: goal ? goal.offsetTop : 0
    };
  });
  console.log("Mobile offsets -> CTA:", mobCtaY, "Goal:", mobGoalY);

  if (mobCtaY) {
    await mobPage.evaluate(y => window.scrollManager.scrollToPixel(y - 120, false), mobCtaY);
    await new Promise(r => setTimeout(r, 1200));
    await mobPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_mobile_initiatives_cta.png') });
    console.log("Saved verify_mobile_initiatives_cta.png");
  }

  if (mobGoalY) {
    await mobPage.evaluate(y => window.scrollManager.scrollToPixel(y + 40, false), mobGoalY);
    await new Promise(r => setTimeout(r, 1200));
    await mobPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_mobile_home_goal_compact.png') });
    console.log("Saved verify_mobile_home_goal_compact.png");
  }

  // 3. Guidelines Page Verification
  const guidePage = await browser.newPage();
  await guidePage.setViewport({ width: 1440, height: 900 });
  await guidePage.goto('http://localhost:3000/guidelines.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await guidePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_guidelines_desktop_top.png') });
  console.log("Saved verify_guidelines_desktop_top.png");

  await guidePage.evaluate(() => window.scrollTo(0, 700));
  await new Promise(r => setTimeout(r, 500));
  await guidePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_guidelines_desktop_bottom.png') });
  console.log("Saved verify_guidelines_desktop_bottom.png");

  // Mobile Guidelines Page
  await guidePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await guidePage.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await guidePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_guidelines_mobile.png') });
  console.log("Saved verify_guidelines_mobile.png");

  await browser.close();
  console.log("All verifications completed successfully!");
}

run().catch(console.error);
