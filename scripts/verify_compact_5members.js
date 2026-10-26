import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

(async () => {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  // 1. Desktop Test (1920x1080)
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Verify warp opening at 1200ms
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: 'verify_compact_warp.png' });

  // Wait for hero to settle
  await new Promise(r => setTimeout(r, 4500));

  const pcTop = await page.evaluate(() => document.getElementById('home-members')?.offsetTop || 0);
  console.log("Desktop members offsetTop:", pcTop);

  // Scroll to members top (cards 1 & 2)
  await page.evaluate((y) => window.scrollManager.scrollToPixel(y + 80, false), pcTop);
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'verify_compact_pc_top.png' });
  console.log("Saved verify_compact_pc_top.png");

  // Scroll to members bottom (cards 3, 4, 5)
  await page.evaluate((y) => window.scrollManager.scrollToPixel(y + 550, false), pcTop);
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'verify_compact_pc_bottom.png' });
  console.log("Saved verify_compact_pc_bottom.png");

  // 2. Mobile Test (390x844)
  const mobPage = await browser.newPage();
  await mobPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5500));

  const mobTop = await mobPage.evaluate(() => document.getElementById('home-members')?.offsetTop || 0);
  console.log("Mobile members offsetTop:", mobTop);

  await mobPage.evaluate((y) => window.scrollManager.scrollToPixel(y + 60, false), mobTop);
  await new Promise(r => setTimeout(r, 1500));
  await mobPage.screenshot({ path: 'verify_compact_mob_card1.png' });
  console.log("Saved verify_compact_mob_card1.png");

  await mobPage.evaluate((y) => window.scrollManager.scrollToPixel(y + 450, false), mobTop);
  await new Promise(r => setTimeout(r, 1500));
  await mobPage.screenshot({ path: 'verify_compact_mob_card2.png' });
  console.log("Saved verify_compact_mob_card2.png");

  await mobPage.evaluate((y) => window.scrollManager.scrollToPixel(y + 1300, false), mobTop);
  await new Promise(r => setTimeout(r, 1500));
  await mobPage.screenshot({ path: 'verify_compact_mob_card5.png' });
  console.log("Saved verify_compact_mob_card5.png");

  await browser.close();
  console.log("Warp & Compact Members errors:", errors.filter(e => !e.includes('favicon')));
  console.log("All verifications finished!");
})();
