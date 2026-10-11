const fs = require('fs');
let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const target = "this.customAvatar = model;\r\n  console.log('[Lusion] Custom female avatar (Michelle) loaded successfully!');";
const rep = `this.customAvatar = model;
  console.log('[Lusion] Custom female avatar (Michelle) loaded successfully!');
  try {
    if (typeof homeBalloons !== 'undefined' && homeBalloons.container) {
      homeBalloons.container.add(model);
      model.position.set(0, 0, 4);
      model.scale.set(2.0, 2.0, 2.0);
      console.log('[Lusion] Mounted female avatar directly into top hero screen!');
    }
  } catch(e) { console.error(e); }`;

if (code.includes(target)) {
  code = code.replace(target, rep);
  fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
  console.log('MOUNT_HERO_SCENE_SUCCESS');
} else {
  // Try CRLF / LF agnostic
  const idx = code.indexOf('[Lusion] Custom female avatar (Michelle) loaded successfully!');
  if (idx !== -1) {
    const end = code.indexOf('});', idx);
    code = code.substring(0, end) + `
  try {
    if (typeof homeBalloons !== 'undefined' && homeBalloons.container) {
      homeBalloons.container.add(model);
      model.position.set(0, 0, 4);
      model.scale.set(2.0, 2.0, 2.0);
      console.log('[Lusion] Mounted female avatar directly into top hero screen!');
    }
  } catch(e) { console.error(e); }
` + code.substring(end);
    fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
    console.log('MOUNT_HERO_SCENE_SUCCESS_AGNOSTIC');
  }
}
