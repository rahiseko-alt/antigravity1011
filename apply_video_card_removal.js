const fs = require('fs');

// 1. Edit _astro/about.CNa9RfUh.css
let css = fs.readFileSync('_astro/about.CNa9RfUh.css', 'utf8');
const oldCssRule = '#home-reel-container{grid-column:1 / 13;padding-bottom:calc(var(--vh, vh) * 100);margin-bottom:calc(var(--vh, vh) * 10)}@media (max-width: 812px){#home-reel-container{grid-column:1 / 7;padding-bottom:0}}';
const newCssRule = '#home-reel-container{display:none!important;height:0!important;margin:0!important;padding:0!important;visibility:hidden!important;pointer-events:none!important;overflow:hidden!important}#home-reel-thumb-wrapper{display:none!important;height:0!important;margin:0!important;padding:0!important}@media (max-width: 812px){#home-reel-container{display:none!important;height:0!important;margin:0!important;padding:0!important}#home-reel-thumb-wrapper{display:none!important}}';

if (css.includes(oldCssRule)) {
  css = css.replace(oldCssRule, newCssRule);
  fs.writeFileSync('_astro/about.CNa9RfUh.css', css, 'utf8');
  console.log('Successfully updated _astro/about.CNa9RfUh.css');
} else {
  console.error('Could not find oldCssRule in _astro/about.CNa9RfUh.css');
}

// 2. Edit _astro/hoisted.CUO_IjfL.js
let js = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const oldJsAdd = 'homePage.preUfxContainer.add(this.ufxMesh)';
const newJsAdd = 'this.ufxMesh.visible=!1';

const oldJsVisible = 'this.ufxMesh.visible=!0,this.ufxMesh.visible=r';
const newJsVisible = 'this.ufxMesh.visible=!1,this.ufxMesh.visible=!1';

if (js.includes(oldJsAdd) && js.includes(oldJsVisible)) {
  js = js.replace(oldJsAdd, newJsAdd);
  js = js.replace(oldJsVisible, newJsVisible);
  fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', js, 'utf8');
  console.log('Successfully updated _astro/hoisted.CUO_IjfL.js');
} else {
  console.error('Could not find JS targets in _astro/hoisted.CUO_IjfL.js', {
    hasAdd: js.includes(oldJsAdd),
    hasVisible: js.includes(oldJsVisible)
  });
}

// 3. Edit index.html
let html = fs.readFileSync('index.html', 'utf8');
const oldHtmlContainer = '<div id="home-reel-container">';
const newHtmlContainer = '<div id="home-reel-container" style="display:none!important;height:0!important;margin:0!important;padding:0!important;">';

const oldHtmlThumb = '<div id="home-reel-thumb-wrapper">';
const newHtmlThumb = '<div id="home-reel-thumb-wrapper" style="display:none!important;height:0!important;margin:0!important;padding:0!important;">';

if (html.includes(oldHtmlContainer)) {
  html = html.replace(oldHtmlContainer, newHtmlContainer);
  if (html.includes(oldHtmlThumb)) {
    html = html.replace(oldHtmlThumb, newHtmlThumb);
  }
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Successfully updated index.html');
} else {
  console.error('Could not find oldHtmlContainer in index.html');
}
