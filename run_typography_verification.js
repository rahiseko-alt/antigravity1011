const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "audit_artifacts");

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: [
      "--use-gl=angle",
      "--use-angle=default",
      "--enable-webgl",
      "--no-sandbox",
      "--window-size=1920,1080"
    ]
  });

  const report = {
    timestamp: new Date().toISOString(),
    desktop: {},
    mobile: {}
  };

  async function scrollTo(page, px, waitTime = 1200) {
    await page.evaluate((val) => {
      if (window.scrollManager) {
        window.scrollManager.scrollToPixel(val, true);
      } else {
        window.scrollTo(0, val);
      }
    }, px);
    await sleep(waitTime);
  }

  async function measure(page, selectors) {
    return await page.evaluate((sels) => {
      const res = {};
      for (const sel of sels) {
        const el = document.querySelector(sel);
        if (!el) {
          res[sel] = { exists: false };
          continue;
        }
        const cs = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        res[sel] = {
          exists: true,
          text: el.innerText ? el.innerText.trim().slice(0, 100) : "",
          fontSize: cs.fontSize,
          lineHeight: cs.lineHeight,
          fontWeight: cs.fontWeight,
          color: cs.color,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          isOverflowingX: el.scrollWidth > el.clientWidth + 1,
          isOverflowingY: el.scrollHeight > el.clientHeight + 1
        };
      }
      return res;
    }, selectors);
  }

  // 1. DESKTOP
  console.log("=== STARTING DESKTOP VERIFICATION (1920x1080) ===");
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => window.properties && window.properties.hasStarted && !window.properties.isIntroWarp,
    { timeout: 40000 }
  );
  await sleep(1500);

  // 1.1 Hero
  console.log("Desktop Hero...");
  await scrollTo(page, 0, 1000);
  report.desktop.hero = await measure(page, ["#home-hero", "#home-hero-title", "#home-hero-scroll"]);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_desktop_01_hero.png") });

  // 1.2 Reel
  console.log("Desktop Reel...");
  const reelY = await page.evaluate(() => document.getElementById("home-reel")?.offsetTop || 1080);
  await scrollTo(page, reelY, 1200);
  report.desktop.reel = await measure(page, [
    "#home-reel-title",
    "#home-reel-title-line-1",
    "#home-reel-title-line-2",
    "#home-reel-desc"
  ]);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_desktop_02_reel.png") });

  // 1.3 Featured Top & Cards
  console.log("Desktop Featured Top...");
  const featuredY = await page.evaluate(() => document.getElementById("home-featured")?.offsetTop || 2400);
  await scrollTo(page, featuredY, 1200);
  report.desktop.featuredTop = await measure(page, [
    "#home-featured-title",
    "#home-featured-disclaimer"
  ]);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_desktop_03_featured_top.png") });

  console.log("Desktop Featured Cards 1-4...");
  await scrollTo(page, featuredY + 1100, 1800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_desktop_03_featured_cards_1_4.png") });

  console.log("Desktop Featured Cards 5-8...");
  await scrollTo(page, featuredY + 2100, 1800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_desktop_03_featured_cards_5_8.png") });

  console.log("Desktop Featured Cards 9-10...");
  await scrollTo(page, featuredY + 3100, 1800);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_desktop_03_featured_cards_9_10.png") });

  // 1.4 Goal
  console.log("Desktop Goal...");
  const goalY = await page.evaluate(() => document.getElementById("home-goal")?.offsetTop || 6670);
  await scrollTo(page, goalY, 1500);
  report.desktop.goal = await measure(page, [
    "#home-goal-title",
    "#home-goal-texts",
    ".home-goal-texts-paragraph"
  ]);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_desktop_04_goal_context.png") });

  // 1.5 End Section (Scroll deep enough to activate letter reveal animation)
  console.log("Desktop End Section...");
  const endY = await page.evaluate(() => document.getElementById("end-section")?.offsetTop || 54072);
  await scrollTo(page, endY + 1600, 1800);
  report.desktop.end = await measure(page, [
    "#end-section-subtitle-text",
    "#end-section-title-link"
  ]);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_desktop_05_end_section.png") });

  // 1.6 Footer
  console.log("Desktop Footer...");
  const footerY = await page.evaluate(() => document.getElementById("footer-section")?.offsetTop || 58534);
  await scrollTo(page, footerY + 100, 1500);
  report.desktop.footer = await measure(page, [
    ".footer-address-line",
    ".footer-socials-line",
    "#footer-enquires-link",
    "#footer-business-link",
    "#footer-newsletter-header",
    "#footer-bottom-copyright"
  ]);
  await page.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_desktop_06_footer_section.png") });

  await page.close();

  // 2. MOBILE (390x844)
  console.log("=== STARTING MOBILE VERIFICATION (390x844) ===");
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await mobilePage.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await mobilePage.waitForFunction(
    () => window.properties && window.properties.hasStarted && !window.properties.isIntroWarp,
    { timeout: 40000 }
  );
  await sleep(1500);

  // 2.1 Hero
  console.log("Mobile Hero...");
  await scrollTo(mobilePage, 0, 1000);
  report.mobile.hero = await measure(mobilePage, ["#home-hero-title"]);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_mobile_01_hero.png") });

  // 2.2 Reel
  console.log("Mobile Reel...");
  const mReelY = await mobilePage.evaluate(() => document.getElementById("home-reel")?.offsetTop || 844);
  await scrollTo(mobilePage, mReelY, 1200);
  report.mobile.reel = await measure(mobilePage, [
    "#home-reel-title",
    "#home-reel-desc"
  ]);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_mobile_02_reel.png") });

  // 2.3 Featured
  console.log("Mobile Featured...");
  const mFeaturedY = await mobilePage.evaluate(() => document.getElementById("home-featured")?.offsetTop || 2000);
  await scrollTo(mobilePage, mFeaturedY, 1200);
  report.mobile.featuredTop = await measure(mobilePage, [
    "#home-featured-title",
    "#home-featured-disclaimer"
  ]);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_mobile_03_featured_top.png") });

  await scrollTo(mobilePage, mFeaturedY + 1000, 1800);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_mobile_03_featured_cards.png") });

  // 2.4 Goal
  console.log("Mobile Goal...");
  const mGoalY = await mobilePage.evaluate(() => document.getElementById("home-goal")?.offsetTop || 5000);
  await scrollTo(mobilePage, mGoalY, 1500);
  report.mobile.goal = await measure(mobilePage, [
    "#home-goal-title",
    ".home-goal-texts-paragraph"
  ]);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_mobile_04_goal_context.png") });

  // 2.5 End Section
  console.log("Mobile End Section...");
  const mEndY = await mobilePage.evaluate(() => document.getElementById("end-section")?.offsetTop || 35000);
  await scrollTo(mobilePage, mEndY + 1200, 1800);
  report.mobile.end = await measure(mobilePage, [
    "#end-section-subtitle-text",
    "#end-section-title-link"
  ]);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_mobile_05_end_section.png") });

  // 2.6 Footer
  console.log("Mobile Footer...");
  const mFooterY = await mobilePage.evaluate(() => document.getElementById("footer-section")?.offsetTop || 40000);
  await scrollTo(mobilePage, mFooterY, 1500);
  report.mobile.footer = await measure(mobilePage, [
    ".footer-address-line",
    ".footer-socials-line",
    "#footer-newsletter-header",
    "#footer-bottom-copyright"
  ]);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_mobile_06_footer_section.png") });

  await scrollTo(mobilePage, mFooterY + 550, 1500);
  await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, "after_typography_mobile_06_footer_bottom.png") });

  await mobilePage.close();
  await browser.close();

  fs.writeFileSync(path.join(OUTPUT_DIR, "after_typography_report.json"), JSON.stringify(report, null, 2));
  console.log("Verification finished successfully!");
}

run().catch(err => {
  console.error("Error in verification:", err);
  process.exit(1);
});
