const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const files = [
  path.join(rootDir, '_astro/about.CNa9RfUh.css'),
  path.join(rootDir, 'dist/_astro/about.CNa9RfUh.css')
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let css = fs.readFileSync(f, 'utf8');

  // Fix any .end-section-title-link-word definitions to strictly include overflow: hidden !important
  const targetOld = `/* EndSection Typography Fit & Overflow Fix */
.end-section-title-link-word {
  white-space: nowrap !important;
  height: 1.08em !important;
}`;

  const fixedRule = `/* EndSection Typography Fit & Overflow Fix */
.end-section-title-link-word {
  position: relative !important;
  overflow: hidden !important;
  height: 1em !important;
  white-space: nowrap !important;
}`;

  if (css.includes(targetOld)) {
    css = css.replace(targetOld, fixedRule);
  } else if (!css.includes(fixedRule)) {
    css += fixedRule;
  }

  // Also check if the base rule was replaced or missing overflow: hidden
  if (css.includes('.end-section-title-link-word {\n  white-space: nowrap !important;\n  height: 1.08em !important;\n}')) {
    css = css.replace('.end-section-title-link-word {\n  white-space: nowrap !important;\n  height: 1.08em !important;\n}', fixedRule);
  }

  fs.writeFileSync(f, css, 'utf8');
  console.log('Fixed overflow:hidden in:', f);
}
