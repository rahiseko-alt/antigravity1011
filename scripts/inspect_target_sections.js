const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

console.log('--- FEATURED SECTION HEADER ---');
const featStart = html.indexOf('<div id="home-featured"');
const projListStart = html.indexOf('<div class="project-list">');
console.log(html.substring(featStart, projListStart));

console.log('--- FEATURED CTA ---');
const ctaStart = html.indexOf('<a id="home-featured-cta"');
const goalStart = html.indexOf('<div id="home-goal"');
console.log(html.substring(ctaStart, goalStart));

console.log('--- GOAL SECTION ---');
const endSecStart = html.indexOf('<div id="end-section"');
console.log(html.substring(goalStart, endSecStart));

console.log('--- END SECTION ---');
const footerStart = html.indexOf('<div id="footer-section"');
console.log(html.substring(endSecStart, footerStart));

console.log('--- FOOTER SECTION ---');
const scrollNavStart = html.indexOf('<div id="scroll-nav-section"');
console.log(html.substring(footerStart, scrollNavStart));
