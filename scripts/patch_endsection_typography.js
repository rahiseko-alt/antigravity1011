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

  // Replace PC font-size
  css = css.replace(/clamp\(2\.2rem,\s*6vw,\s*6\.5rem\)/g, 'clamp(2.0rem, 4.6vw, 4.8rem)');

  // Replace Mobile font-size
  css = css.replace(/clamp\(1\.8rem,\s*7\.5vw,\s*2\.8rem\)/g, 'clamp(1.2rem, 6.0vw, 2.0rem)');

  // Remove previous temporary rule if present
  css = css.replace(/\/\* EndSection Typography Fit & Overflow Fix \*\/[\s\S]*?\.end-section-title-link-word\s*\{[\s\S]*?\}/g, '');

  const perfectRule = `
/* EndSection Typography Fit & Overflow Fix */
.end-section-title-link-word {
  position: relative !important;
  overflow: hidden !important;
  height: 1em !important;
  white-space: nowrap !important;
}
.end-section-title-link-word .char-wrapper {
  position: relative !important;
  top: 0 !important;
  height: 1em !important;
  line-height: 1 !important;
}
.end-section-title-link-word .char-wrapper .char {
  height: 1em !important;
  line-height: 1 !important;
}
`;

  css += perfectRule;
  fs.writeFileSync(f, css, 'utf8');
  console.log('Successfully patched perfect typography in:', f);
}
