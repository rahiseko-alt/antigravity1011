const fs = require('fs');
const path = require('path');
const three = require('three');
const esbuild = require('esbuild');

console.log('=== 1. CREATING NEW 3D TRAJECTORY CURVE ===');
const hypot = 2202.9; // standard 1920x1080 baseline

// The coordinate system for Line:
// innerContainer.position.x = margin.x * hypot;
// innerContainer.position.y = margin.y * hypot - scrollPixel;
// With margin: { x: 0, y: 0 }, world coordinates are directly pt * hypot.
//
// Let's create a majestic, sweeping S-curve trajectory:
// - Starts at top-left negative space above "場をつくる" headline: (x=160, y=-100)
// - Sweeps smoothly down under the headline into the open space: (x=300, y=-420)
// - Swoops across under the description and "HOW IT WORKS" button: (x=760, y=-660)
// - Rises into a luminous wave crest to the right of the video frame: (x=1520, y=-800)
// - Sweeps down and back across into Active Initiatives header: (x=1200, y=-1300)
// - Weaves down the side of the initiative cards: (x=360, y=-1800)
// - Glides smoothly between cards: (x=720, y=-2300)
// - Sweeps through lower cards: (x=1380, y=-2800)
// - Cascades toward center pointing downwards: (x=960, y=-3300)
// - Elegant outro flourish: (x=960, y=-3600)
const controlPoints = [
  new three.Vector3( 160 / hypot, -100 / hypot, 0),
  new three.Vector3( 300 / hypot, -420 / hypot, 0),
  new three.Vector3( 760 / hypot, -660 / hypot, 0),
  new three.Vector3(1520 / hypot, -800 / hypot, 0),
  new three.Vector3(1200 / hypot, -1300 / hypot, 0),
  new three.Vector3( 360 / hypot, -1800 / hypot, 0),
  new three.Vector3( 720 / hypot, -2300 / hypot, 0),
  new three.Vector3(1380 / hypot, -2800 / hypot, 0),
  new three.Vector3( 960 / hypot, -3300 / hypot, 0),
  new three.Vector3( 960 / hypot, -3600 / hypot, 0)
];

const curve = new three.CatmullRomCurve3(controlPoints, false, 'centripetal', 0.5);

const numSplinePoints = 360;
const numVertices = numSplinePoints * 2;
const numIndices = (numSplinePoints - 1) * 6;

const points = curve.getSpacedPoints(numSplinePoints - 1);
const cpArray = new Float32Array(numVertices * 3);
const posArray = new Float32Array(numVertices * 3);
const cdArray = new Float32Array(numVertices);
const indices = new Uint16Array(numIndices);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

for (let i = 0; i < numSplinePoints; i++) {
  const pt = points[i];
  const s = i / (numSplinePoints - 1); // 0.0 -> 1.0 along curve

  if (pt.x < minX) minX = pt.x;
  if (pt.x > maxX) maxX = pt.x;
  if (pt.y < minY) minY = pt.y;
  if (pt.y > maxY) maxY = pt.y;

  // Tangent vector
  let tx, ty;
  if (i === 0) {
    tx = points[1].x - points[0].x;
    ty = points[1].y - points[0].y;
  } else if (i === numSplinePoints - 1) {
    tx = points[i].x - points[i - 1].x;
    ty = points[i].y - points[i - 1].y;
  } else {
    tx = points[i + 1].x - points[i - 1].x;
    ty = points[i + 1].y - points[i - 1].y;
  }
  const len = Math.hypot(tx, ty) || 1;
  tx /= len;
  ty /= len;

  // Normal vector perpendicular to tangent
  const nx = -ty;
  const ny = tx;

  // Vertex 2*i: right edge of ribbon
  cpArray[i * 6 + 0] = pt.x;
  cpArray[i * 6 + 1] = pt.y;
  cpArray[i * 6 + 2] = 1.0;

  posArray[i * 6 + 0] = -nx;
  posArray[i * 6 + 1] = -ny;
  posArray[i * 6 + 2] = s;

  cdArray[i * 2 + 0] = 1.0;

  // Vertex 2*i + 1: left edge of ribbon
  cpArray[i * 6 + 3] = pt.x;
  cpArray[i * 6 + 4] = pt.y;
  cpArray[i * 6 + 5] = 0.0;

  posArray[i * 6 + 3] = nx;
  posArray[i * 6 + 4] = ny;
  posArray[i * 6 + 5] = s;

  cdArray[i * 2 + 1] = 1.0;

  // Indices for quad
  if (i < numSplinePoints - 1) {
    const v0 = i * 2;
    const v1 = i * 2 + 1;
    const v2 = (i + 1) * 2;
    const v3 = (i + 1) * 2 + 1;

    indices[i * 6 + 0] = v0;
    indices[i * 6 + 1] = v1;
    indices[i * 6 + 2] = v2;

    indices[i * 6 + 3] = v1;
    indices[i * 6 + 4] = v3;
    indices[i * 6 + 5] = v2;
  }
}

