const fs = require('fs');
let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const target = "child.material.roughness = 0.3;\n      child.material.metalness = 0.15;\n      child.frustumCulled = false;";
const rep = `const oldMat = child.material;
      child.material = new MeshBasicMaterial({
        map: oldMat.map || null,
        color: oldMat.color ? oldMat.color.clone() : new Color(0xffffff),
        side: DoubleSide
      });
      child.frustumCulled = false;
      child.renderOrder = 10;`;

if (code.includes(target)) {
  code = code.replace(target, rep);
  fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
  console.log('REPLACED_MATERIAL_SUCCESS');
} else {
  console.log('TARGET_NOT_FOUND');
}
