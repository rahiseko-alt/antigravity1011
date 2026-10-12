const fs = require('fs');
const js = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const s1 = 'homePage.preUfxContainer.add(this.ufxMesh)';
const idx1 = js.indexOf(s1);
console.log('add ufxMesh at:', idx1, js.slice(idx1 - 30, idx1 + 60));

const s2 = 'this.ufxMesh.visible=!0,this.ufxMesh.visible=r';
const idx2 = js.indexOf(s2);
console.log('visible=!0 at:', idx2, js.slice(idx2 - 30, idx2 + 60));
