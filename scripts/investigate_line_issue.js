const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== INVESTIGATING MOBILE GREEN LOOP AND COLOR SHADER ATTRIBUTES ===');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // Wait for intro to settle
  console.log('Waiting for intro to settle...');
  await page.waitForFunction(() => {
    const gt = window.__goalTunnels;
    return gt && gt.introStartTime && (performance.now() - gt.introStartTime) / 1000 >= 9.0;
  }, { timeout: 45000 });
  await sleep(1000);

  // Helper to find lineMesh
  const setupHelper = await page.evaluate(() => {
    let lineMesh = null;
    if (window.homePage && window.homePage.preUfxContainer) {
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.isMesh && obj.material && obj.material.defines && obj.material.defines.IS_LINE) {
          lineMesh = obj;
        }
      });
    }
    window.__testLineMesh = lineMesh;
    return !!lineMesh;
  });
  console.log('LineMesh found:', setupHelper);

  const scrollTargets = [1200, 1800, 2200, 2600];
  const results = {};

  for (const targetY of scrollTargets) {
    console.log(`\nEvaluating at target scrollY = ${targetY}...`);

    const evalData = await page.evaluate(async (targetY) => {
      // Use scrollToPixel or scrollPixel
      window.scrollManager.scrollToPixel(targetY, true);
      // Wait multiple frames for physics / render / uniforms update
      await new Promise(r => {
        let f = 0;
        function step() {
          f++;
          if (f >= 30) r();
          else requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });

      const lineMesh = window.__testLineMesh;
      if (!lineMesh) {
        return { error: 'lineMesh not found' };
      }

      const geom = lineMesh.geometry;
      const posAttr = geom.attributes.position;
      const cpAttr = geom.attributes.CP;
      const cdAttr = geom.attributes.Cd;

      function getStats(attr) {
        if (!attr || !attr.array) return null;
        const arr = attr.array;
        let min = Infinity, max = -Infinity;
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] < min) min = arr[i];
          if (arr[i] > max) max = arr[i];
        }
        // Take samples: first 10, middle 10, last 10
        const sampleFirst = Array.from(arr.slice(0, 10));
        const midIdx = Math.floor(arr.length / 2);
        const sampleMid = Array.from(arr.slice(midIdx, midIdx + 10));
        const sampleLast = Array.from(arr.slice(Math.max(0, arr.length - 10)));
        return {
          count: attr.count,
          itemSize: attr.itemSize,
          length: arr.length,
          min,
          max,
          sampleFirst,
          sampleMid,
          sampleLast
        };
      }

      // Check Cd unique values or distribution
      let cdValues = null;
      if (cdAttr && cdAttr.array) {
        const uniqueCd = new Set();
        for (let i = 0; i < cdAttr.array.length; i++) {
          uniqueCd.add(Number(cdAttr.array[i].toFixed(4)));
        }
        cdValues = Array.from(uniqueCd).sort((a,b) => a - b);
      }

      // Parent chain visibility and positions
      const parentInfo = [];
      let curr = lineMesh;
      while (curr) {
        parentInfo.push({
          type: curr.type,
          visible: curr.visible,
          pos: { x: curr.position.x, y: curr.position.y, z: curr.position.z },
          scale: { x: curr.scale.x, y: curr.scale.y, z: curr.scale.z }
        });
        curr = curr.parent;
      }

      return {
        scrollY: window.scrollY,
        scrollPixel: window.scrollManager ? window.scrollManager.scrollPixel : null,
        u_showRatio: lineMesh.material.uniforms.u_showRatio ? lineMesh.material.uniforms.u_showRatio.value : null,
        u_aspect: lineMesh.material.uniforms.u_aspect ? {
          x: lineMesh.material.uniforms.u_aspect.value.x,
          y: lineMesh.material.uniforms.u_aspect.value.y
        } : null,
        u_radius: lineMesh.material.uniforms.u_radius ? lineMesh.material.uniforms.u_radius.value : null,
        parentPos: lineMesh.parent ? {
          x: lineMesh.parent.position.x,
          y: lineMesh.parent.position.y,
          z: lineMesh.parent.position.z
        } : null,
        lineMeshPos: {
          x: lineMesh.position.x,
          y: lineMesh.position.y,
          z: lineMesh.position.z
        },
        parentChain: parentInfo,
        hasPositionAttr: !!posAttr,
        positionStats: getStats(posAttr),
        hasCPAttr: !!cpAttr,
        cpStats: getStats(cpAttr),
        hasCdAttr: !!cdAttr,
        cdStats: getStats(cdAttr),
        cdUniqueValues: cdValues,
        materialUniformKeys: Object.keys(lineMesh.material.uniforms)
      };
    }, targetY);

    results[targetY] = evalData;

    // Take screenshot at this scroll position
    const screenshotPath = `investigate_mobile_${targetY}.png`;
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot ${screenshotPath}`);
  }

  fs.writeFileSync('investigate_results.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('Saved investigate_results.json');

  await browser.close();
})();
