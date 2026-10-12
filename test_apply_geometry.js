import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const hoistedPath = '_astro/hoisted.CUO_IjfL.js';
const bakPath = '_astro/hoisted.CUO_IjfL.js.bak';

// Restore clean backup first if it exists
if (fs.existsSync(bakPath)) {
  fs.copyFileSync(bakPath, hoistedPath);
  console.log('[Setup] Restored clean backup of hoisted file.');
} else {
  fs.copyFileSync(hoistedPath, bakPath);
  console.log('[Setup] Created backup of hoisted file.');
}

async function testShape(shapeName, geometrySnippet) {
  console.log(`\n========================================`);
  console.log(`Testing Shape: ${shapeName}`);
  console.log(`========================================`);

  // Read clean file
  let code = fs.readFileSync(bakPath, 'utf8');

  // Insert geometry snippet at the beginning of HomeBalloons.init()
  // Search for init(){let e=math.getSeedRandomFn("balloon24");
  const target = 'init(){let e=math.getSeedRandomFn("balloon24");';
  if (!code.includes(target)) {
    throw new Error(`Target not found in hoisted file!`);
  }

  const injection = `init(){
    ${geometrySnippet}
    console.log("[HomeBalloons] Substituted geometry with ${shapeName}!");
    let e=math.getSeedRandomFn("balloon24");`;

  code = code.replace(target, injection);
  fs.writeFileSync(hoistedPath, code, 'utf8');
  console.log(`[Patch] Injected ${shapeName} into ${hoistedPath}`);

  // Test with Puppeteer
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const pageErrors = [];
  const consoleLogs = [];

  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Turnstile')) {
      consoleLogs.push(`[${msg.type()}] ${text}`);
    }
  });

  console.log(`[Puppeteer] Navigating to http://localhost:3000 ...`);
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Wait 3 seconds for initial render & animation
  await new Promise(r => setTimeout(r, 2500));

  // Check animation: capture positions over time
  const animationCheck = await page.evaluate(async () => {
    // Check if balloons exist and are moving
    return new Promise(resolve => {
      let frames = 0;
      let lastTime = performance.now();
      function checkFrame() {
        frames++;
        if (frames < 30) {
          requestAnimationFrame(checkFrame);
        } else {
          resolve({
            fps: Math.round((frames / (performance.now() - lastTime)) * 1000),
            canvasRendered: !!document.getElementById('canvas'),
          });
        }
      }
      requestAnimationFrame(checkFrame);
    });
  });

  console.log(`[Animation Check]:`, animationCheck);

  const screenshotPath = `screenshot_test_${shapeName.toLowerCase()}.png`;
  await page.screenshot({ path: screenshotPath });
  console.log(`[Screenshot] Saved to ${screenshotPath}`);

  console.log(`[Page Errors (${pageErrors.length})]:`, pageErrors);
  console.log(`[Console Logs sample]:`, consoleLogs.filter(l => l.includes('HomeBalloons') || l.includes('Test')));

  await browser.close();

  return {
    shapeName,
    success: pageErrors.length === 0,
    errors: pageErrors,
    screenshotPath,
    animationCheck
  };
}

(async () => {
  try {
    // 1. Test SphereGeometry
    const sphereSnippet = `
      const cg = new SphereGeometry(0.85, 32, 32);
      const cnt = cg.attributes.position.count;
      cg.setAttribute("SN", cg.attributes.normal);
      cg.setAttribute("ao", new BufferAttribute(new Float32Array(cnt).fill(1.0), 1));
      cg.setAttribute("thickness", new BufferAttribute(new Float32Array(cnt).fill(0.5), 1));
      cg.setAttribute("daoN", new BufferAttribute(new Float32Array(cnt * 3).fill(0.7), 3));
      cg.setAttribute("daoP", new BufferAttribute(new Float32Array(cnt * 3).fill(0.7), 3));
      this.geometry = cg;
    `;
    const resSphere = await testShape('Sphere', sphereSnippet);

    // 2. Test BoxGeometry
    const boxSnippet = `
      const cg = new BoxGeometry(1.2, 1.2, 1.2, 4, 4, 4);
      const cnt = cg.attributes.position.count;
      cg.setAttribute("SN", cg.attributes.normal);
      cg.setAttribute("ao", new BufferAttribute(new Float32Array(cnt).fill(1.0), 1));
      cg.setAttribute("thickness", new BufferAttribute(new Float32Array(cnt).fill(0.5), 1));
      cg.setAttribute("daoN", new BufferAttribute(new Float32Array(cnt * 3).fill(0.7), 3));
      cg.setAttribute("daoP", new BufferAttribute(new Float32Array(cnt * 3).fill(0.7), 3));
      this.geometry = cg;
    `;
    const resBox = await testShape('Box', boxSnippet);

    // 3. Test Custom Torus shape constructed directly with BufferGeometry & math
    const torusSnippet = `
      const radius = 0.7, tube = 0.28, radialSegments = 24, tubularSegments = 48;
      const indices = [];
      const vertices = [];
      const normals = [];
      for (let j = 0; j <= radialSegments; j++) {
        for (let i = 0; i <= tubularSegments; i++) {
          const u = (i / tubularSegments) * Math.PI * 2;
          const v = (j / radialSegments) * Math.PI * 2;
          const x = (radius + tube * Math.cos(v)) * Math.cos(u);
          const y = (radius + tube * Math.cos(v)) * Math.sin(u);
          const z = tube * Math.sin(v);
          vertices.push(x, y, z);
          const nx = Math.cos(v) * Math.cos(u);
          const ny = Math.cos(v) * Math.sin(u);
          const nz = Math.sin(v);
          normals.push(nx, ny, nz);
        }
      }
      for (let j = 1; j <= radialSegments; j++) {
        for (let i = 1; i <= tubularSegments; i++) {
          const a = (tubularSegments + 1) * j + i - 1;
          const b = (tubularSegments + 1) * (j - 1) + i - 1;
          const c = (tubularSegments + 1) * (j - 1) + i;
          const d = (tubularSegments + 1) * j + i;
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }
      const cg = new BufferGeometry();
      cg.setIndex(indices);
      cg.setAttribute("position", new BufferAttribute(new Float32Array(vertices), 3));
      cg.setAttribute("normal", new BufferAttribute(new Float32Array(normals), 3));
      const cnt = vertices.length / 3;
      cg.setAttribute("SN", cg.attributes.normal);
      cg.setAttribute("ao", new BufferAttribute(new Float32Array(cnt).fill(1.0), 1));
      cg.setAttribute("thickness", new BufferAttribute(new Float32Array(cnt).fill(0.5), 1));
      cg.setAttribute("daoN", new BufferAttribute(new Float32Array(cnt * 3).fill(0.7), 3));
      cg.setAttribute("daoP", new BufferAttribute(new Float32Array(cnt * 3).fill(0.7), 3));
      this.geometry = cg;
    `;
    const resTorus = await testShape('Torus', torusSnippet);

    console.log(`\n========================================`);
    console.log(`SUMMARY RESULTS:`);
    console.log(JSON.stringify({ resSphere, resBox, resTorus }, null, 2));
    console.log(`========================================`);

  } catch (err) {
    console.error('Fatal error during test:', err);
  } finally {
    // Keep Torus or Sphere, or let the user decide. Let us keep Sphere or clean up.
  }
})();
