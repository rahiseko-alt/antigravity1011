import fs from 'node:fs';
import puppeteer from 'puppeteer-core';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const hoistedPath = '_astro/hoisted.CUO_IjfL.js';
const bakPath = '_astro/hoisted.CUO_IjfL.js.bak';

const variations = [
  {
    id: 'pure_white',
    name: 'Pure White (白)',
    c0: '#ffffff',
    c1: '#ffffff',
    description: '完全な純白背景。カラフルな3D文字の鮮やかさが100%引き立ち、最も明るくミニマルな印象。'
  },
  {
    id: 'warm_offwhite',
    name: 'Warm Off-White (温かみのあるオフホワイト / 生成り)',
    c0: '#ffffff',
    c1: '#f5f2eb',
    description: '高級デザイン誌や美術館のような、目に優しい温かい生成り色。眩しさを抑え上品で落ち着いたトーン。'
  },
  {
    id: 'cool_studio',
    name: 'Cool Studio Light Gray (クールスタジオライトグレー)',
    c0: '#ffffff',
    c1: '#e5e9f0',
    description: 'Appleの製品ギャラリーのような撮影スタジオ風。中央から外側へ微細な陰影が生まれ、3Dの立体感が最大化。'
  },
  {
    id: 'soft_pastel',
    name: 'Soft Lavender Cream (ソフトラベンダークリーム)',
    c0: '#ffffff',
    c1: '#f3e8ff',
    description: 'ほんのり淡いラベンダーグラデーション。ポップで遊び心のある3Dトイブロックの世界観にぴったり。'
  }
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Read current hoisted file (which already has the letters & rainbow patch!)
  const baseCode = fs.readFileSync(hoistedPath, 'utf8');

  // Find the background color update:
  // this.mesh.material.uniforms.u_color0.value.set(COLORS$1[properties.balloonsColorIndex])
  const bgTarget = 'this.mesh.material.uniforms.u_color0.value.set(COLORS$1[properties.balloonsColorIndex])';
  if (!baseCode.includes(bgTarget)) {
    console.error('bgTarget not found in hoisted js!');
    process.exit(1);
  }

  for (const v of variations) {
    console.log(`Testing background: ${v.name} (${v.c0} -> ${v.c1})...`);

    // In update(e), set both u_color0 and u_color1
    const bgReplacement = `this.mesh.material.uniforms.u_color0.value.set("${v.c0}"),this.mesh.material.uniforms.u_color1.value.set("${v.c1}")`;
    const patchedCode = baseCode.replace(bgTarget, bgReplacement);
    fs.writeFileSync(hoistedPath, patchedCode, 'utf8');

    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2200));

    const shotName = `bg_test_${v.id}.png`;
    await page.screenshot({ path: shotName });
    console.log(`Saved ${shotName}`);

    fs.copyFileSync(shotName, `C:/Users/user/.gemini/antigravity/brain/2e80ee98-e28f-4bf0-bf90-c8e381874417/${shotName}`);
  }

  // Restore baseCode with pure white as current state
  const whiteReplacement = `this.mesh.material.uniforms.u_color0.value.set("#ffffff"),this.mesh.material.uniforms.u_color1.value.set("#ffffff")`;
  fs.writeFileSync(hoistedPath, baseCode.replace(bgTarget, whiteReplacement), 'utf8');
  console.log('Restored to Pure White as current state.');

  await browser.close();
  console.log('All variations captured successfully!');
})();
