const puppeteer = require('puppeteer-core');
const fs = require('fs');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function runAnalysisForViewport(viewport, isMobName) {
  console.log(`\n======================================================`);
  console.log(`Analyzing Coordinate Mapping: ${isMobName} (${viewport.width}x${viewport.height})`);
  console.log(`======================================================`);

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--use-angle=default',
      '--enable-webgl',
      '--no-sandbox',
      `--window-size=${viewport.width},${viewport.height}`
    ]
  });

  const page = await browser.newPage();
  await page.setViewport(viewport);

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.scrollManager && window.scrollManager.isActive, { timeout: 25000 });
  await sleep(1000);

  // Static layout of sections (offsetTop, offsetHeight, offsetWidth)
  const staticLayout = await page.evaluate(() => {
    function getBox(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        offsetTop: el.offsetTop,
        offsetHeight: el.offsetHeight,
        offsetWidth: el.offsetWidth,
        initialRect: { x: r.x, y: r.y, width: r.width, height: r.height, top: r.top, bottom: r.bottom }
      };
    }

    const reel = document.querySelector('#home-reel');
    const reelHeadline = document.querySelector('#home-reel-title-line-1');
    const reelBtn = document.querySelector('#home-reel-cta') || document.querySelector('#home-reel-video-watch-btn');

    const feat = document.querySelector('#home-featured');
    const cards = Array.from(feat ? feat.querySelectorAll('.project-item') : []).map((c, i) => {
      const line1 = c.querySelector('.project-item-line-1')?.textContent.trim();
      const line2 = c.querySelector('.project-item-line-2')?.textContent.trim();
      return {
        index: i,
        title: line2 || line1 || `Card ${i + 1}`,
        box: getBox(c)
      };
    });

    const members = document.querySelector('#home-members');
    const memberEls = members ? Array.from(members.querySelectorAll('.member-card')) : [];
    const membersData = memberEls.map(m => ({
      id: m.getAttribute('data-id') || m.id,
      name: m.querySelector('.member-card-name')?.textContent.trim(),
      role: m.querySelector('.member-card-role-title')?.textContent.trim(),
      box: getBox(m)
    }));

    const goal = document.querySelector('#home-goal');
    const goalTitle = document.querySelector('#home-goal-title');

    return {
      reel: getBox(reel),
      reelHeadline: getBox(reelHeadline),
      reelBtn: getBox(reelBtn),
      featured: getBox(feat),
      cards,
      members: getBox(members),
      membersData,
      goal: getBox(goal),
      goalTitle: getBox(goalTitle)
    };
  });

  // Steps: every 100px from 0 to 6500, plus specific keyframe stops
  const scrollSteps = [];
  for (let s = 0; s <= 6500; s += 100) {
    scrollSteps.push(s);
  }
  const extraPoints = [200, 250, 550, 700, 950, 1150, 1800, 2000, 2600, 2800, 3600, 3800, 4600, 5200, 5400, 6000, 6400];
  for (const ep of extraPoints) {
    if (!scrollSteps.includes(ep)) scrollSteps.push(ep);
  }
  scrollSteps.sort((a, b) => a - b);

  console.log(`Sampling ${scrollSteps.length} frame-synced scroll positions from 0 to 6500...`);

  const samples = [];

  for (const s of scrollSteps) {
    const data = await page.evaluate(async (scrollPx) => {
      window.scrollManager.scrollToPixel(scrollPx, true);
      // Ensure render loop runs Line.update() for this scroll position
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const l0 = window.__line0;
      const preUfx = window.properties.postprocessing.queue.find(q => q.constructor.name === 'PreUfx');
      const cam = preUfx.camera;

      const W = window.innerWidth;
      const H = window.innerHeight;

      // Update matrices
      l0.circle.updateWorldMatrix(true, false);
      cam.updateMatrixWorld(true);

      const worldPos = l0.circle.position.clone();
      l0.circle.getWorldPosition(worldPos);

      const ndc = worldPos.clone().project(cam);
      const screenX = (ndc.x + 1) * 0.5 * W;
      const screenY = (1 - ndc.y) * 0.5 * H;

      const circlePos = l0.circle.position;
      const innerPos = l0.innerContainer.position;
      const innerScale = l0.innerContainer.scale;

      const showRatio = l0.mesh.material.uniforms.u_showRatio.value;
      const containerVisible = l0.container.visible;
      const meshVisible = l0.mesh.visible;
      const circleVisible = l0.circle.visible;

      // Query dynamic DOM rects at this scroll
      function getRect(el) {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          left: Math.round(r.left),
          right: Math.round(r.right),
          height: Math.round(r.height),
          width: Math.round(r.width),
          inViewport: (r.bottom >= 0 && r.top <= H)
        };
      }

      const reel = getRect(document.querySelector('#home-reel'));
      const reelHeadline = getRect(document.querySelector('#home-reel-title-line-1'));
      const reelBtn = getRect(document.querySelector('#home-reel-cta') || document.querySelector('#home-reel-video-watch-btn'));
      const featured = getRect(document.querySelector('#home-featured'));
      
      const featEl = document.querySelector('#home-featured');
      const cardRects = Array.from(featEl ? featEl.querySelectorAll('.project-item') : []).map((c, i) => ({
        index: i,
        rect: getRect(c)
      }));

      const members = getRect(document.querySelector('#home-members'));
      const membersEl = document.querySelector('#home-members');
      const memberRects = Array.from(membersEl ? membersEl.querySelectorAll('.member-card') : []).map(m => ({
        id: m.getAttribute('data-id') || m.id,
        name: m.querySelector('.member-card-name')?.textContent.trim(),
        rect: getRect(m)
      }));

      const goal = getRect(document.querySelector('#home-goal'));
      const goalTitle = getRect(document.querySelector('#home-goal-title'));

      const isInsideViewport = (screenX >= 0 && screenX <= W && screenY >= 0 && screenY <= H);
      const isTipTrulyVisible = containerVisible && circleVisible && isInsideViewport;

      return {
        s: scrollPx,
        showRatio,
        circlePos: { x: circlePos.x, y: circlePos.y, z: circlePos.z },
        innerPos: { x: innerPos.x, y: innerPos.y },
        innerScale: { x: innerScale.x, y: innerScale.y },
        worldPos: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
        screenX: Math.round(screenX * 10) / 10,
        screenY: Math.round(screenY * 10) / 10,
        containerVisible,
        circleVisible,
        meshVisible,
        isInsideViewport,
        isTipTrulyVisible,
        viewport: { width: W, height: H },
        dom: {
          reel,
          reelHeadline,
          reelBtn,
          featured,
          cards: cardRects,
          members,
          memberCards: memberRects,
          goal,
          goalTitle
        }
      };
    }, s);

    samples.push(data);
  }

  await browser.close();

  return {
    viewport,
    isMobName,
    staticLayout,
    samples
  };
}

