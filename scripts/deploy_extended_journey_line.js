const fs = require('fs');
const path = require('path');
const three = require('three');
const esbuild = require('esbuild');

console.log('=== 1. GENERATING EXTENDED JOURNEY 3D TRAJECTORY ===');

// The coordinate transformation:
// hypot = 2202.907 (baseline 1920x1080)
// margin.x = -0.05, margin.y = -0.8
// For a target on-screen position (screenX, screenY) at scrollPixel:
// CP.x = screenX / 2202.9 + 0.05
// CP.y = 0.8 - (screenY + scrollPixel - 1080) / 2202.9

const hypot = 2202.907;

function getCP(screenX, screenY, scrollPixel) {
  const x = screenX / hypot + 0.05;
  const y = 0.8 - (screenY + (scrollPixel - 1080)) / hypot;
  return new three.Vector3(x, y, 0);
}

// 12 key waypoints carefully choreographed across the page layout:
// 1. Enter top-left near headline "場をつくる" at scroll 980
// 2. High graceful arch over headline into open space at scroll 1150
// 3. Soaring crest in open upper-right space at scroll 1320
// 4. Downward sweep across the wide open reel space at scroll 1500
// 5. Swooping under description & "HOW IT WORKS" button at scroll 1700
// 6. Curving gracefully in lower-left of Reel at scroll 1920
// 7. Sweeping across underneath "Active Initiatives & Events" header at scroll 2180
// 8. Entering central boulevard between left and right card columns at scroll 2450
// 9. Weaving through central avenue between Card 1 & Card 2 at scroll 2800
// 10. Gliding through horizontal gap between card rows at scroll 3150
// 11. Cascading down between Card 3 & Card 4 at scroll 3500
// 12. Grand outro flourish cascading towards members section at scroll 3850
const controlPoints = [
  getCP( 120, 160,  980),
  getCP( 620, 170, 1150),
  getCP(1420, 270, 1320),
  getCP(1620, 520, 1500),
  getCP( 960, 720, 1700),
  getCP( 340, 600, 1920),
  getCP( 720, 320, 2180),
  getCP( 960, 480, 2450),
  getCP( 960, 520, 2800),
  getCP(1120, 550, 3150),
  getCP( 960, 580, 3500),
  getCP( 960, 680, 3850)
];

console.log('Waypoints (CP coordinates):');
controlPoints.forEach((p, idx) => {
  console.log(`  [${idx}]: x=${p.x.toFixed(4)}, y=${p.y.toFixed(4)}`);
});

const curve = new three.CatmullRomCurve3(controlPoints, false, 'centripetal', 0.5);

const numSplinePoints = 400;
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

console.log(`Generated curve with ${numSplinePoints} points (${numVertices} vertices, ${numIndices} indices).`);
console.log(`Bounds: X [${minX.toFixed(4)}, ${maxX.toFixed(4)}], Y [${minY.toFixed(4)}, ${maxY.toFixed(4)}]`);

console.log('=== 2. SERIALIZING BINARY BUFFER WITH STRICT 4-BYTE ALIGNMENT ===');
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
while ((4 + Buffer.byteLength(headerJson, 'utf8')) % 4 !== 0) {
  headerJson += ' ';
}

const headerBuf = Buffer.from(headerJson, 'utf8');
console.log(`Header length: ${headerBuf.length}, total offset (4 + len): ${4 + headerBuf.length} (aligned: ${(4 + headerBuf.length) % 4 === 0})`);

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