console.log(`Bounds: X [${minX.toFixed(4)}, ${maxX.toFixed(4)}], Y [${minY.toFixed(4)}, ${maxY.toFixed(4)}]`);

console.log('=== 2. SERIALIZING BUFFER WITH 4-BYTE ALIGNMENT PADDING ===');
const cpPacked = [
  { from: minX, delta: maxX - minX },
  { from: minY, delta: maxY - minY },
  { from: 0, delta: 1 }
];

const posPacked = [
  { from: -1, delta: 2 },
  { from: -1, delta: 2 },
  { from: 0, delta: 1 }
];

const cdPacked = [
  { from: 0, delta: 1 }
];

const header = {
  vertexCount: numVertices,
  indexCount: numIndices,
  attributes: [
    { id: 'CP', needsPack: true, componentSize: 3, storageType: 'Int16Array', packedComponents: cpPacked },
    { id: 'indices', needsPack: false, componentSize: 1, storageType: 'Uint16Array' },
    { id: 'position', needsPack: true, componentSize: 3, storageType: 'Uint16Array', packedComponents: posPacked },
    { id: 'Cd', needsPack: true, componentSize: 1, storageType: 'Uint8Array', packedComponents: cdPacked }
  ],
  meshType: 'Mesh'
};

let headerJson = JSON.stringify(header);
// CRITICAL: Pad with spaces so (4 + headerJson.length) is an EXACT multiple of 4!
while ((4 + Buffer.byteLength(headerJson, 'utf8')) % 4 !== 0) {
  headerJson += ' ';
}

const headerBuf = Buffer.from(headerJson, 'utf8');
console.log(`Header length: ${headerBuf.length}, total header offset (4 + len): ${4 + headerBuf.length} (multiple of 4: ${(4 + headerBuf.length) % 4 === 0})`);

// Pack CP into Int16Array
const cpRaw = new Int16Array(cpArray.length);
for (let i = 0; i < cpArray.length; i += 3) {
  for (let c = 0; c < 3; c++) {
    const val = cpArray[i + c];
    const p = cpPacked[c];
    const norm = Math.max(0, Math.min(1, (val - p.from) / p.delta));
    cpRaw[i + c] = Math.round(norm * 65535) - 32768;
  }
}

// Pack position into Uint16Array
const posRaw = new Uint16Array(posArray.length);
for (let i = 0; i < posArray.length; i += 3) {
  for (let c = 0; c < 3; c++) {
    const val = posArray[i + c];
    const p = posPacked[c];
    const norm = Math.max(0, Math.min(1, (val - p.from) / p.delta));
    posRaw[i + c] = Math.round(norm * 65535);
  }
}

// Pack Cd into Uint8Array
const cdRaw = new Uint8Array(cdArray.length);
for (let i = 0; i < cdArray.length; i++) {
  cdRaw[i] = 255;
}

const indicesRaw = indices;

const totalByteLength = 4 + headerBuf.length +
  cpRaw.byteLength +
  indicesRaw.byteLength +
  posRaw.byteLength +
  cdRaw.byteLength;

const outBuf = Buffer.alloc(totalByteLength);
let offset = 0;

outBuf.writeUInt32LE(headerBuf.length, offset);
offset += 4;

headerBuf.copy(outBuf, offset);
offset += headerBuf.length;

Buffer.from(cpRaw.buffer).copy(outBuf, offset);
offset += cpRaw.byteLength;

Buffer.from(indicesRaw.buffer).copy(outBuf, offset);
offset += indicesRaw.byteLength;

Buffer.from(posRaw.buffer).copy(outBuf, offset);
offset += posRaw.byteLength;

