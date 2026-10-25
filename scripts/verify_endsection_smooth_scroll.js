const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const targetDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

async function verify() {
  console.log('--- Starting Puppeteer QA Verification for EndSection Smooth Scroll ---');
  
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  // 1. PC Verification (1920x1080)
  console.log('\n[PC 1920x1080 Testing]');
  const pcPage = await browser.newPage();
  await pcPage.setViewport({ width: 1920, height: 1080 });
  await pcPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  // Measure endSection dimensions
  const pcMetrics = await pcPage.evaluate(() => {
    const end = document.getElementById('end-section');
    const titleLink = document.getElementById('end-section-title-link');
    const footer = document.getElementById('footer-section');
    return {
      endHeight: end ? end.offsetHeight : 0,
      endTop: end ? end.offsetTop : 0,
      footerTop: footer ? footer.offsetTop : 0,
      titleLinkText: titleLink ? titleLink.innerText.replace(/\s+/g, ' ').trim() : '',
      viewportHeight: window.innerHeight
    };
  });
  console.log('PC Metrics:', pcMetrics);

  // Scroll to EndSection (around endTop)
  console.log('Scrolling to EndSection on PC...');
  await pcPage.evaluate((targetY) => {
    window.scrollManager.scrollToPixel(targetY, false);
  }, pcMetrics.endTop + 400);
  await new Promise(r => setTimeout(r, 2000));

  // Check state inside EndSection
  const pcEndState = await pcPage.evaluate(() => {
    const titleLink = document.getElementById('end-section-title-link');
    const subtitle = document.getElementById('end-section-subtitle-text');
    const endOuter = document.getElementById('end-section-outer');
    const computed = window.getComputedStyle(titleLink);
    return {
      titleText: titleLink ? titleLink.innerText.replace(/\s+/g, ' ').trim() : '',
      subtitleText: subtitle ? subtitle.innerText.replace(/\s+/g, ' ').trim() : '',
      pointerEvents: computed ? computed.pointerEvents : '',
      outerTransform: endOuter ? endOuter.style.transform : '',
      activeRatio: window.endSection ? window.endSection.activeRatio : null
    };
  });
  console.log('PC EndSection State:', pcEndState);

  const pcShotEnd = path.join(targetDir, 'verify_smooth_pc_end.png');
  await pcPage.screenshot({ path: pcShotEnd });
  console.log('Saved:', pcShotEnd);

  // Scroll to Footer
  console.log('Scrolling to Footer on PC...');
  await pcPage.evaluate((targetY) => {
    window.scrollManager.scrollToPixel(targetY, false);
  }, pcMetrics.footerTop + 200);
  await new Promise(r => setTimeout(r, 2000));

  const pcShotFooter = path.join(targetDir, 'verify_smooth_pc_footer.png');
  await pcPage.screenshot({ path: pcShotFooter });
  console.log('Saved:', pcShotFooter);
  await pcPage.close();

  // 2. Mobile Verification (390x844)
  console.log('\n[Mobile 390x844 Testing]');
  const mobPage = await browser.newPage();
  await mobPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));

  const mobMetrics = await mobPage.evaluate(() => {
    const end = document.getElementById('end-section');
    const footer = document.getElementById('footer-section');
    return {
      endHeight: end ? end.offsetHeight : 0,
      endTop: end ? end.offsetTop : 0,
      footerTop: footer ? footer.offsetTop : 0
    };
  });
  console.log('Mobile Metrics:', mobMetrics);

  // Scroll to EndSection on mobile
  console.log('Scrolling to EndSection on Mobile...');
  await mobPage.evaluate((targetY) => {
    window.scrollManager.scrollToPixel(targetY, false);
  }, mobMetrics.endTop + 200);
  await new Promise(r => setTimeout(r, 2000));

  const mobEndState = await mobPage.evaluate(() => {
    const titleLink = document.getElementById('end-section-title-link');
    const subtitle = document.getElementById('end-section-subtitle-text');
    const computed = window.getComputedStyle(titleLink);
    return {
      titleText: titleLink ? titleLink.innerText.replace(/\s+/g, ' ').trim() : '',
      subtitleText: subtitle ? subtitle.innerText.replace(/\s+/g, ' ').trim() : '',
      pointerEvents: computed ? computed.pointerEvents : ''
    };
  });
  console.log('Mobile EndSection State:', mobEndState);

  const mobShotEnd = path.join(targetDir, 'verify_smooth_mobile_end.png');
  await mobPage.screenshot({ path: mobShotEnd });
  console.log('Saved:', mobShotEnd);

  // Scroll to Footer on mobile
  console.log('Scrolling to Footer on Mobile...');
  await mobPage.evaluate((targetY) => {
    window.scrollManager.scrollToPixel(targetY, false);
  }, mobMetrics.footerTop + 100);
  await new Promise(r => setTimeout(r, 2000));

  const mobShotFooter = path.join(targetDir, 'verify_smooth_mobile_footer.png');
  await mobPage.screenshot({ path: mobShotFooter });
  console.log('Saved:', mobShotFooter);
  await mobPage.close();

  await browser.close();
  console.log('\n=== QA Verification Completed Successfully! ===');
}

verify().catch(err => {
  console.error('QA Verification Error:', err);
  process.exit(1);
});
