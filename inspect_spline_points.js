const puppeteer = require('puppeteer-core');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox', '--window-size=390,844']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 6500));

  const splineData = await page.evaluate(() => {
    let lineObj = null;
    window.homePage.preUfxContainer.traverse(obj => {
      if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms.u_radius && !lineObj) {
        lineObj = obj;
      }
    });

    if (!lineObj) return { error: 'not found' };
    const geom = lineObj.geometry;
    const cp = geom.attributes.CP.array;
    const cd = geom.attributes.Cd ? geom.attributes.Cd.array : [];
    const count = geom.attributes.CP.count;

    const samples = [];
    for (let i = 0; i < count; i += Math.floor(count / 25)) {
      samples.push({
        idx: i,
        ratio: i / (count - 1),
        x: cp[i * 3 + 0],
        y: cp[i * 3 + 1],
        z: cp[i * 3 + 2],
        cd: cd[i]
      });
    }

    return {
      totalPoints: count,
      minY: Math.min(...Array.from({length: count}, (_, i) => cp[i * 3 + 1])),
      maxY: Math.max(...Array.from({length: count}, (_, i) => cp[i * 3 + 1])),
      minX: Math.min(...Array.from({length: count}, (_, i) => cp[i * 3 + 0])),
      maxX: Math.max(...Array.from({length: count}, (_, i) => cp[i * 3 + 0])),
      samples
    };
  });

  console.log('Spline Data:', JSON.stringify(splineData, null, 2));
  await browser.close();
})();