Buffer.from(cdRaw.buffer).copy(outBuf, offset);
offset += cdRaw.byteLength;

// Write line_reel.buf files
const bufPaths = [
  path.resolve('assets/models/lines/line_reel.buf'),
  path.resolve('dist/assets/models/lines/line_reel.buf')
];
for (const p of bufPaths) {
  if (fs.existsSync(path.dirname(p))) {
    fs.writeFileSync(p, outBuf);
    console.log(`Saved ${outBuf.length} bytes to ${p}`);
  }
}

console.log('=== 3. PATCHING HOISTED JAVASCRIPT FILES ===');
function patchHoistedFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix 1: LINES_DATA_LIST[0]
  const listIdx = content.indexOf('LINES_DATA_LIST=[');
  if (listIdx === -1) throw new Error('LINES_DATA_LIST=[ not found');
  const reelStart = content.indexOf('{fileName:"line_reel"', listIdx);
  const reelEnd = content.indexOf(',{fileName:"line_goal"', reelStart);
  if (reelStart === -1 || reelEnd === -1) throw new Error('line_reel segment not found');

  const boxMinY = (minY - 0.1).toFixed(4);
  const boxMaxY = (maxY + 0.1).toFixed(4);
  const boxMinX = (minX - 0.1).toFixed(4);
  const boxMaxX = (maxX + 0.1).toFixed(4);

  // scrollToRatioFactors: [0.15, 3.2] allows line to start drawing as Reel appears and extend across 3.2 full screen heights!
  const newLineData = `{fileName:"line_reel",aoThreshold:.555,margin:{x:0,y:0},scrollToRatioFactors:[.15,3.2],boxMin:new Vector3(${boxMinX},${boxMinY},0),boxMax:new Vector3(${boxMaxX},${boxMaxY},0),color0:"#00f0ff",color1:"#1d35ff"}`;
  content = content.slice(0, reelStart) + newLineData + content.slice(reelEnd);
  console.log(`[${filePath}] Updated LINES_DATA_LIST[0] with single brace, margins {x:0,y:0}, scroll [0.15, 3.2]`);

  // Fix 2: Sync mesh.geometry in Line.preInit onLoad
  const onLoadSearch = 'onLoad:e=>{this.geometry=e;';
  const onLoadIdx = content.indexOf(onLoadSearch);
  if (onLoadIdx !== -1) {
    const replacement = 'onLoad:e=>{this.geometry=e,this.mesh&&(this.mesh.geometry=e);';
    content = content.slice(0, onLoadIdx) + replacement + content.slice(onLoadIdx + onLoadSearch.length);
    console.log(`[${filePath}] Synced mesh.geometry in Line.preInit onLoad.`);
  }

  // Fix 3: Seamless Tapered Leading Edge in vert$j
  const vertStart = content.indexOf('vert$j=`#define GLSLIFY 1');
  if (vertStart !== -1) {
    const vertEnd = content.indexOf('`', vertStart + 15);
    const newVert = `vert$j=\`#define GLSLIFY 1
attribute vec3 CP;attribute float Cd;varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_scrollY;uniform vec2 u_viewportResolution;uniform vec2 u_aspect;uniform vec2 u_margin;uniform float u_radius;uniform float u_showRatio;void main(){float taperLen=0.048;float distToEnd=clamp((u_showRatio-position.z)/taperLen,0.0,1.0);float taper=smoothstep(0.0,1.0,distToEnd);vec3 pos=vec3(CP.xy+position.xy*u_radius*taper,0.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_cd=Cd;v_lineRatio=position.z;v_s=CP.z;}\``;
    content = content.slice(0, vertStart) + newVert + content.slice(vertEnd + 1);
    console.log(`[${filePath}] Updated vert$j with seamless tapered leading edge.`);
  }

  // Fix 4: Disable this.circle visibility (removes flat unnatural sticker)
  const addCircle = 'this.innerContainer.add(this.circle)';
  if (content.indexOf(addCircle) !== -1 && !content.includes('this.innerContainer.add(this.circle),this.circle.visible=!1')) {
    content = content.replace(addCircle, 'this.innerContainer.add(this.circle),this.circle.visible=!1');
    console.log(`[${filePath}] Disabled this.circle visibility.`);
  }

  // In Line.update: ensure this.circle.visible stays false
  const circleUpdate = 'this.circle.position.copy(_v0$2)';
  if (content.indexOf(circleUpdate) !== -1 && !content.includes('this.circle.visible=!1,this.circle.position.copy(_v0$2)')) {
    content = content.replace(circleUpdate, 'this.circle.visible=!1,this.circle.position.copy(_v0$2)');
  }

  // Fix 5: Fragment shader anti-aliased soft tip + 3D cylindrical lighting
  const fragStart = content.indexOf('frag$m=`#define GLSLIFY 1');
  if (fragStart !== -1) {
    const fragEnd = content.indexOf('`', fragStart + 15);
    const newFrag = `frag$m=\`#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform float u_hideRatio;uniform vec3 u_colorBg;uniform vec3 u_color0;uniform vec3 u_color1;uniform float u_aoThreshold;float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}vec3 hsv2rgb(in vec3 c){vec3 rgb=clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);rgb=rgb*rgb*(3.0-2.0*rgb);return c.z*mix(vec3(1.0),rgb,c.y);}vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)),d/(q.x+e),q.x);}vec3 lerpHSV(in vec3 a,in vec3 b,in float x){float hue=(mod(mod((b.x-a.x),1.)+1.5,1.)-0.5)*x+a.x;return vec3(hue,mix(a.yz,b.yz,x));}void main(){float ao=0.9+0.1*v_cd;float aoRatio=linearStep(u_aoThreshold-0.02,u_aoThreshold+0.02,u_showRatio);if(step(u_showRatio,v_lineRatio)>0.5)discard;float mixRatio=1.0-pow(1.0-clamp(v_lineRatio,0.0,1.0),2.0);vec3 baseColor=hsv2rgb(lerpHSV(rgb2hsv(u_color1),rgb2hsv(u_color0),mixRatio));float t=(v_s-0.5)*2.0;float nz=sqrt(max(0.0,1.0-t*t));float diff=0.58+0.42*nz;vec3 n=vec3(t,0.0,nz);vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),26.0);float rim=pow(1.0-nz,3.0);vec3 rimColor=u_color0*(rim*0.28);float aoFactor=min(1.0,ao+1.0-aoRatio);vec3 shaded=(baseColor*diff+rimColor)*aoFactor+vec3(1.0)*(spec*0.38);gl_FragColor.rgb=shaded;float alpha=abs(v_s-.5);float edgeAlpha=linearStep(0.5,0.5-fwidth(alpha),alpha);float tipAlpha=smoothstep(0.0,0.003,u_showRatio-v_lineRatio);gl_FragColor.a=edgeAlpha*tipAlpha;}\``;
    content = content.slice(0, fragStart) + newFrag + content.slice(fragEnd + 1);
    console.log(`[${filePath}] Updated frag$m with smooth tip alpha and 3D lighting.`);
  }

  // Fix 6: Frustum culling box visibility check in Line.update()
  const boxVisIdx = content.indexOf('this.container.visible=_box.max.y>-properties.viewportHeight&&_box.min.y<0');
  if (boxVisIdx !== -1) {
    const newBoxVis = 'this.container.visible=this.lineId===0?(_box.max.y>-properties.viewportHeight*3.5&&_box.min.y<properties.viewportHeight):(_box.max.y>-properties.viewportHeight&&_box.min.y<0)';
    content = content.slice(0, boxVisIdx) + newBoxVis + content.slice(boxVisIdx + 'this.container.visible=_box.max.y>-properties.viewportHeight&&_box.min.y<0'.length);
    console.log(`[${filePath}] Expanded container.visible for extended line travel.`);
  }

  // Validate syntax with esbuild
  try {
    esbuild.transformSync(content, { loader: 'js' });
    console.log(`[${filePath}] SYNTAX VALIDATION: 100% OK!`);
  } catch (err) {
    console.error(`[${filePath}] SYNTAX ERROR:`, err);
    throw err;
  }

  fs.writeFileSync(filePath, content, 'utf8');
  const now = new Date();
  fs.utimesSync(filePath, now, now);
  console.log(`[${filePath}] Successfully saved and touched.`);
}

const jsFiles = ['_astro/hoisted.CUO_IjfL.js', 'dist/_astro/hoisted.CUO_IjfL.js'];
for (const f of jsFiles) {
  if (fs.existsSync(f)) {
    patchHoistedFile(f);
  }
}

console.log('=== ALL COMPLETED PERFECTLY ===');
