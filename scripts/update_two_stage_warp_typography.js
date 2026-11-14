const fs = require('fs');
const path = require('path');

const targetHtml = `<div id="home-goal-tunnel-title">
  <div id="tunnel-title-phase1" class="tunnel-title-phase is-active">
    <div class="home-goal-tunnel-title-line">PLAY WITH AI</div>
  </div>
  <div id="tunnel-title-phase2" class="tunnel-title-phase">
    <div class="home-goal-tunnel-title-line">THIS WAY TOGETHER</div>
  </div>
</div>`;

// 1. Update index.html
function updateIndexHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Match <div id="home-goal-tunnel-title"> ... </div>
  const regex = /<div id=["']home-goal-tunnel-title["']>[\s\S]*?<\/div>\s*<\/div>/;
  // Let's verify what the exact closing sequence is
  const idx = content.indexOf('id="home-goal-tunnel-title"');
  if (idx === -1) {
    console.error(`id="home-goal-tunnel-title" not found in ${filePath}`);
    return false;
  }
  const tagStart = content.lastIndexOf('<div', idx);
  // Find where home-goal-tunnel-title ends
  // It contains home-goal-tunnel-title-line divs
  const nextSectionIdx = content.indexOf('id="home-goal-image-in-outer"', idx);
  if (nextSectionIdx === -1) {
    console.error(`id="home-goal-image-in-outer" not found after tunnel title in ${filePath}`);
    return false;
  }
  const tagEnd = content.lastIndexOf('</div>', nextSectionIdx) + 6;
  const oldSnippet = content.substring(tagStart, tagEnd);
  console.log(`[${filePath}] Old snippet:`, oldSnippet);

  content = content.substring(0, tagStart) + targetHtml + content.substring(tagEnd);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[${filePath}] Successfully updated tunnel title!`);
  return true;
}

// 2. Update CSS
const cssToAdd = `
.tunnel-title-phase {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 0;
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
}
.tunnel-title-phase.is-active {
  visibility: visible;
  opacity: 1;
}
#tunnel-title-phase2 {
  color: #ffffff;
  text-shadow: 0 0 20px rgba(0, 240, 255, 0.9), 0 0 45px rgba(0, 180, 255, 0.6), 0 0 75px rgba(255, 255, 255, 0.4);
}
`;

function updateCss(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('.tunnel-title-phase')) {
    console.log(`[${filePath}] CSS already contains .tunnel-title-phase`);
    return true;
  }
  const needle = '.home-goal-tunnel-title-line span{display:inline-block;position:relative;margin:0 .25ch}';
  if (!content.includes(needle)) {
    console.log(`[${filePath}] Needle not found, appending to end of CSS`);
    content += '\n' + cssToAdd;
  } else {
    content = content.replace(needle, needle + cssToAdd);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[${filePath}] Successfully updated CSS!`);
  return true;
}

console.log('--- Updating index.html & dist/index.html ---');
updateIndexHtml('index.html');
updateIndexHtml('dist/index.html');

console.log('--- Updating CSS ---');
updateCss('_astro/about.CNa9RfUh.css');
updateCss('dist/_astro/about.CNa9RfUh.css');
