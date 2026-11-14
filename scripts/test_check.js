const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const checks = [
  '<title>Lusion - Award Winning 3D and Interactive Web Studio</title>',
  '<meta name="description" content="We design and produce 3D visual storytelling, immersive websites, and interactive digital experiences that help brands stand out online.">',
  `<text x="0" y="19" font-family="'Aeonik', sans-serif" font-weight="500" font-size="21" letter-spacing="-0.02em" fill="currentColor" style="mix-blend-mode:exclusion">Kouhei Kosehira</text>`,
  `<button id="header-right-talk-btn"> <a href="mailto:hello@lusion.co"></a> <div id="header-right-talk-container"> <span id="header-right-talk-btn-arrow"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.343 8h11.314m0 0-4.984 4.984M13.657 8 8.673 3.016"></path></svg> </span> <span id="header-right-talk-btn-text">Let's talk</span> <span id="header-right-talk-btn-dots"> <span class="header-right-talk-btn-dot"></span> </span> </div> </button>`,
  `<button id="header-menu-talk"> <a href="mailto:hello@lusion.co"></a> <div id="header-menu-text">Let's talk</div>`,
  '<span class="header-menu-link-text">About us</span>',
  '<span class="header-menu-link-text-clone">About us</span>',
  '<span class="header-menu-link-text">Projects</span>',
  '<span class="header-menu-link-text-clone">Projects</span>',
  '<h1 id="home-hero-title">Host events more casually, more freely! AI expands your world.</h1>',
  '<div id="home-reel-title-line-1">Bold Ideas,</div>',
  '<div id="home-reel-title-line-2">Brought to Life</div>',
  '<h2 id="home-reel-desc">We combine design, motion, 3D, and development to create digital experiences that feel visually striking and technically seamless. From campaign launches to immersive brand worlds, we build work that captures attention and invites interaction.</h2>',
  '<span id="home-reel-cta-text">Our Approach</span>'
];

checks.forEach((c, i) => {
  const count = html.split(c).length - 1;
  console.log(i, count === 1 ? 'OK (unique)' : 'COUNT: ' + count, c.substring(0, 50));
});
