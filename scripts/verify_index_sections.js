const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

console.log('--- 1. TITLE ---');
console.log(html.match(/<title>.*?<\/title>/)?.[0]);

console.log('--- 2. META DESCRIPTION ---');
console.log(html.match(/<meta name="description".*?>/)?.[0]);

console.log('--- 3. LOGO ---');
console.log(html.match(/<a id="header-logo".*?<\/a>/)?.[0]);

console.log('--- 4. RIGHT TALK BTN ---');
console.log(html.match(/<button id="header-right-talk-btn".*?<\/button>/)?.[0]);

console.log('--- 4. MENU TALK BTN ---');
console.log(html.match(/<button id="header-menu-talk".*?<\/button>/)?.[0]);

console.log('--- 4. MENU LINKS ---');
const menuLinksStart = html.indexOf('<div id="header-menu-links">');
const menuLinksEnd = html.indexOf('</div> <div id="header-menu-newsletter">');
console.log(html.substring(menuLinksStart, menuLinksEnd + 6));

console.log('--- 5. HERO TITLE ---');
console.log(html.match(/<h1 id="home-hero-title".*?<\/h1>/)?.[0]);

console.log('--- 6. REEL SECTION ---');
const reelStart = html.indexOf('<div id="home-reel"');
const reelEnd = html.indexOf('<div id="home-reel-thumb-wrapper"');
console.log(html.substring(reelStart, reelEnd));
