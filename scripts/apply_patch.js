const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

console.log('=== APPLYING PLAYER CARDS & VIVID COLOR PALETTE PATCH ===');

// 1. Update _astro/about.CNa9RfUh.css
const cssPath = path.resolve('_astro/about.CNa9RfUh.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace #home-members.section background: #040508 !important; -> transparent !important;
css = css.replace(/#home-members\.section\s*\{[^}]*background:\s*#040508\s*!important;/g, (match) => {
  return match.replace('#040508', 'transparent');
});

// Update .member-card
const cardRuleTarget = `.member-card {
  position: relative;
  background: rgba(255, 255, 255, 0.025);`;
const cardRuleReplace = `.member-card {
  position: relative !important;
  z-index: 2 !important;
  background: rgba(8, 12, 20, 0.95) !important;`;

if (css.includes(cardRuleTarget)) {
  css = css.replace(cardRuleTarget, cardRuleReplace);
  console.log('1. Updated .member-card in about.css');
} else {
  console.log('Target .member-card not found in about.css, appending explicit rules');
  css += `
#home-members.section, #home-members {
  background: transparent !important;
}
.member-card {
  background: rgba(8, 12, 20, 0.95) !important;
  position: relative !important;
  z-index: 2 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
}
`;
}
fs.writeFileSync(cssPath, css, 'utf8');
console.log('Successfully updated _astro/about.CNa9RfUh.css');

// Also update dist/_astro/about.CNa9RfUh.css if it exists
const distCssPath = path.resolve('dist/_astro/about.CNa9RfUh.css');
if (fs.existsSync(distCssPath)) {
  fs.writeFileSync(distCssPath, css, 'utf8');
  console.log('Successfully updated dist/_astro/about.CNa9RfUh.css');
}

// 2. Inject <style> into index.html and dist/index.html
const styleTag = `
<style id="player-tube-fix">
#home-members.section, #home-members {
  background: transparent !important;
}
.member-card {
  background: rgba(8, 12, 20, 0.95) !important;
  position: relative !important;
  z-index: 2 !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
}
</style>
`;

['index.html', 'dist/index.html'].forEach(htmlFile => {
  if (fs.existsSync(htmlFile)) {
    let html = fs.readFileSync(htmlFile, 'utf8');
    if (!html.includes('id="player-tube-fix"')) {
      html = html.replace('</head>', styleTag + '\n</head>');
      fs.writeFileSync(htmlFile, html, 'utf8');
      console.log(`2. Injected style tag into ${htmlFile}`);
    } else {
      console.log(`Style tag already present in ${htmlFile}`);
    }
  }
});

// 3. Update Shader color thresholds in _astro/hoisted.CUO_IjfL.js
const jsPath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(jsPath, 'utf8');

// The new palette matching instructions:
// 1. Blue:  vec3(0.0, 0.45, 1.0)  v_cd < 0.10
// 2. Yellow: vec3(1.0, 0.82, 0.0) v_cd < 0.28
// 3. Red:   vec3(1.0, 0.12, 0.18) v_cd < 0.48
// 4. Green: vec3(0.0, 0.88, 0.35) v_cd < 0.68
// 5. Purple: vec3(0.68, 0.10, 0.95) v_cd < 0.85
// 6. Orange: vec3(1.0, 0.45, 0.0) else

const newFrag = `if(v_cd<0.10){color=vec3(0.0,0.45,1.0);}else if(v_cd<0.28){color=vec3(1.0,0.82,0.0);}else if(v_cd<0.48){color=vec3(1.0,0.12,0.18);}else if(v_cd<0.68){color=vec3(0.0,0.88,0.35);}else if(v_cd<0.85){color=vec3(0.68,0.10,0.95);}else{color=vec3(1.0,0.45,0.0);}`;

const newEndFrag = `if(u_cd<0.10){color=vec3(0.0,0.45,1.0);}else if(u_cd<0.28){color=vec3(1.0,0.82,0.0);}else if(u_cd<0.48){color=vec3(1.0,0.12,0.18);}else if(u_cd<0.68){color=vec3(0.0,0.88,0.35);}else if(u_cd<0.85){color=vec3(0.68,0.10,0.95);}else{color=vec3(1.0,0.45,0.0);}`;

// Replace regex for v_cd
const vCdRegex = /if\(v_cd<[^}]+}[^}]+}[^}]+}[^}]+}[^}]+}/;
if (!vCdRegex.test(code)) {
  console.error('v_cd regex did not match in JS!');
  process.exit(1);
}
code = code.replace(vCdRegex, newFrag);
console.log('3. Replaced v_cd shader palette with 青・黄・赤・緑・紫・橙');

// Replace regex for u_cd
const uCdRegex = /if\(u_cd<[^}]+}[^}]+}[^}]+}[^}]+}[^}]+}/;
if (!uCdRegex.test(code)) {
  console.error('u_cd regex did not match in JS!');
  process.exit(1);
}
code = code.replace(uCdRegex, newEndFrag);
console.log('4. Replaced u_cd lineEndFrag palette with 青・黄・赤・緑・紫・橙');

// Validate with esbuild
try {
  esbuild.transformSync(code, { minify: false });
  console.log('5. Syntax validation PASSED!');
  fs.writeFileSync(jsPath, code, 'utf8');
  console.log('Successfully saved _astro/hoisted.CUO_IjfL.js');
} catch (err) {
  console.error('Syntax validation FAILED:', err);
  process.exit(1);
}

// Also save to dist/_astro/hoisted.CUO_IjfL.js if it exists
const distJsPath = path.resolve('dist/_astro/hoisted.CUO_IjfL.js');
if (fs.existsSync(distJsPath)) {
  fs.writeFileSync(distJsPath, code, 'utf8');
  console.log('Successfully saved dist/_astro/hoisted.CUO_IjfL.js');
}

console.log('=== ALL PATCHES APPLIED SUCCESSFULLY ===');
