const { execSync } = require('child_process');
const get = c => execSync(`git show ${c}:_astro/hoisted.CUO_IjfL.js`, { maxBuffer: 1 << 28 }).toString('utf8');
const fs = require('fs');
const markers = {
  'ad08c67 warp-off in updateRatios': 'updateRatios(){if(!properties.isIntroWarp){this.isBlackTitleActive=!1',
  'ad08c67 goalTunnels.isActive=!1 in HomeGoalSection': 'u=0;goalTunnels.isActive=!1,goalTunnels.resetAstronautLayer()',
  '4b452ec lightweight HomeGoalSection.update': 'update(e){if(properties.isIntroWarp)return;this.domDescs&&(this.domDescs.style.transform="translateZ(0)")',
  '0edecca lineVisual in HomeGoalSection': 'this.lineVisual.update(e,r);}}_splitText',
  '3595ae7 no checkShaderErrors stall': 'checkShaderErrors=!1',
  'skip-intro user gesture unlock': 'skipIntro',
  'autoScroll disabled (4b0146c)': 'let c=0;',
  'astronaut removed marker 0edecca': 'astronaut',
};
const versions = { '296b998': get('296b998'), '3e97892': get('3e97892'), '2822aaf': get('2822aaf'), '0edecca': get('0edecca'), '178a34e': get('178a34e'), '513af0e(HEAD~1)': get('513af0e'), 'HEAD': get('HEAD'), 'WORKING': fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8') };
console.log('size:', Object.entries(versions).map(([k, v]) => k + '=' + v.length).join('  '));
for (const [name, m] of Object.entries(markers)) {
  console.log('\n' + name + ':  ' + Object.entries(versions).map(([k, v]) => k + '=' + (v.split(m).length - 1)).join('  '));
}
// intro timeline constants
for (const k of ['tP1=', 'tHeroFade=', 'tIntroEnd=']) {
  console.log('\n' + k + ':', Object.entries(versions).map(([n, v]) => { const i = v.indexOf(k); return n + '=' + (i < 0 ? 'NA' : v.slice(i, i + 22).replace(/\r?\n/g, ' ')); }).join(' | '));
}
