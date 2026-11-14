const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(targetFile, 'utf8');

console.log('Original length:', code.length);

// 1. Update Timeline Constants
const oldTimeline = 'const tP1=2.20,tP2=2.20,tWhite=0.80,tWarpEnd=tP1+tP2+tWhite,tWhiteHold=0.80,tHoldEnd=tWarpEnd+tWhiteHold,tHeroFade=1.00,tIntroEnd=tHoldEnd+tHeroFade;';
const newTimeline = 'const tP1=0.75,tP2=0.75,tWhite=0.35,tWarpEnd=tP1+tP2+tWhite,tWhiteHold=0.25,tHoldEnd=tWarpEnd+tWhiteHold,tHeroFade=0.45,tIntroEnd=tHoldEnd+tHeroFade;';

if (!code.includes(oldTimeline)) {
  console.error('ERROR: oldTimeline not found!');
  process.exit(1);
}
code = code.replace(oldTimeline, newTimeline);
console.log('1. Replaced intro timeline with fast 2.55s timeline.');

// 1b. Inject skipIntro and event listeners into intro initialization
const targetInitAnchor = 'if(!goalTunnels.hasIntroInitialized){';
if (!code.includes(targetInitAnchor)) {
  console.error('ERROR: targetInitAnchor not found!');
  process.exit(1);
}

const skipIntroCode = `if(!goalTunnels.hasIntroInitialized){const skipIntro=()=>{if(properties.isIntroWarp){properties.isIntroWarp=!1,scrollManager.isActive=!0,document.body.style.overflow="";const pc=document.getElementById("page-container");pc&&(pc.style.opacity="1");const hd=document.getElementById("header");hd&&(hd.style.opacity="1",hd.style.pointerEvents="");const wo=document.getElementById("intro-whiteout");wo&&(wo.style.display="none",wo.style.opacity="0");const it=document.getElementById("intro-warp-title");it&&(it.style.display="none");if(typeof header!=="undefined"&&header.show)header.show();document.documentElement.classList.remove("is-black-bg");document.documentElement.classList.add("is-white-bg");if(typeof homeBalloons!=="undefined"){homeBalloons.isActive=!0;if(typeof homeBalloonsPhysics!=="undefined")homeBalloonsPhysics.reset();if(homeBalloons.updateColor)homeBalloons.updateColor()}if(typeof goalTunnels!=="undefined"){goalTunnels.isActive=!1,goalTunnels.hasResetHeroPhysics=!0}properties.bloomAmount=0,properties.haloStrength=0;if(properties.bloom){properties.bloom.amount=0,properties.bloom.haloStrength=0}if(properties.offWhiteColorHex){properties.bgColor.setStyle(properties.offWhiteColorHex),properties.bgColorHex=properties.offWhiteColorHex}}};window.addEventListener("wheel",()=>{if(performance.now()-goalTunnels.introStartTime>600)skipIntro()},{passive:!0});window.addEventListener("touchstart",()=>{if(performance.now()-goalTunnels.introStartTime>600)skipIntro()},{passive:!0});window.addEventListener("keydown",()=>skipIntro(),{passive:!0});window.addEventListener("click",()=>{if(performance.now()-goalTunnels.introStartTime>600)skipIntro()},{passive:!0});`;

code = code.replace(targetInitAnchor, skipIntroCode);
console.log('1b. Injected skipIntro and user input event listeners.');

// 2. GoalSectionRanges.resize() calculation reduction (*42 -> *2)
const oldResize = 'if(isNaN(c)||c<t*10){c=(t||properties.viewportHeight||800)*42}';
const newResize = 'if(isNaN(c)||c<t*2){c=(t||properties.viewportHeight||800)*2}';

if (!code.includes(oldResize)) {
  console.error('ERROR: oldResize not found!');
  process.exit(1);
}
code = code.replace(oldResize, newResize);
console.log('2. Replaced resize calculation (*42 -> *2).');

// 3. GoalSection.update(e) bypass during normal scroll
const gsStart = code.indexOf('class GoalSection{');
const updateStart = code.indexOf('update(e){if(properties.isIntroWarp)return;homeGoalSectionRanges.update(e);', gsStart);
const splitTextStart = code.indexOf('}_splitText(){', updateStart);

if (updateStart === -1 || splitTextStart === -1) {
  console.error('ERROR: GoalSection.update boundary not found!');
  process.exit(1);
}

const oldGoalUpdate = code.substring(updateStart, splitTextStart);
const newGoalUpdate = 'update(e){if(properties.isIntroWarp)return;this.domDescs&&(this.domDescs.style.transform="translateZ(0)")';

code = code.substring(0, updateStart) + newGoalUpdate + code.substring(splitTextStart);
console.log('3. Replaced GoalSection.update with zero-overhead bypass.');

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Saved updated code to:', targetFile);
console.log('New length:', code.length);
