import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const hoistedPath = '_astro/hoisted.CUO_IjfL.js';
const bakPath = '_astro/hoisted.CUO_IjfL.js.bak';

// 1. Read letters data
const lettersData = JSON.parse(fs.readFileSync('assets/models/home/letters_data.json', 'utf8'));

// 2. Prepare code snippet for geometry creation
const chars = ['A', 'I', 'u', 'e', 'o'];
const geometryInitSnippet = `
  const _LETTERS_DATA = ${JSON.stringify(lettersData)};
  this.geometries = ['A', 'I', 'u', 'e', 'o'].map(char => {
    const data = _LETTERS_DATA[char];
    const bg = new BufferGeometry();
    bg.setAttribute('position', new BufferAttribute(new Float32Array(data.positions), 3));
    bg.setAttribute('normal', new BufferAttribute(new Float32Array(data.normals), 3));
    const cnt = data.count;
    bg.setAttribute('SN', bg.attributes.normal);
    bg.setAttribute('ao', new BufferAttribute(new Float32Array(cnt).fill(1.0), 1));
    bg.setAttribute('thickness', new BufferAttribute(new Float32Array(cnt).fill(0.5), 1));
    bg.setAttribute('daoN', new BufferAttribute(new Float32Array(cnt * 3).fill(0.7), 3));
    bg.setAttribute('daoP', new BufferAttribute(new Float32Array(cnt * 3).fill(0.7), 3));
    return bg;
  });
  console.log('[HomeBalloons] Generated 3D geometries for A, I, u, e, o!');
`;

// 3. Patch clean hoisted file
let code = fs.readFileSync(bakPath, 'utf8');

// Inject geometry setup into init()
const initTarget = 'init(){let e=math.getSeedRandomFn("balloon24");';
if (!code.includes(initTarget)) {
  throw new Error('initTarget not found');
}
code = code.replace(initTarget, `init(){\n${geometryInitSnippet}\nlet e=math.getSeedRandomFn("balloon24");`);

// Replace C=this.geometry with per-balloon geometry
const geomTarget = ',C=this.geometry,';
if (!code.includes(geomTarget)) {
  throw new Error('geomTarget not found');
}
code = code.replace(geomTarget, ',C=this.geometries[n % this.geometries.length],');

// Update color logic to make ALL balloons vibrant and colorful
const updateColorTarget = 'updateColor(){for(let e=0;e<this.NUM_BALLOONS;e++){const t=this.balloonList[e];if(t.isColored){const r=COLORS$1[properties.balloonsColorIndex];t.isSemitransparent?(_color.set(r),_color.offsetHSL(0,0,.3),t.color="#"+_color.getHexString()):t.color=r}else t.isBlackWhite&&(t.color=_blackWhiteToggle?"#888":"#eee")}}';
if (!code.includes(updateColorTarget)) {
  throw new Error('updateColorTarget not found');
}

const colorfulReplacement = `updateColor(){
  const RAINBOW = ["#ff0055", "#ff5500", "#ffaa00", "#00d084", "#00c0ff", "#7928ca", "#ff0080", "#0070f3", "#f5a623", "#50e3c2", "#bd10e0", "#ff3366", "#00e676", "#ff9100"];
  for(let e=0;e<this.NUM_BALLOONS;e++){
    const t=this.balloonList[e];
    const r=RAINBOW[(e * 2 + properties.balloonsColorIndex) % RAINBOW.length];
    t.isSemitransparent?(_color.set(r),_color.offsetHSL(0,0,.3),t.color="#"+_color.getHexString()):t.color=r;
  }
}`;

code = code.replace(updateColorTarget, colorfulReplacement);

fs.writeFileSync(hoistedPath, code, 'utf8');
console.log('Successfully patched _astro/hoisted.CUO_IjfL.js with 3D letters and colorful palette!');

// 4. Test in Puppeteer
(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.message}`));

  console.log('Navigating to http://localhost:3000/ ...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));

  const screenshotPath = 'test_alphabet_colorful.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved screenshot to ${screenshotPath}`);

  console.log('Page Logs:');
  console.log(logs.filter(l => !l.includes('Turnstile')).slice(-10).join('\n'));

  // Copy to artifacts directory
  fs.copyFileSync(screenshotPath, 'C:/Users/user/.gemini/antigravity/brain/2e80ee98-e28f-4bf0-bf90-c8e381874417/' + screenshotPath);
  console.log('Copied to artifacts directory.');

  await browser.close();
})();
