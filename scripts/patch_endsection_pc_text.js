const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Fix HomePage endSectionActiveThreshold: from 2.5 to 0.7
const oldThreshold = 'class HomePage extends Page{path="";id="home";hasEndVisual=!1;updateAudio=!1;endSectionActiveThreshold=2.5;';
const newThreshold = 'class HomePage extends Page{path="";id="home";hasEndVisual=!1;updateAudio=!1;endSectionActiveThreshold=.7;';

if (!code.includes(oldThreshold)) {
  console.error('ERROR: oldThreshold not found in hoisted.CUO_IjfL.js');
  process.exit(1);
}

// 2. Fix NaN division in character loop when word has only 1 char (e.g. '/')
const oldCharB = 'b=M/(_._chars.length-1),C=properties.viewportWidth>=settings.MOBILE_WIDTH?math.fit(this.activeRatio,T*.15+b*.15,T*.15+b*.15+.7,100,0,ease.lusion):0;';
const newCharB = 'b=_._chars.length>1?M/(_._chars.length-1):0,C=properties.viewportWidth>=settings.MOBILE_WIDTH?math.fit(this.activeRatio,T*.15+b*.15,T*.15+b*.15+.7,100,0,ease.lusion):0;';

if (!code.includes(oldCharB)) {
  console.error('ERROR: oldCharB not found in hoisted.CUO_IjfL.js');
  process.exit(1);
}

// 3. Fix NaN division in subtitle words loop when subtitle has 1 Japanese word
const oldSubT = 'T=v/(this.domSubtitle._splitted.words.length-1),M=math.fit(this.activeRatio,T*.15,T*.15+.75,200,0,ease.lusion)';
const newSubT = 'T=this.domSubtitle._splitted.words.length>1?v/(this.domSubtitle._splitted.words.length-1):0,M=math.fit(this.activeRatio,T*.15,T*.15+.75,200,0,ease.lusion)';

if (!code.includes(oldSubT)) {
  console.error('ERROR: oldSubT not found in hoisted.CUO_IjfL.js');
  process.exit(1);
}

// Apply replacements
code = code.replace(oldThreshold, newThreshold);
code = code.replace(oldCharB, newCharB);
code = code.replace(oldSubT, newSubT);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('SUCCESS: Flawlessly patched hoisted.CUO_IjfL.js with endSection PC text fix!');
