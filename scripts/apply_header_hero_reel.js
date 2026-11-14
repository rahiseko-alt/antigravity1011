const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Title
const oldTitle = '<title>Lusion - Award Winning 3D and Interactive Web Studio</title>';
const newTitle = '<title>AI League AIueo - 草AI同盟 | 仲間を集める場</title>';
if (!html.includes(oldTitle)) throw new Error('Cannot find oldTitle');
html = html.replace(oldTitle, newTitle);

// 2. Meta description (and OG tags)
const oldMetaDesc = '<meta name="description" content="We design and produce 3D visual storytelling, immersive websites, and interactive digital experiences that help brands stand out online.">';
const newMetaDesc = '<meta name="description" content="AIを触る仲間を集める場。「今度何かやりましょう」を「こういうのやるので、一緒にどうですか？」に変えます。参加は登録不要。">';
if (!html.includes(oldMetaDesc)) throw new Error('Cannot find oldMetaDesc');
html = html.replace(oldMetaDesc, newMetaDesc);

// Also OG tags for consistency
const oldOgDesc = '<meta property="og:description" content="We design and produce 3D visual storytelling, immersive websites, and interactive digital experiences that help brands stand out online.">';
const newOgDesc = '<meta property="og:description" content="AIを触る仲間を集める場。「今度何かやりましょう」を「こういうのやるので、一緒にどうですか？」に変えます。参加は登録不要。">';
if (html.includes(oldOgDesc)) {
  html = html.replace(oldOgDesc, newOgDesc);
}

const oldOgTitle = '<meta property="og:title" content="Lusion - Award Winning 3D and Interactive Web Studio">';
const newOgTitle = '<meta property="og:title" content="AI League AIueo - 草AI同盟 | 仲間を集める場">';
if (html.includes(oldOgTitle)) {
  html = html.replace(oldOgTitle, newOgTitle);
}

const oldOgSiteName = '<meta property="og:site_name" content="Lusion - Award Winning 3D and Interactive Web Studio">';
const newOgSiteName = '<meta property="og:site_name" content="AI League AIueo">';
if (html.includes(oldOgSiteName)) {
  html = html.replace(oldOgSiteName, newOgSiteName);
}

// 3. Header logo text
const oldLogo = `<text x="0" y="19" font-family="'Aeonik', sans-serif" font-weight="500" font-size="21" letter-spacing="-0.02em" fill="currentColor" style="mix-blend-mode:exclusion">Kouhei Kosehira</text>`;
const newLogo = `<text x="0" y="19" font-family="'Aeonik', sans-serif" font-weight="500" font-size="21" letter-spacing="-0.02em" fill="currentColor" style="mix-blend-mode:exclusion">AI League AIueo</text>`;
if (!html.includes(oldLogo)) throw new Error('Cannot find oldLogo');
html = html.replace(oldLogo, newLogo);

// 4. Header buttons & links
// Header Right talk button
const oldRightTalk = `<button id="header-right-talk-btn"> <a href="mailto:hello@lusion.co"></a> <div id="header-right-talk-container"> <span id="header-right-talk-btn-arrow"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.343 8h11.314m0 0-4.984 4.984M13.657 8 8.673 3.016"></path></svg> </span> <span id="header-right-talk-btn-text">Let's talk</span> <span id="header-right-talk-btn-dots"> <span class="header-right-talk-btn-dot"></span> </span> </div> </button>`;
const newRightTalk = `<button id="header-right-talk-btn"> <a href="mailto:info@kouheikosehira.com"></a> <div id="header-right-talk-container"> <span id="header-right-talk-btn-arrow"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.343 8h11.314m0 0-4.984 4.984M13.657 8 8.673 3.016"></path></svg> </span> <span id="header-right-talk-btn-text">Join / Contact</span> <span id="header-right-talk-btn-dots"> <span class="header-right-talk-btn-dot"></span> </span> </div> </button>`;
if (!html.includes(oldRightTalk)) throw new Error('Cannot find oldRightTalk');
html = html.replace(oldRightTalk, newRightTalk);

