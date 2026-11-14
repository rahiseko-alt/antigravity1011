const fs = require('fs');
let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

let patchedCount = 0;

// 1. Guard diamond.buf in GoalWhiteTunnelDiamonds.init()
const oldDiamond = 'init(){let e=this.geo,t=new InstancedBufferGeometry;for(let u in e.attributes)t.attributes[u]=e.attributes[u];t.index=e.index;';
const newDiamond = 'init(){if(!this.geo)this.geo=new BoxGeometry(.1,.1,.1);let e=this.geo,t=new InstancedBufferGeometry;for(let u in e.attributes)t.attributes[u]=e.attributes[u];t.index=e.index;';
if (code.includes(oldDiamond)) {
  code = code.replace(oldDiamond, newDiamond);
  patchedCount++;
  console.log('Patched diamond.buf');
}

// 2. Guard earth_card.buf in GoalEarthCard.init()
const oldEarth = 'init(){this.mesh=new Mesh(this.geo,';
const newEarth = 'init(){if(!this.geo)this.geo=new PlaneGeometry(1,1);this.mesh=new Mesh(this.geo,';
if (code.includes(oldEarth)) {
  code = code.replace(oldEarth, newEarth);
  patchedCount++;
  console.log('Patched earth_card.buf');
}

// 3. Guard plant.buf in ProjectDetailsScreen.init()
const oldPlant = 'this.shadowCamera.updateWorldMatrix(),this.plantGeo.computeBoundingBox();';
const newPlant = 'this.shadowCamera.updateWorldMatrix();if(!this.plantGeo)this.plantGeo=new BoxGeometry(1,1,1);this.plantGeo.computeBoundingBox();';
if (code.includes(oldPlant)) {
  code = code.replace(oldPlant, newPlant);
  patchedCount++;
  console.log('Patched plant.buf');
}

// 4. Guard terrain_lines.buf in AboutHeroScatter
const oldTerrain = 'terrain_lines.buf",{onLoad:this._onLineLoad.bind(this)})';
// Check if aboutHeroScatter has crash points

fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
console.log('Patched count:', patchedCount);
