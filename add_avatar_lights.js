const fs = require('fs');
let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const target = "_gltfLoader.load('/assets/models/custom/michelle.glb', (gltf) => {";
const replacement = `_gltfLoader.load('/assets/models/custom/michelle.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.set(0.95, 0.95, 0.95);
  model.position.set(0, 0, 0);
  const dirLight = new DirectionalLight(0xffffff, 2.5);
  dirLight.position.set(2, 4, 5);
  model.add(dirLight);
  const fillLight = new DirectionalLight(0x88bbff, 1.5);
  fillLight.position.set(-3, -2, 2);
  model.add(fillLight);
  const ambLight = new AmbientLight(0xffffff, 1.2);
  model.add(ambLight);`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
  console.log('LIGHTS_ADDED_SUCCESS');
} else {
  console.log('TARGET_NOT_FOUND');
}