(async () => {
  try {
    const desktopResults = await runAnalysisForViewport({ width: 1440, height: 900 }, 'Desktop');
    const mobileResults = await runAnalysisForViewport({ width: 390, height: 844 }, 'Mobile');

    const fullReport = {
      timestamp: new Date().toISOString(),
      desktop: desktopResults,
      mobile: mobileResults
    };

    fs.writeFileSync('coordinate_mapping_analysis.json', JSON.stringify(fullReport, null, 2));
    console.log('\nSaved full analysis to coordinate_mapping_analysis.json');

    analyzeResults(fullReport);
  } catch (err) {
    console.error('Error during analysis:', err);
    process.exit(1);
  }
})();

function analyzeResults(report) {
  console.log('\n======================================================');
  console.log('SUMMARY OF ACCURATE COORDINATE MAPPING & VISIBILITY AUDIT');
  console.log('======================================================');

  for (const mode of ['desktop', 'mobile']) {
    const data = report[mode];
    const vp = data.viewport;
    console.log(`\n------------------------------------------------------`);
    console.log(`MODE: ${data.isMobName} (${vp.width}x${vp.height})`);
    console.log(`------------------------------------------------------`);

    const samples = data.samples;
    const outOfBounds = [];
    const hiddenTube = [];
    const activeTipSamples = [];

    for (const sm of samples) {
      if (sm.containerVisible && sm.circleVisible) {
        activeTipSamples.push(sm);
        if (!sm.isInsideViewport) {
          outOfBounds.push({
            s: sm.s,
            ratio: sm.showRatio.toFixed(3),
            screenX: sm.screenX,
            screenY: sm.screenY,
            dx: sm.screenX < 0 ? sm.screenX : (sm.screenX > vp.width ? sm.screenX - vp.width : 0),
            dy: sm.screenY < 0 ? sm.screenY : (sm.screenY > vp.height ? sm.screenY - vp.height : 0)
          });
        }
      } else {
        hiddenTube.push(sm.s);
      }
    }

    console.log(`Total Samples: ${samples.length}`);
    console.log(`Active Tip Samples (container & circle visible): ${activeTipSamples.length}`);
    console.log(`Inactive/Hidden Samples: ${hiddenTube.length}`);

    if (outOfBounds.length === 0) {
      console.log(`\n>>> [PERFECT] Tube tip STAYS 100% INSIDE VIEWPORT for all active scroll positions!`);
    } else {
      console.log(`\n>>> [ATTENTION] Tube tip LEAVES VIEWPORT at ${outOfBounds.length} sample points!`);
      for (const oob of outOfBounds) {
        console.log(`   scroll=${oob.s}px (ratio=${oob.ratio}): tip=(${oob.screenX}, ${oob.screenY}) -> Out by dx=${oob.dx.toFixed(1)}, dy=${oob.dy.toFixed(1)}`);
      }
    }

    // Min and Max bounds of tube tip
    let minX = 99999, maxX = -99999, minY = 99999, maxY = -99999;
    for (const sm of activeTipSamples) {
      if (sm.screenX < minX) minX = sm.screenX;
      if (sm.screenX > maxX) maxX = sm.screenX;
      if (sm.screenY < minY) minY = sm.screenY;
      if (sm.screenY > maxY) maxY = sm.screenY;
    }

    console.log(`\nTip Screen-Space Envelope:`);
    console.log(`   X range: [${minX.toFixed(1)}, ${maxX.toFixed(1)}] (Viewport width: ${vp.width})`);
    console.log(`   Y range: [${minY.toFixed(1)}, ${maxY.toFixed(1)}] (Viewport height: ${vp.height})`);

    // Key milestone correlations
    console.log(`\nKey Milestone Correlation along the Journey:`);
    const milestones = [
      { name: 'Reel Start', s: mode === 'desktop' ? 250 : 200 },
      { name: 'Reel Headline / Button', s: mode === 'desktop' ? 700 : 550 },
      { name: 'Reel -> Initiatives Transition', s: mode === 'desktop' ? 1150 : 950 },
      { name: 'Initiatives Card 1 (Flagship)', s: mode === 'desktop' ? 2000 : 1800 },
      { name: 'Initiatives Card 3 (SNS) / Mid', s: mode === 'desktop' ? 2800 : 2600 },
      { name: 'Initiatives Card 6 (Docs) / End', s: mode === 'desktop' ? 3800 : 3600 },
      { name: 'Members Section Entry', s: mode === 'desktop' ? 4600 : 4600 },
      { name: 'Members Core Players', s: mode === 'desktop' ? 5200 : 5400 },
      { name: 'Goal Section Arrival', s: mode === 'desktop' ? 6000 : 6400 }
    ];

    for (const ms of milestones) {
      const sm = samples.find(x => x.s === ms.s) || samples.reduce((prev, curr) => Math.abs(curr.s - ms.s) < Math.abs(prev.s - ms.s) ? curr : prev);
      if (sm) {
        console.log(`   [${ms.name.padEnd(32)}] s=${String(sm.s).padStart(4)}px | ratio=${sm.showRatio.toFixed(3)} | tip=(${String(sm.screenX).padStart(6)}, ${String(sm.screenY).padStart(6)}) | visible=${sm.isTipTrulyVisible}`);
      }
    }
  }
}
