const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, 'audit_artifacts');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAudit() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--no-sandbox',
      '--window-size=1920,1080'
    ]
  });

  const report = {
    timestamp: new Date().toISOString(),
    desktop: {},
    mobile: {}
  };

  try {
    // ----------------------------------------------------
    // 1. DESKTOP AUDIT (1920x1080)
    // ----------------------------------------------------
    console.log('=== STARTING DESKTOP AUDIT (1920x1080) ===');
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for intro completion on Desktop...');
    await page.waitForFunction(
      () => window.properties && window.properties.hasStarted && !window.properties.isIntroWarp,
      { timeout: 40000 }
    );
    await sleep(1500); // Wait for Hero settling
    console.log('Hero settled!');

    // Helper to measure element styles
    async function measureElements(selectors) {
      return await page.evaluate((sels) => {
        const results = {};
        for (const sel of sels) {
          const el = document.querySelector(sel);
          if (!el) {
            results[sel] = { exists: false };
            continue;
          }
          const cs = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          results[sel] = {
            exists: true,
            tagName: el.tagName,
            text: el.innerText ? el.innerText.trim().slice(0, 100) : '',
            fontSize: cs.fontSize,
            lineHeight: cs.lineHeight,
            fontFamily: cs.fontFamily,
            fontWeight: cs.fontWeight,
            letterSpacing: cs.letterSpacing,
            wordBreak: cs.wordBreak,
            whiteSpace: cs.whiteSpace,
            color: cs.color,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            isOverflowingX: el.scrollWidth > el.clientWidth + 1,
            isOverflowingY: el.scrollHeight > el.clientHeight + 1
          };
        }
        return results;
      }, selectors);
    }

    // Scroll helper that updates window.scrollManager and waits for RAF
    async function scrollTo(pixel) {
      await page.evaluate((px) => {
        if (window.scrollManager) {
          window.scrollManager.scrollToPixel(px, true);
        } else {
          window.scrollTo(0, px);
        }
      }, pixel);
      await sleep(500); // Allow render/animation loop to settle
    }

    // Capture desktop screenshots
    console.log('Capturing Desktop Hero...');
    await scrollTo(0);
    const heroMetrics = await measureElements([
      '#home-hero',
      '#home-hero-title',
      '#home-hero-scroll'
    ]);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'desktop_01_hero.png') });

    console.log('Capturing Desktop Reel...');
    // Find reel position
    const reelY = await page.evaluate(() => {
      const el = document.getElementById('home-reel');
      return el ? el.offsetTop || 1080 : 1080;
    });
    await scrollTo(reelY);
    const reelMetrics = await measureElements([
      '#home-reel',
      '#home-reel-title',
      '#home-reel-title-line-1',
      '#home-reel-title-line-2',
      '#home-reel-desc',
      '#home-reel-cta'
    ]);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'desktop_02_reel.png') });

    console.log('Capturing Desktop Featured (Initiatives)...');
    const featuredY = await page.evaluate(() => {
      const el = document.getElementById('home-featured');
      return el ? el.offsetTop || 2400 : 2400;
    });
    await scrollTo(featuredY);
    const featuredMetricsTop = await measureElements([
      '#home-featured',
      '#home-featured-title',
      '#home-featured-disclaimer',
      '#home-featured-cta'
    ]);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'desktop_03_featured_top.png') });

    // Measure all 10 cards
    const cardMetrics = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.project-item'));
      return cards.map((c, i) => {
        const l1 = c.querySelector('.project-item-line-1');
        const l2 = c.querySelector('.project-item-line-2-inner');
        const cs1 = l1 ? window.getComputedStyle(l1) : null;
        const cs2 = l2 ? window.getComputedStyle(l2) : null;
        const r1 = l1 ? l1.getBoundingClientRect() : null;
        const r2 = l2 ? l2.getBoundingClientRect() : null;
        return {
          index: i + 1,
          id: c.getAttribute('data-id'),
          line1: {
            text: l1 ? l1.textContent.trim() : '',
            fontSize: cs1 ? cs1.fontSize : null,
            lineHeight: cs1 ? cs1.lineHeight : null,
            rect: r1 ? { width: r1.width, height: r1.height } : null,
            isOverflowingX: l1 ? l1.scrollWidth > l1.clientWidth + 1 : false
          },
          line2: {
            text: l2 ? l2.textContent.trim() : '',
            fontSize: cs2 ? cs2.fontSize : null,
            lineHeight: cs2 ? cs2.lineHeight : null,
            rect: r2 ? { width: r2.width, height: r2.height } : null,
            isOverflowingX: l2 ? l2.scrollWidth > l2.clientWidth + 1 : false
          }
        };
      });
    });

    await scrollTo(featuredY + 800);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'desktop_03_featured_cards_1_4.png') });

    await scrollTo(featuredY + 1800);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'desktop_03_featured_cards_5_8.png') });

    await scrollTo(featuredY + 2800);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'desktop_03_featured_cards_9_10.png') });

    console.log('Capturing Desktop Goal...');
    const goalY = await page.evaluate(() => {
      const el = document.getElementById('home-goal');
      return el ? el.offsetTop || 6670 : 6670;
    });
    await scrollTo(goalY);
    const goalContextMetrics = await measureElements([
      '#home-goal',
      '#home-goal-title',
      '.home-goal-texts-paragraph',
      '#home-goal-tunnel-title'
    ]);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'desktop_04_goal_context.png') });

    // Mid-page tunnel
    const tunnelScroll = await page.evaluate(() => {
      if (window.homeGoalSectionRanges) {
        const bt = window.homeGoalSectionRanges.items.blackTitle;
        if (bt) {
          return window.homeGoalSectionRanges.baseY + bt.pixelFrom + bt.pixelCount * 0.45;
        }
      }
      return null;
    });
    if (tunnelScroll) {
      await scrollTo(tunnelScroll);
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'desktop_04_goal_tunnel.png') });
    }

    console.log('Capturing Desktop End Section...');
    const endSectionScroll = await page.evaluate(() => {
      const el = document.getElementById('end-section');
      return el ? el.offsetTop : 54754;
    });
    await scrollTo(endSectionScroll);
    const endSectionMetrics = await measureElements([
      '#end-section',
      '#end-section-subtitle-text',
      '#end-section-title-link',
      '#end-bottom-text'
    ]);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'desktop_05_end_section.png') });

    console.log('Capturing Desktop Footer Section...');
    const footerScroll = await page.evaluate(() => {
      const el = document.getElementById('footer-section');
      return el ? el.offsetTop : 58534;
    });
    await scrollTo(footerScroll);
    const footerMetrics = await measureElements([
      '#footer-section',
      '#footer-contact-address',
      '.footer-address-line',
      '.footer-socials-line',
      '#footer-enquires-header',
      '#footer-enquires-link',
      '#footer-business-header',
      '#footer-business-link',
      '.footer-newsletter-line',
      '#footer-newsletter-input-field',
      '#footer-bottom-copyright',
      '#footer-bottom-tagline'
    ]);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'desktop_06_footer_section.png') });

    report.desktop = {
      hero: heroMetrics,
      reel: reelMetrics,
      featuredTop: featuredMetricsTop,
      featuredCards: cardMetrics,
      goal: goalContextMetrics,
      endSection: endSectionMetrics,
      footer: footerMetrics
    };

    await page.close();

    // ----------------------------------------------------
    // 2. MOBILE AUDIT (390x844)
    // ----------------------------------------------------
    console.log('\n=== STARTING MOBILE AUDIT (390x844) ===');
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    console.log('Waiting for intro completion on Mobile...');
    await mobilePage.waitForFunction(
      () => window.properties && window.properties.hasStarted && !window.properties.isIntroWarp,
      { timeout: 40000 }
    );
    await sleep(1500);

    async function measureMobileElements(sels) {
      return await mobilePage.evaluate((s) => {
        const results = {};
        for (const sel of s) {
          const el = document.querySelector(sel);
          if (!el) {
            results[sel] = { exists: false };
            continue;
          }
          const cs = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          results[sel] = {
            exists: true,
            tagName: el.tagName,
            text: el.innerText ? el.innerText.trim().slice(0, 100) : '',
            fontSize: cs.fontSize,
            lineHeight: cs.lineHeight,
            fontFamily: cs.fontFamily,
            fontWeight: cs.fontWeight,
            letterSpacing: cs.letterSpacing,
            wordBreak: cs.wordBreak,
            whiteSpace: cs.whiteSpace,
            color: cs.color,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
            isOverflowingX: el.scrollWidth > el.clientWidth + 1
          };
        }
        return results;
      }, sels);
    }

    async function scrollMobileTo(pixel) {
      await mobilePage.evaluate((px) => {
        if (window.scrollManager) {
          window.scrollManager.scrollToPixel(px, true);
        } else {
          window.scrollTo(0, px);
        }
      }, pixel);
      await sleep(500);
    }

    console.log('Capturing Mobile Hero...');
    await scrollMobileTo(0);
    const mHero = await measureMobileElements(['#home-hero', '#home-hero-title', '#home-hero-scroll']);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_01_hero.png') });

    console.log('Capturing Mobile Reel...');
    const mReelY = await mobilePage.evaluate(() => {
      const el = document.getElementById('home-reel');
      return el ? el.offsetTop : 844;
    });
    await scrollMobileTo(mReelY);
    const mReel = await measureMobileElements([
      '#home-reel',
      '#home-reel-title',
      '#home-reel-title-line-1',
      '#home-reel-title-line-2',
      '#home-reel-desc',
      '#home-reel-cta'
    ]);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_02_reel.png') });

    console.log('Capturing Mobile Featured...');
    const mFeaturedY = await mobilePage.evaluate(() => {
      const el = document.getElementById('home-featured');
      return el ? el.offsetTop : 1800;
    });
    await scrollMobileTo(mFeaturedY);
    const mFeaturedTop = await measureMobileElements([
      '#home-featured',
      '#home-featured-title',
      '#home-featured-disclaimer',
      '#home-featured-cta'
    ]);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_03_featured_top.png') });

    await scrollMobileTo(mFeaturedY + 600);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_03_featured_cards.png') });

    console.log('Capturing Mobile Goal...');
    const mGoalY = await mobilePage.evaluate(() => {
      const el = document.getElementById('home-goal');
      return el ? el.offsetTop : 5000;
    });
    await scrollMobileTo(mGoalY);
    const mGoal = await measureMobileElements([
      '#home-goal',
      '#home-goal-title',
      '.home-goal-texts-paragraph',
      '#home-goal-tunnel-title'
    ]);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_04_goal_context.png') });

    console.log('Capturing Mobile End Section...');
    const mEndY = await mobilePage.evaluate(() => {
      const el = document.getElementById('end-section');
      return el ? el.offsetTop : 20000;
    });
    await scrollMobileTo(mEndY);
    const mEnd = await measureMobileElements([
      '#end-section',
      '#end-section-subtitle-text',
      '#end-section-title-link'
    ]);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_05_end_section.png') });

    console.log('Capturing Mobile Footer...');
    const mFooterY = await mobilePage.evaluate(() => {
      const el = document.getElementById('footer-section');
      return el ? el.offsetTop : 23000;
    });
    await scrollMobileTo(mFooterY);
    const mFooter = await measureMobileElements([
      '#footer-section',
      '#footer-contact-address',
      '.footer-address-line',
      '.footer-socials-line',
      '#footer-enquires-header',
      '#footer-enquires-link',
      '.footer-newsletter-line',
      '#footer-bottom-copyright'
    ]);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_06_footer_section.png') });

    report.mobile = {
      hero: mHero,
      reel: mReel,
      featuredTop: mFeaturedTop,
      goal: mGoal,
      endSection: mEnd,
      footer: mFooter
    };

    await mobilePage.close();

    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'typography_audit_report.json'),
      JSON.stringify(report, null, 2),
      'utf8'
    );
    console.log('\nAudit complete! Report saved to audit_artifacts/typography_audit_report.json');

  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