// Header Menu talk button
const oldMenuTalk = `<button id="header-menu-talk"> <a href="mailto:hello@lusion.co"></a> <div id="header-menu-text">Let's talk</div>`;
const newMenuTalk = `<button id="header-menu-talk"> <a href="mailto:info@kouheikosehira.com"></a> <div id="header-menu-text">Join / Contact</div>`;
if (!html.includes(oldMenuTalk)) throw new Error('Cannot find oldMenuTalk');
html = html.replace(oldMenuTalk, newMenuTalk);

// Nav links: Home, About, Events, Contact
const oldNavAbout = `<span class="header-menu-link-text">About us</span> <span class="header-menu-link-text-clone">About us</span>`;
const newNavAbout = `<span class="header-menu-link-text">About</span> <span class="header-menu-link-text-clone">About</span>`;
if (!html.includes(oldNavAbout)) throw new Error('Cannot find oldNavAbout');
html = html.replace(oldNavAbout, newNavAbout);

const oldNavProjects = `<span class="header-menu-link-text">Projects</span> <span class="header-menu-link-text-clone">Projects</span>`;
const newNavProjects = `<span class="header-menu-link-text">Events</span> <span class="header-menu-link-text-clone">Events</span>`;
if (!html.includes(oldNavProjects)) throw new Error('Cannot find oldNavProjects');
html = html.replace(oldNavProjects, newNavProjects);

// 5. #home-hero section
const oldHeroTitle = '<h1 id="home-hero-title">Host events more casually, more freely! AI expands your world.</h1>';
const newHeroTitle = '<h1 id="home-hero-title">「今度何かやりましょう」を、<br>「こういうのやるので、一緒にどうですか？」に変える。</h1>';
if (!html.includes(oldHeroTitle)) throw new Error('Cannot find oldHeroTitle');
html = html.replace(oldHeroTitle, newHeroTitle);

// 6. #home-reel section
const oldReelLine1 = '<div id="home-reel-title-line-1">Bold Ideas,</div>';
const newReelLine1 = '<div id="home-reel-title-line-1">場をつくる。</div>';
if (!html.includes(oldReelLine1)) throw new Error('Cannot find oldReelLine1');
html = html.replace(oldReelLine1, newReelLine1);

const oldReelLine2 = '<div id="home-reel-title-line-2">Brought to Life</div>';
const newReelLine2 = '<div id="home-reel-title-line-2">やりたいことを、実行まで。</div>';
if (!html.includes(oldReelLine2)) throw new Error('Cannot find oldReelLine2');
html = html.replace(oldReelLine2, newReelLine2);

const oldReelDesc = '<h2 id="home-reel-desc">We combine design, motion, 3D, and development to create digital experiences that feel visually striking and technically seamless. From campaign launches to immersive brand worlds, we build work that captures attention and invites interaction.</h2>';
const newReelDesc = '<h2 id="home-reel-desc">名刺交換を重ねるよりも、まず実際の企画やイベントを1つやってみる。ジャンルは自由です。やりたいことを持ち込む人と、参加したい人が出会い、準備して、実行する。草野球のように集まり、AIを触り、1つのプロトタイプを作る草AI同盟。0はいくら集めても0。まずは1つの草活動から。</h2>';
if (!html.includes(oldReelDesc)) throw new Error('Cannot find oldReelDesc');
html = html.replace(oldReelDesc, newReelDesc);

const oldReelCta = '<span id="home-reel-cta-text">Our Approach</span>';
const newReelCta = '<span id="home-reel-cta-text">How It Works ↓</span>';
if (!html.includes(oldReelCta)) throw new Error('Cannot find oldReelCta');
html = html.replace(oldReelCta, newReelCta);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated index.html!');
