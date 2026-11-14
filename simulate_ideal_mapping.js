const fs = require('fs');
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__line0 && window.__line0.geometry, { timeout: 20000 });

  // Extract curve CP points and lineRatioArray
  const curveData = await page.evaluate(() => {
    const l0 = window.__line0;
    const cp = Array.from(l0.geometry.attributes.CP.array);
    const ratios = Array.from(l0.lineRatioArray);
    return { cp, ratios };
  });
  await browser.close();

  console.log(`Loaded curve data: ${curveData.ratios.length} points.`);

  // Function to evaluate tube tip at ratio a
  function getTipAtRatio(a) {
    const { cp, ratios } = curveData;
    const p = ratios.length;
    let v = 0, frac = 0;
    for (let R = 0; R < p; R++) {
      if (a >= ratios[R]) {
        v = R;
        frac = (R === p - 1) ? 0 : (a - ratios[R]) / (ratios[R + 1] - ratios[R]);
      }
    }
    const idx0 = v * 3;
    const idx1 = Math.min(p - 1, v + 1) * 3;
    const x = cp[idx0] + (cp[idx1] - cp[idx0]) * frac;
    const y = cp[idx0 + 1] + (cp[idx1 + 1] - cp[idx0 + 1]) * frac;
    const z = cp[idx0 + 2] + (cp[idx1 + 2] - cp[idx0 + 2]) * frac;
    return { x, y, z };
  }

  // Test current Desktop mapping vs proposed adjusted mapping
  function testDesktop(scaleYFactor, yShift) {
    const W = 1440, H = 900;
    const targetWidth = W * 0.85;
    // proposed scaleX
    const scaleX = targetWidth / 1.401;
    const marginX = (W - targetWidth) / 2;
    const posX = marginX - (-0.2003 * scaleX);

    // keyframes
    const dK = [
      [250,  0.00],
      [700,  0.16],
      [1150, 0.22],
      [2000, 0.36],
      [2800, 0.50],
      [3800, 0.65],
      [4600, 0.80],
      [5200, 0.92],
      [6000, 1.00]
    ];

    const scaleY = scaleYFactor / 4.57;

    let oobCount = 0;
    const rows = [];

    for (let s = 250; s <= 6000; s += 100) {
      // compute a
      let a = 0;
      for (let i = 0; i < dK.length - 1; i++) {
        if (s >= dK[i][0] && s < dK[i + 1][0]) {
          const tr = (s - dK[i][0]) / (dK[i + 1][0] - dK[i][0]);
          const st = tr * tr * (3.0 - 2.0 * tr);
          a = dK[i][1] + (dK[i + 1][1] - dK[i][1]) * st;
          break;
        }
      }
      if (s >= dK[dK.length - 1][0]) a = 1.0;

      const tip = getTipAtRatio(a);
      // innerPos.y
      // reelCenterOnScreen = -(900 - s + 606 * 0.42) = s - 1154.5
      const reelCenterOnScreen = s - 1154.5;
      const posY = reelCenterOnScreen - (yShift * scaleY);

      const screenX = posX + tip.x * scaleX;
      const screenY = -(posY + tip.y * scaleY);

      const isInside = (screenX >= 0 && screenX <= W && screenY >= 0 && screenY <= H);
      if (!isInside) oobCount++;
      rows.push({ s, a: a.toFixed(3), screenX: screenX.toFixed(1), screenY: screenY.toFixed(1), isInside });
    }

    return { scaleYFactor, yShift, oobCount, rows };
  }

  // Let's test different scaleYFactor values on Desktop: 4700 (current), 5200, 5600, 5800, 6000
  console.log('--- Desktop Optimization Search ---');
  for (let factor = 4700; factor <= 6200; factor += 200) {
    for (let yShift of [-1.03, -0.90, -0.78, -0.70]) {
      const res = testDesktop(factor, yShift);
      if (res.oobCount < 5) {
        console.log(`Factor: ${factor}, yShift: ${yShift} -> OOB count: ${res.oobCount}`);
      }
    }
  }

  // Let's inspect the best desktop result
  const bestD = testDesktop(5800, -0.78);
  console.log(`\nBest Desktop (factor=5800, yShift=-0.78): OOB = ${bestD.oobCount}`);
  bestD.rows.filter(r => r.s % 500 === 0 || r.s === 250 || r.s === 6000).forEach(r => {
    console.log(`s=${r.s}px | a=${r.a} | tip=(${r.screenX}, ${r.screenY}) | inside=${r.isInside}`);
  });

  // Now Mobile Optimization Search
  function testMobile(scaleYFactor, yShift) {
    const W = 390, H = 844;
    const targetWidth = W * 0.88;
    const scaleX = targetWidth / 1.401;
    const marginX = (W - targetWidth) / 2;
    const posX = marginX - (-0.2003 * scaleX);

    const mK = [
      [200,  0.00],
      [550,  0.16],
      [950,  0.22],
      [1800, 0.36],
      [2600, 0.50],
      [3600, 0.65],
      [4600, 0.80],
      [5400, 0.92],
      [6400, 1.00]
    ];

    const scaleY = scaleYFactor / 4.57;
    let oobCount = 0;
    const rows = [];

    for (let s = 200; s <= 6400; s += 100) {
      let a = 0;
      for (let i = 0; i < mK.length - 1; i++) {
        if (s >= mK[i][0] && s < mK[i + 1][0]) {
          const tr = (s - mK[i][0]) / (mK[i + 1][0] - mK[i][0]);
          const st = tr * tr * (3.0 - 2.0 * tr);
          a = mK[i][1] + (mK[i + 1][1] - mK[i][1]) * st;
          break;
        }
      }
      if (s >= mK[mK.length - 1][0]) a = 1.0;

      const tip = getTipAtRatio(a);
      // reelCenterOnScreen on mobile: -(844 - s + 633 * 0.35) = s - 1065.55
      const reelCenterOnScreen = s - 1065.55;
      const posY = reelCenterOnScreen - (yShift * scaleY);

      const screenX = posX + tip.x * scaleX;
      const screenY = -(posY + tip.y * scaleY);

      const isInside = (screenX >= 0 && screenX <= W && screenY >= 0 && screenY <= H);
      if (!isInside) oobCount++;
      rows.push({ s, a: a.toFixed(3), screenX: screenX.toFixed(1), screenY: screenY.toFixed(1), isInside });
    }

    return { scaleYFactor, yShift, oobCount, rows };
  }

  console.log('\n--- Mobile Optimization Search ---');
  for (let factor = 4800; factor <= 6200; factor += 200) {
    for (let yShift of [-1.03, -0.90, -0.78, -0.65]) {
      const res = testMobile(factor, yShift);
      if (res.oobCount < 5) {
        console.log(`Factor: ${factor}, yShift: ${yShift} -> OOB count: ${res.oobCount}`);
      }
    }
  }

  const bestM = testMobile(5400, -0.78);
  console.log(`\nBest Mobile (factor=5400, yShift=-0.78): OOB = ${bestM.oobCount}`);
  bestM.rows.filter(r => r.s % 500 === 0 || r.s === 200 || r.s === 6400).forEach(r => {
    console.log(`s=${r.s}px | a=${r.a} | tip=(${r.screenX}, ${r.screenY}) | inside=${r.isInside}`);
  });

})();
