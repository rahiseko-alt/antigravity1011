const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const fs = require('fs');

(async () => {
  console.log('=== SAMPLING LIVE INTRO WARP ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' && !text.includes('font-size:0;color:transparent') && !text.includes('ERR_CONNECTION_CLOSED')) {
      consoleErrors.push(text);
      console.error('[BROWSER ERROR]', text);
    }
  });

  await page.goto('http://localhost:3000');

  const samples = [];
  const start = Date.now();
  let hasSnappedP1 = false;
  let hasSnappedP2 = false;

  while (Date.now() - start < 7000) {
    const elapsed = (Date.now() - start) / 1000;
    const data = await page.evaluate(() => {
      const titleEl = document.getElementById('home-goal-tunnel-title');
      const introWrap = document.getElementById('intro-tunnel-title-wrapper');
      const p1 = document.getElementById('tunnel-title-phase1');
      const p2 = document.getElementById('tunnel-title-phase2');
      const p1Words = p1 ? Array.from(p1.querySelectorAll('span')).map(s => ({ text: s.textContent, transform: s.style.transform })) : [];
      const p2Words = p2 ? Array.from(p2.querySelectorAll('span')).map(s => ({ text: s.textContent, transform: s.style.transform })) : [];
      return {
        isIntroWarp: window.properties?.isIntroWarp,
        stage: window.visuals?.currentStage3D?.constructor?.name,
        container: {
          visibility: titleEl?.style.visibility,
          opacity: titleEl?.style.opacity,
          transform: titleEl?.style.transform
        },
        wrapper: {
          visibility: introWrap?.style.visibility,
          transform: introWrap?.style.transform
        },
        p1: {
          class: p1?.className,
          vis: p1?.style.visibility,
          op: p1?.style.opacity,
          words: p1Words
        },
        p2: {
          class: p2?.className,
          vis: p2?.style.visibility,
          op: p2?.style.opacity,
          words: p2Words
        }
      };
    });

    samples.push({ elapsed: elapsed.toFixed(2), ...data });

    // Snapshots during live playback
    if (!hasSnappedP1 && data.p1.vis === 'visible' && data.container.visibility === 'visible') {
      hasSnappedP1 = true;
      await page.screenshot({ path: 'live_phase1_active.png' });
      console.log(`[Captured Snapshot] live_phase1_active.png at elapsed=${elapsed.toFixed(2)}s`);
    }

    if (!hasSnappedP2 && data.p2.vis === 'visible' && data.container.visibility === 'visible') {
      hasSnappedP2 = true;
      await page.screenshot({ path: 'live_phase2_active.png' });
      console.log(`[Captured Snapshot] live_phase2_active.png at elapsed=${elapsed.toFixed(2)}s`);
    }

    await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n--- Timeline of Intro Warp Typography ---');
  samples.forEach(s => {
    if (s.container.visibility === 'visible' || (parseFloat(s.elapsed) >= 0.5 && parseFloat(s.elapsed) <= 6.0)) {
      console.log(`t=${s.elapsed}s | wrapVis=${s.wrapper.visibility} | titleVis=${s.container.visibility} | op=${s.container.opacity} | P1: ${s.p1.vis} (active=${s.p1.class?.includes('is-active')}) | P2: ${s.p2.vis} (active=${s.p2.class?.includes('is-active')})`);
      if (s.p1.words && s.p1.words[0]?.transform) {
        console.log(`   P1 words transform: ${s.p1.words.map(w => `${w.text}:${w.transform}`).join(', ')}`);
      }
      if (s.p2.words && s.p2.words[0]?.transform) {
        console.log(`   P2 words transform: ${s.p2.words.map(w => `${w.text}:${w.transform}`).join(', ')}`);
      }
    }
  });

  console.log('\n--- Console Errors Check ---');
  console.log('Filtered console errors count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Errors:', consoleErrors);
  } else {
    console.log('Zero console errors! All clean.');
  }

  await browser.close();
  console.log('=== DONE ===');
})();
