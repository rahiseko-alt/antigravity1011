import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:/Users/user/.gemini/antigravity/brain/5cfe2c5c-06c2-484e-8f43-a8ba7d348499';
const callerArtifactDir = 'C:/Users/user/.gemini/antigravity/brain/2e80ee98-e28f-4bf0-bf90-c8e381874417';

const variations = [
  {
    id: 'var1_pure_white',
    name: 'Variation 1: Pure White (#ffffff)',
    bg0: '#ffffff',
    bg1: '#ffffff',
    pageBg: '#ffffff',
    desc: 'High-contrast minimalist canvas. Pure stark white backdrop (#ffffff). Colorful 3D letters pop with maximum saturation, razor-sharp edge definition, and bright specular highlights.'
  },
  {
    id: 'var2_warm_studio',
    name: 'Variation 2: Warm Studio Off-White / Cream (#fcfaf6)',
    bg0: '#fcfaf6',
    bg1: '#f8f4ec',
    pageBg: '#fcfaf6',
    desc: 'Warm, organic, gallery-grade studio off-white (#fcfaf6). Softens harsh glare while keeping letters vibrant and inviting. Gives luxury editorial feel.'
  },
  {
    id: 'var3_cool_studio',
    name: 'Variation 3: Cool Studio Light Gray (#f3f4f6)',
    bg0: '#f3f4f6',
    bg1: '#e5e7eb',
    pageBg: '#f3f4f6',
    desc: 'Modern tech studio light gray (#f3f4f6 / #e5e7eb). Neutral high-tech background that grounds bright colors (magenta, cyan, amber) with excellent visual depth.'
  },
  {
    id: 'var4_pastel_vignette',
    name: 'Variation 4: Soft Pastel Vignette',
    bg0: '#ffffff',
    bg1: '#faecf4', // Soft dreamy pastel lilac / blush vignette
    pageBg: '#fbf5f9',
    desc: 'Subtle radial studio gradient: radiant pure white center (#ffffff) gently falling off to soft pastel blush/lilac edges (#faecf4). Enhances 3D depth and spherical volume.'
  }
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });

  for (const v of variations) {
    console.log(`\n=== Testing ${v.name} ===`);
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Apply colors inside 3D scene and page
    await page.evaluate((bg0, bg1, pageBg) => {
      // 1. Set 3D background uniforms
      if (window.homeBalloonsBackground) {
        window.homeBalloonsBackground.customColor0 = bg0;
        window.homeBalloonsBackground.customColor1 = bg1;
        if (window.homeBalloonsBackground.mesh && window.homeBalloonsBackground.mesh.material) {
          window.homeBalloonsBackground.mesh.material.uniforms.u_color0.value.set(bg0);
          window.homeBalloonsBackground.mesh.material.uniforms.u_color1.value.set(bg1);
        }
      }
      window.__customBg0 = bg0;
      window.__customBg1 = bg1;

      // 2. Adjust frame mesh background to match page
      if (window.__lusion && window.__lusion.properties) {
        window.__lusion.properties.bgColorHex = pageBg;
        window.__lusion.properties.bgColor.setStyle(pageBg);
        if (window.__lusion.properties.sharedUniforms && window.__lusion.properties.sharedUniforms.u_bgColor) {
          window.__lusion.properties.sharedUniforms.u_bgColor.value.setStyle(pageBg);
        }
      }

      // 3. Update CSS root variables and body styles
      document.documentElement.style.setProperty('--color-off-white', pageBg);
      document.body.style.backgroundColor = pageBg;
      document.documentElement.style.backgroundColor = pageBg;
    }, v.bg0, v.bg1, v.pageBg);

    // Let the physics settle
    await new Promise(r => setTimeout(r, 2000));

    // Take full screenshot
    const filename = `${v.id}.png`;
    await page.screenshot({ path: filename });
    console.log(`Saved screenshot to ${filename}`);

    // Also take framed version (where outer page remains standard #f0f1fa and container is variation)
    await page.evaluate((bg0, bg1) => {
      const defaultPage = '#f0f1fa';
      if (window.__lusion && window.__lusion.properties) {
        window.__lusion.properties.bgColorHex = defaultPage;
        window.__lusion.properties.bgColor.setStyle(defaultPage);
        if (window.__lusion.properties.sharedUniforms && window.__lusion.properties.sharedUniforms.u_bgColor) {
          window.__lusion.properties.sharedUniforms.u_bgColor.value.setStyle(defaultPage);
        }
      }
      document.documentElement.style.setProperty('--color-off-white', defaultPage);
      document.body.style.backgroundColor = defaultPage;
      document.documentElement.style.backgroundColor = defaultPage;
    }, v.bg0, v.bg1);

    await new Promise(r => setTimeout(r, 1000));
    const framedFilename = `${v.id}_framed.png`;
    await page.screenshot({ path: framedFilename });
    console.log(`Saved framed screenshot to ${framedFilename}`);

    // Copy to artifact directories
    for (const f of [filename, framedFilename]) {
      if (fs.existsSync(f)) {
        fs.copyFileSync(f, path.join(artifactDir, f));
        if (fs.existsSync(callerArtifactDir)) {
          fs.copyFileSync(f, path.join(callerArtifactDir, f));
        }
      }
    }
  }

  await browser.close();
  console.log('\nAll variations captured and saved!');
})();
