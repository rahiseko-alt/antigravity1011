const fs = require('fs');
const filePath = '_astro/hoisted.CUO_IjfL.js';

let code = fs.readFileSync(filePath, 'utf8');

const targetStr = 'const targetWidth=isMob?(W*0.90):(W*0.86),scaleX=targetWidth/1.0703;const scaleY=isMob?(5800/4.57):(5350/4.57);this.innerContainer.scale.x=scaleX,this.innerContainer.scale.y=scaleY;this.innerContainer.position.x=(W-targetWidth)*0.5-(-0.0503*scaleX);const reelCenterOnScreen=-(t.screenY+t.height*(isMob?0.35:0.40));this.innerContainer.position.y=reelCenterOnScreen-((isMob?-1.10:-1.00)*scaleY);';

const replacementStr = 'const targetWidth=isMob?(W*0.90):(W*0.86),scaleX=targetWidth/1.0019;const scaleY=isMob?(5800/4.57):(5350/4.57);this.innerContainer.scale.x=scaleX,this.innerContainer.scale.y=scaleY;this.innerContainer.position.x=(W-targetWidth)*0.5-(-0.0413*scaleX);const reelCenterOnScreen=-(t.screenY+t.height*(isMob?0.35:0.40));this.innerContainer.position.y=reelCenterOnScreen-((isMob?-1.10:-1.00)*scaleY);';

if (!code.includes(targetStr)) {
  console.error('Target string NOT FOUND in hoisted.CUO_IjfL.js!');
  process.exit(1);
}

code = code.replace(targetStr, replacementStr);
fs.writeFileSync(filePath, code);
console.log('Successfully updated scaling and position in hoisted.CUO_IjfL.js!');
