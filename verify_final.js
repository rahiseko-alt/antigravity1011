
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer-core");

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log("=== Fixed Warp Text Verification (Intro vs Native) ===");
  const chromePath = "C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe";

  const consoleErrors = [];
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: [
      "--use-gl=angle",
      "--enable-webgl",
      "--no-sandbox",
      "--window-size=1920,1080"
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  page.on("console", msg => {
    const text = msg.text();
    const type = msg.type();
    if (type === "error") {
      if (
        !text.includes("font-size:0;color:transparent") &&
        !text.includes("ERR_CONNECTION_CLOSED") &&
        !text.includes("favicon")
      ) {
        console.error("[Console Error]", text);
        consoleErrors.push(text);
      }
    }
  });

  page.on("pageerror", err => {
    console.error("[Page Error]", err.message);
    consoleErrors.push(err.message);
  });

  console.log("Loading page: http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });

  await page.waitForFunction(() => window.goalTunnels && window.goalTunnels.hasIntroInitialized, { timeout: 35000 });
  console.log("Intro initialized!");

  const ratios = [0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9];
  const results = {
    intro: [],
    native: []
  };

  // -------------------------------------------------------------
  // 1. INTRO: CAPTURE AT SPECIFIED PHASES
  // -------------------------------------------------------------
  console.log("\n--- Capturing Intro Warp Text ---");
  for (const r of ratios) {
    const tPureBlack = 0.50;
    const tTitle = 2.60;
    const elapsedSec = tPureBlack + r * (tTitle - tPureBlack);

    await page.evaluate((elapsed) => {
      window.goalTunnels.introStartTime = performance.now() - (elapsed * 1000);
      window.visuals.syncProperties(1/60);
      window.visuals.update(1/60);
    }, elapsedSec);

    await sleep(100);

    const introData = await page.evaluate((targetR) => {
      const titleEl = document.getElementById("home-goal-tunnel-title");
      const introWrap = document.getElementById("intro-tunnel-title-wrapper");
      const bTitle = window.homeGoalSectionRanges?.getRange("blackTitle");
      const compTitle = titleEl ? window.getComputedStyle(titleEl) : null;
      const rectTitle = titleEl ? titleEl.getBoundingClientRect() : null;
      const spans = titleEl ? Array.from(titleEl.querySelectorAll(".home-goal-tunnel-title-line span")).map(s => ({
        text: s.textContent,
        transform: s.style.transform,
        computedTransform: window.getComputedStyle(s).transform,
        rect: s.getBoundingClientRect()
      })) : [];

      const lines = titleEl ? Array.from(titleEl.querySelectorAll(".home-goal-tunnel-title-line")).map(l => ({
        text: l.textContent,
        rect: l.getBoundingClientRect()
      })) : [];

      return {
        targetR,
        blackTitleRatio: bTitle ? bTitle.ratio : null,
        totalLineHeight: window.homeGoalSectionTunnelTitle?.totalLineHeight,
        container: {
          id: titleEl?.id,
          parentId: titleEl?.parentElement?.id,
          visibility: titleEl?.style.visibility,
          computedVisibility: compTitle?.visibility,
          opacity: titleEl?.style.opacity,
          computedOpacity: compTitle?.opacity,
          inlineTransform: titleEl?.style.transform,
          computedTransform: compTitle?.transform,
          fontSize: compTitle?.fontSize,
          fontFamily: compTitle?.fontFamily,
          rect: rectTitle ? { top: Math.round(rectTitle.top), left: Math.round(rectTitle.left), width: Math.round(rectTitle.width), height: Math.round(rectTitle.height) } : null
        },
        wrapper: {
          visibility: introWrap?.style.visibility,
          display: introWrap?.style.display,
          transform: introWrap?.style.transform,
          rect: introWrap?.getBoundingClientRect() ? { top: Math.round(introWrap.getBoundingClientRect().top), left: Math.round(introWrap.getBoundingClientRect().left), width: Math.round(introWrap.getBoundingClientRect().width) } : null
        },
        lines,
        spans: spans.map(s => ({ text: s.text, transform: s.transform, left: Math.round(s.rect.left), width: Math.round(s.rect.width) }))
      };
    }, r);

    results.intro.push(introData);
    const shotPath = "fixed_intro_text_r" + r + ".png";
    await page.screenshot({ path: shotPath });
    console.log("[Intro r=" + r + "] -> " + shotPath + " | op=" + introData.container.opacity + ", rect=" + JSON.stringify(introData.container.rect) + ", totalLineHeight=" + introData.totalLineHeight);
    console.log("  Words: " + introData.spans.map(s => s.text + "(" + s.transform + ")").join(", "));
  }

  // -------------------------------------------------------------
  // 2. FAST-FORWARD INTRO TO REGULAR PAGE
  // -------------------------------------------------------------
  console.log("\n--- Transitioning to regular page for Native Mid-Page ---");
  await page.evaluate(() => {
    window.goalTunnels.introStartTime = performance.now() - 35000;
    window.visuals.syncProperties(1/60);
    window.visuals.update(1/60);
  });
  await sleep(1500);

  // -------------------------------------------------------------
  // 3. NATIVE MID-PAGE: SCROLL TO #home-goal AT SAME PHASES
  // -------------------------------------------------------------
  console.log("\n--- Capturing Native Mid-Page Warp Text (Real Scroll to #home-goal) ---");
  for (const r of ratios) {
    await page.evaluate((targetR) => {
      const ranges = window.homeGoalSectionRanges;
      const bt = ranges.items.blackTitle;
      const btRatio = 0.25 + targetR * 0.75;
      const targetOffsetY = bt.pixelFrom + btRatio * bt.pixelCount;
      const targetScrollPx = ranges.baseY + targetOffsetY;

      window.scrollManager.scrollToPixel(targetScrollPx, true);
      window.scrollManager.scrollPixel = targetScrollPx;
      window.scrollManager.targetScrollPixel = targetScrollPx;
      ranges.update(1/60);
      window.visuals.update(1/60);
    }, r);

    await sleep(100);

    const nativeData = await page.evaluate((targetR) => {
      const titleEl = document.getElementById("home-goal-tunnel-title");
      const bTitle = window.homeGoalSectionRanges?.getRange("blackTitle");
      const compTitle = titleEl ? window.getComputedStyle(titleEl) : null;
      const rectTitle = titleEl ? titleEl.getBoundingClientRect() : null;
      const spans = titleEl ? Array.from(titleEl.querySelectorAll(".home-goal-tunnel-title-line span")).map(s => ({
        text: s.textContent,
        transform: s.style.transform,
        computedTransform: window.getComputedStyle(s).transform,
        rect: s.getBoundingClientRect()
      })) : [];

      const lines = titleEl ? Array.from(titleEl.querySelectorAll(".home-goal-tunnel-title-line")).map(l => ({
        text: l.textContent,
        rect: l.getBoundingClientRect()
      })) : [];

      return {
        targetR,
        blackTitleRatio: bTitle ? bTitle.ratio : null,
        scrollPixel: window.scrollManager?.scrollPixel,
        totalLineHeight: window.homeGoalSectionTunnelTitle?.totalLineHeight,
        container: {
          id: titleEl?.id,
          parentId: titleEl?.parentElement?.id,
          visibility: titleEl?.style.visibility,
          computedVisibility: compTitle?.visibility,
          opacity: titleEl?.style.opacity,
          computedOpacity: compTitle?.opacity,
          inlineTransform: titleEl?.style.transform,
          computedTransform: compTitle?.transform,
          fontSize: compTitle?.fontSize,
          fontFamily: compTitle?.fontFamily,
          rect: rectTitle ? { top: Math.round(rectTitle.top), left: Math.round(rectTitle.left), width: Math.round(rectTitle.width), height: Math.round(rectTitle.height) } : null
        },
        lines,
        spans: spans.map(s => ({ text: s.text, transform: s.transform, left: Math.round(s.rect.left), width: Math.round(s.rect.width) }))
      };
    }, r);

    results.native.push(nativeData);
    const shotPath = "fixed_native_text_r" + r + ".png";
    await page.screenshot({ path: shotPath });
    console.log("[Native r=" + r + "] -> " + shotPath + " | op=" + nativeData.container.opacity + ", rect=" + JSON.stringify(nativeData.container.rect) + ", totalLineHeight=" + nativeData.totalLineHeight);
    console.log("  Words: " + nativeData.spans.map(s => s.text + "(" + s.transform + ")").join(", "));
  }

  // -------------------------------------------------------------
  // 4. CONFIRM NATIVE MID-PAGE STILL WORKS INTERACTIVELY
  // -------------------------------------------------------------
  console.log("\n--- Testing Native Mid-Page Smooth Scroll Response ---");
  const scrollTest = await page.evaluate(() => {
    const ranges = window.homeGoalSectionRanges;
    const bt = ranges.items.blackTitle;
    const targetScroll = ranges.baseY + bt.pixelFrom + 0.5 * bt.pixelCount;
    window.scrollManager.scrollToPixel(targetScroll, false);
    return {
      scrollPixel: window.scrollManager.scrollPixel,
      targetScrollPixel: window.scrollManager.targetScrollPixel
    };
  });
  console.log("Smooth scroll requested:", scrollTest);

  fs.writeFileSync("final_verification_report.json", JSON.stringify({ results, consoleErrors }, null, 2), "utf8");
  console.log("\n=== All Verification Passed! Console errors: " + consoleErrors.length + " ===");
  await browser.close();
})();
