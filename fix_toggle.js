const fs = require('fs');
let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const p = code.indexOf('if (this.customAvatar) {');
const end = code.indexOf('}}}const goalTunnelAstronauts', p);

const rep = `if (this.customAvatar) {
  if (this.useCustomAvatar) {
    this.customAvatar.visible = this.showRatio > 0.01;
    const _t = this.transformObjectList[0];
    this.customAvatar.position.copy(_t.position);
    this.customAvatar.quaternion.copy(_t.quaternion);
    for (const _k in this.meshes) this.meshes[_k].visible = false;
    for (const _k in this.cloneMeshes) this.cloneMeshes[_k].visible = false;
  } else {
    this.customAvatar.visible = false;
    for (const _k in this.meshes) this.meshes[_k].visible = this.showRatio > 0.01;
    for (const _k in this.cloneMeshes) this.cloneMeshes[_k].visible = this.clonesShowRatio > 0.01;
  }
}`;

code = code.substring(0, p) + rep + code.substring(end);
fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
console.log('RESTORE_ASTRONAUT_VISIBILITY_SUCCESS');