console.log('=== 3. PATCHING JAVASCRIPT CODE IN HOISTED.JS ===');
function patchHoistedFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Update LINES_DATA_LIST[0]
  // scrollToRatioFactors: [0.12, 2.65] spans from scroll 950px through 3800px (2850px scroll journey!)
  const listIdx = content.indexOf('LINES_DATA_LIST=[');
  if (listIdx === -1) throw new Error('LINES_DATA_LIST=[ not found');
  const reelStart = content.indexOf('{fileName:"line_reel"', listIdx);
  const reelEnd = content.indexOf(',{fileName:"line_goal"', reelStart);
  if (reelStart === -1 || reelEnd === -1) throw new Error('line_reel segment not found');

  const boxMinY = (minY - 0.1).toFixed(4);
  const boxMaxY = (maxY + 0.1).toFixed(4);
  const boxMinX = (minX - 0.1).toFixed(4);
  const boxMaxX = (maxX + 0.1).toFixed(4);

  const newLineData = `{fileName:"line_reel",aoThreshold:.555,margin:{x:-0.05,y:-0.8},scrollToRatioFactors:[.12,2.65],boxMin:new Vector3(${boxMinX},${boxMinY},0),boxMax:new Vector3(${boxMaxX},${boxMaxY},0),color0:"#00f0ff",color1:"#1d35ff"}`;
  content = content.slice(0, reelStart) + newLineData + content.slice(reelEnd);
  console.log(`[${filePath}] Updated LINES_DATA_LIST[0] with scroll [0.12, 2.65], bbox [${boxMinX}, ${boxMinY}] to [${boxMaxX}, ${boxMaxY}]`);

  // 2. Line.update(): For lineId 0, use linear/smooth progression so line tip moves synchronously with scroll
  const oldEase = 'a=ease.quadInOut(a);';
  const newEase = 'a=this.lineId===0?a:ease.quadInOut(a);';
  if (content.includes(oldEase)) {
    content = content.replace(oldEase, newEase);
    console.log(`[${filePath}] Updated easing for line 0 to linear 1:1 scroll responsiveness.`);
  }

  // 3. Ensure container visibility check for line 0 stays active
  const oldVis = 'this.container.visible=_box.max.y>-properties.viewportHeight&&_box.min.y<0)';
  const newVis = 'this.container.visible=this.lineId===0?(a>0&&a<=1.):(_box.max.y>-properties.viewportHeight&&_box.min.y<0))';
  if (content.includes(oldVis)) {
    content = content.replace(oldVis, newVis);
    console.log(`[${filePath}] Updated container.visible check.`);
  }

  // 4. Line.preInit() onLoad sync mesh.geometry
  const oldOnLoad = 'onLoad:e=>{this.geometry=e;';
  const newOnLoad = 'onLoad:e=>{this.geometry=e,this.mesh&&(this.mesh.geometry=e);';
  if (content.includes(oldOnLoad)) {
    content = content.replace(oldOnLoad, newOnLoad);
    console.log(`[${filePath}] Synced this.mesh.geometry in Line.preInit onLoad.`);
  }

  // 5. vert$j with seamless tapered leading edge
  const vertStart = content.indexOf('vert$j=`#define GLSLIFY 1');
  if (vertStart !== -1) {
    const vertEnd = content.indexOf('`', vertStart + 15);
    const newVert = `vert$j=\`#define GLSLIFY 1
attribute vec3 CP;attribute float Cd;varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_scrollY;uniform vec2 u_viewportResolution;uniform vec2 u_aspect;uniform vec2 u_margin;uniform float u_radius;uniform float u_showRatio;void main(){float taperLen=0.035;float distToEnd=clamp((u_showRatio-position.z)/taperLen,0.0,1.0);float taper=smoothstep(0.0,1.0,distToEnd);vec3 pos=vec3(CP.xy+position.xy*u_radius*taper,0.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_cd=Cd;v_lineRatio=position.z;v_s=CP.z;}\``;
    content = content.slice(0, vertStart) + newVert + content.slice(vertEnd + 1);
    console.log(`[${filePath}] Updated vert$j with seamless tapered leading edge.`);
  }

  // 6. Fragment shader smooth tip alpha + 3D cylindrical lighting
  const fragStart = content.indexOf('frag$m=`#define GLSLIFY 1');
  if (fragStart !== -1) {
    const fragEnd = content.indexOf('`', fragStart + 15);
    const newFrag = `frag$m=\`#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform float u_hideRatio;uniform vec3 u_colorBg;uniform vec3 u_color0;uniform vec3 u_color1;uniform float u_aoThreshold;float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}vec3 hsv2rgb(in vec3 c){vec3 rgb=clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);rgb=rgb*rgb*(3.0-2.0*rgb);return c.z*mix(vec3(1.0),rgb,c.y);}vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)),d/(q.x+e),q.x);}vec3 lerpHSV(in vec3 a,in vec3 b,in float x){float hue=(mod(mod((b.x-a.x),1.)+1.5,1.)-0.5)*x+a.x;return vec3(hue,mix(a.yz,b.yz,x));}void main(){float ao=0.9+0.1*v_cd;float aoRatio=linearStep(u_aoThreshold-0.02,u_aoThreshold+0.02,u_showRatio);if(step(u_showRatio,v_lineRatio)>0.5)discard;float mixRatio=1.0-pow(1.0-clamp(v_lineRatio,0.0,1.0),2.0);vec3 baseColor=hsv2rgb(lerpHSV(rgb2hsv(u_color1),rgb2hsv(u_color0),mixRatio));float t=(v_s-0.5)*2.0;float nz=sqrt(max(0.0,1.0-t*t));float diff=0.58+0.42*nz;vec3 n=vec3(t,0.0,nz);vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),26.0);float rim=pow(1.0-nz,3.0);vec3 rimColor=u_color0*(rim*0.28);float aoFactor=min(1.0,ao+1.0-aoRatio);vec3 shaded=(baseColor*diff+rimColor)*aoFactor+vec3(1.0)*(spec*0.38);gl_FragColor.rgb=shaded;float alpha=abs(v_s-.5);float edgeAlpha=linearStep(0.5,0.5-fwidth(alpha),alpha);float tipAlpha=smoothstep(0.0,0.002,u_showRatio-v_lineRatio);gl_FragColor.a=edgeAlpha*tipAlpha;}\``;
    content = content.slice(0, fragStart) + newFrag + content.slice(fragEnd + 1);
    console.log(`[${filePath}] Updated frag$m with smooth tip alpha and 3D lighting.`);
  }

  // Validate syntax
  esbuild.transformSync(content, { loader: 'js' });
  console.log(`[${filePath}] Syntax 100% Valid.`);

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

console.log('=== ALL SUCCESSFUL ===');
