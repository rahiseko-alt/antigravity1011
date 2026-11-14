const cp = require('child_process');
const fs = require('fs');

const fCurrent = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');
const f0e = cp.execSync('git show 0e3fc07:_astro/hoisted.CUO_IjfL.js', { maxBuffer: 50 * 1024 * 1024 }).toString();

function showShaders(code, label) {
  console.log(`=== ${label} ===`);
  const pos = code.indexOf('if(step(u_showRatio,v_lineRatio)>0.5)discard;');
  if (pos !== -1) {
    console.log('Shader fragment:', code.slice(pos, pos + 400));
  } else {
    console.log('Not found');
  }

  const endPos = code.indexOf('lineEndFrag=`');
  if (endPos !== -1) {
    console.log('LineEndFrag:', code.slice(endPos, endPos + 350));
  }

  const aCalcPos = code.indexOf('if(this.lineId===0){');
  if (aCalcPos !== -1) {
    console.log('a calc:', code.slice(aCalcPos, aCalcPos + 700));
  }

  const visPos = code.indexOf('this.container.visible=this.lineId===0?');
  if (visPos !== -1) {
    console.log('visibility check:', code.slice(visPos, visPos + 250));
  }
}

showShaders(f0e, 'Commit 0e3fc07');
showShaders(fCurrent, 'Current HEAD');
