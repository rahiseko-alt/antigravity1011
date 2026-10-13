const fs = require('fs');
let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const target = '_onAfterRender(e,t,r){this.container.parent==homePage.preUfxContainer&&(r.matrixWorld.copy(_matrixWorld)';
const repl = '_onAfterRender(e,t,r){(this.container.parent==homePage.preUfxContainer||(typeof goalTunnels!=="undefined"&&this.container.parent==goalTunnels.container))&&(r.matrixWorld.copy(_matrixWorld)';

if (code.includes(target)) {
  code = code.replace(target, repl);
  fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
  console.log('Successfully updated GoalTunnelGlass _onAfterRender!');
} else {
  console.log('Target not found or already replaced!');
}
