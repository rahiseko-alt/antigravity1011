const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '_astro', 'hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

const startStr = "const _gltfLoader = new GLTFLoader();";
const endStr = "window.goalTunnelAstronauts = this;";

const sIdx = code.indexOf(startStr);
const eIdx = code.indexOf(endStr);

console.log('sIdx:', sIdx, 'eIdx:', eIdx);

if (sIdx !== -1 && eIdx !== -1 && eIdx > sIdx) {
  const replacement = `this.customAvatar = null; this.useCustomAvatar = false; this.customAvatarMeshes = []; `;
  code = code.substring(0, sIdx) + replacement + code.substring(eIdx);
  console.log('Successfully eliminated michelle.glb loading block!');
  fs.writeFileSync(filePath, code, 'utf8');
} else {
  console.log('Could not find GLTF loader block boundaries');
}
