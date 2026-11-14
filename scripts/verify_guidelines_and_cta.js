import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Desktop Check for index.html (Home)
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

  // Fast forward past preloader
  await page.evaluate(() => {
    if (window.__skipPreloader !== undefined) window.__skipPreloader = true;
    const p = document.getElementById('preloader');
    if (p) p.style.display = 'none';
  });
  await new Promise(r => setTimeout(r, 800));

  // Scroll to #home-featured CTA
  const ctaGroup = await page.$('.initiatives-cta-group');
  if (ctaGroup) {
    await page.evaluate(el => el.scrollIntoView({ block: 'center' }), ctaGroup);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'verify_desktop_initiatives_cta.png')
    });
    console.log('Saved verify_desktop_initiatives_cta.png');
  } else {
    console.error('Could not find .initiatives-cta-group');
  }

  // Scroll to #home-goal
  const homeGoal = await page.$('#home-goal');
  if (homeGoal) {
    await page.evaluate(el => el.scrollIntoView({ block: 'center' }), homeGoal);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'verify_desktop_home_goal_compact.png')
    });
    console.log('Saved verify_desktop_home_goal_compact.png');
  } else {
    console.error('Could not find #home-goal');
  }

  // 2. Mobile Viewport Check for index.html
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await new Promise(r => setTimeout(r, 400));
  if (ctaGroup) {
    await page.evaluate(el => el.scrollIntoView({ block: 'center' }), ctaGroup);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'verify_mobile_initiatives_cta.png')
    });
    console.log('Saved verify_mobile_initiatives_cta.png');
  }
  if (homeGoal) {
    await page.evaluate(el => el.scrollIntoView({ block: 'center' }), homeGoal);
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'verify_mobile_home_goal_compact.png')
    });
    console.log('Saved verify_mobile_home_goal_compact.png');
  }

  // 3. Guidelines Page Verification
  const pageGuidelines = await browser.newPage();
  await pageGuidelines.setViewport({ width: 1440, height: 900 });
  await pageGuidelines.goto('http://localhost:3000/guidelines.html', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await pageGuidelines.screenshot({
    path: path.join(ARTIFACTS_DIR, 'verify_guidelines_desktop_top.png')
  });
  console.log('Saved verify_guidelines_desktop_top.png');

  // Scroll down on guidelines page
  await pageGuidelines.evaluate(() => window.scrollTo(0, 800));
  await new Promise(r => setTimeout(r, 500));
  await pageGuidelines.screenshot({
    path: path.join(ARTIFACTS_DIR, 'verify_guidelines_desktop_bottom.png')
  });
  console.log('Saved verify_guidelines_desktop_bottom.png');

  // Mobile Guidelines Page
  await pageGuidelines.setViewport({ width: 390, height: 844, isMobile: true });
  await pageGuidelines.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  await pageGuidelines.screenshot({
    path: path.join(ARTIFACTS_DIR, 'verify_guidelines_mobile.png')
  });
  console.log('Saved verify_guidelines_mobile.png');

  await browser.close();
  console.log('All verifications completed successfully!');
}

run().catch(console.error);
