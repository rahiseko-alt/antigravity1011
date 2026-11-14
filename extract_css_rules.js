const fs = require('fs');
const css = fs.readFileSync('_astro/about.CNa9RfUh.css', 'utf8');

function findRules(pattern) {
  const re = new RegExp('[^}]*' + pattern + '[^}]*\\{[^}]*\\}', 'g');
  const matches = [...css.matchAll(re)];
  return matches.map(m => m[0]);
}

const targets = [
  '#home-hero-title',
  '#home-reel-title',
  '#home-reel-desc',
  '#home-featured-title',
  '#home-featured-disclaimer',
  '\\.project-item-line-1',
  '\\.project-item-line-2',
  '#home-goal-title',
  '\\.home-goal-texts-paragraph',
  '#home-goal-tunnel-title',
  '#end-section-title',
  '#end-section-title-link',
  '#end-section-subtitle',
  '\\.footer-newsletter-line',
  '#footer-contact-address',
  '\\.footer-socials-line',
  '#footer-bottom'
];

for (const t of targets) {
  console.log('-------------------------------------------');
  console.log('TARGET:', t);
  const rules = findRules(t);
  rules.forEach(r => console.log(r));
}
