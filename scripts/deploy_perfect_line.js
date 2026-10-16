const fs = require('fs');
const path = require('path');
const three = require('three');
const esbuild = require('esbuild');

console.log('=== 1. GENERATING 45-DEGREE ZIG-ZAG SCREEN TRAVERSAL TRAJECTORY ===');

// Ricochet / Slalom / Zig-zag screen traversal across 3 distinct crossings:
// - Crossing 1: Starts top-left (-0.05, 0.80), sweeps diagonally down-right to (1.15, 0.10) (exits right screen edge completely)
// - Offscreen Loop 1: Curves offscreen around (1.25, -0.15) down to (1.15, -0.35)
// - Crossing 2: Re-enters from the right at (1.05, -0.45), sweeps diagonally down-left across full screen to (-0.15, -1.25) (exits left screen edge completely)
// - Offscreen Loop 2: Curves offscreen around (-0.25, -1.45) down to (-0.15, -1.65)
// - Crossing 3: Re-enters from the left at (-0.05, -1.75), sweeps diagonally down-right across screen to (1.15, -2.55) (exits right edge)
// - Outro flourish: Smooth exit curve at (1.25, -2.70)
const controlPoints = [
  new three.Vector3(-0.05,  0.75, 0), // Crossing 1: Starts top-left offscreen (X = -0.05, Y = 0.75)
  new three.Vector3( 0.50,  0.55, 0), // Crossing 1: Mid diagonal sweep (~45°) across viewport center
  new three.Vector3( 1.10,  0.35, 0), // Crossing 1: Exits right screen edge completely (X = 1.10, Y = 0.35)
  new three.Vector3( 1.22,  0.28, 0), // Offscreen Loop 1: Curves offscreen right apex
  new three.Vector3( 1.18,  0.18, 0), // Offscreen Loop 1: Descending slightly offscreen
  new three.Vector3( 1.08,  0.12, 0), // Offscreen Loop 1: Turning back toward screen
  new three.Vector3( 1.02,  0.08, 0), // Crossing 2: Re-enters from right (X = 1.02, Y = 0.08)
  new three.Vector3( 0.48, -0.12, 0), // Crossing 2: Mid diagonal sweep (~45°) across viewport center down-left
  new three.Vector3(-0.10, -0.32, 0), // Crossing 2: Exits left screen edge completely (X = -0.10, Y = -0.32)
  new three.Vector3(-0.22, -0.40, 0), // Offscreen Loop 2: Curves offscreen left apex
  new three.Vector3(-0.18, -0.48, 0), // Offscreen Loop 2: Descending slightly offscreen
  new three.Vector3(-0.08, -0.54, 0), // Offscreen Loop 2: Turning back toward screen
  new three.Vector3(-0.02, -0.58, 0), // Crossing 3: Re-enters from left (X = -0.02, Y = -0.58)
  new three.Vector3( 0.52, -0.78, 0), // Crossing 3: Mid diagonal sweep (~45°) across viewport center down-right
  new three.Vector3( 1.10, -0.98, 0), // Crossing 3: Exits right edge (X = 1.10, Y = -0.98)
  new three.Vector3( 1.22, -1.08, 0)  // Outro flourish: Smooth offscreen exit (X = 1.22, Y = -1.08)
];

const curve = new three.CatmullRomCurve3(controlPoints, false, 'centripetal', 0.5);

const numSplinePoints = 400;
const numVertices = numSplinePoints * 2; // 800
const numIndices = (numSplinePoints - 1) * 6; // 2394

const points = curve.getSpacedPoints(numSplinePoints - 1);
const cpArray = new Float32Array(numVertices * 3);
const posArray = new Float32Array(numVertices * 3);
const cdArray = new Float32Array(numVertices);
const indices = new Uint16Array(numIndices);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

for (let i = 0; i < numSplinePoints; i++) {
  const pt = points[i];
  const s = i / (numSplinePoints - 1);

  if (pt.x < minX) minX = pt.x;
  if (pt.x > maxX) maxX = pt.x;
  if (pt.y < minY) minY = pt.y;
  if (pt.y > maxY) maxY = pt.y;

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

  const nx = -ty;
  const ny = tx;

  // Segment ID / normalized traversal stage in Cd attribute:
  // - Crossing 1 (s in [0.0, 0.32]): value 0.0
  // - Offscreen Loop 1 (s in [0.32, 0.35]): transition 0.0 -> 0.5
  // - Crossing 2 (s in [0.35, 0.68]): value 0.5
  // - Offscreen Loop 2 (s in [0.68, 0.70]): transition 0.5 -> 1.0
  // - Crossing 3 (s in [0.70, 1.00]): value 1.0
  let cdVal = 0.0;
  if (s < 0.32) {
    cdVal = 0.0;
  } else if (s <= 0.35) {
    cdVal = (s - 0.32) / (0.35 - 0.32) * 0.5;
  } else if (s < 0.68) {
    cdVal = 0.5;
  } else if (s <= 0.70) {
    cdVal = 0.5 + (s - 0.68) / (0.70 - 0.68) * 0.5;
  } else {
    cdVal = 1.0;
  }

  // Vertex 2*i: right edge
  cpArray[i * 6 + 0] = pt.x;
  cpArray[i * 6 + 1] = pt.y;
  cpArray[i * 6 + 2] = 1.0;

  posArray[i * 6 + 0] = -nx;
  posArray[i * 6 + 1] = -ny;
  posArray[i * 6 + 2] = s;

  cdArray[i * 2 + 0] = cdVal;

  // Vertex 2*i + 1: left edge
  cpArray[i * 6 + 3] = pt.x;
  cpArray[i * 6 + 4] = pt.y;
  cpArray[i * 6 + 5] = 0.0;

  posArray[i * 6 + 3] = nx;
  posArray[i * 6 + 4] = ny;
  posArray[i * 6 + 5] = s;

  cdArray[i * 2 + 1] = cdVal;

  if (i < numSplinePoints - 1) {
    const v0 = i * 2;
    const v1 = i * 2 + 1;
    const v2 = (i + 1) * 2;
    const v3 = (i + 1) * 2 + 1;

    // Exact original winding order: [v0, v3, v1, v3, v0, v2]
    indices[i * 6 + 0] = v0;
    indices[i * 6 + 1] = v3;
    indices[i * 6 + 2] = v1;
    indices[i * 6 + 3] = v3;
    indices[i * 6 + 4] = v0;
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
while ((4 + Buffer.byteLength(headerJson, 'utf8')) % 4 !== 0) {
  headerJson += ' ';
}

const headerBuf = Buffer.from(headerJson, 'utf8');

const cpRaw = new Int16Array(cpArray.length);
for (let i = 0; i < cpArray.length; i += 3) {
  for (let c = 0; c < 3; c++) {
    const val = cpArray[i + c];
    const p = cpPacked[c];
    const norm = Math.max(0, Math.min(1, (val - p.from) / p.delta));
    cpRaw[i + c] = Math.round(norm * 65535) - 32768;
  }
}

const posRaw = new Uint16Array(posArray.length);
for (let i = 0; i < posArray.length; i += 3) {
  for (let c = 0; c < 3; c++) {
    const val = posArray[i + c];
    const p = posPacked[c];
    const norm = Math.max(0, Math.min(1, (val - p.from) / p.delta));
    posRaw[i + c] = Math.round(norm * 65535);
  }
}

const cdRaw = new Uint8Array(cdArray.length);
for (let i = 0; i < cdArray.length; i++) {
  const val = cdArray[i];
  const p = cdPacked[0];
  const norm = Math.max(0, Math.min(1, (val - p.from) / p.delta));
  cdRaw[i] = Math.round(norm * 255);
}

const totalByteLength = 4 + headerBuf.length +
  cpRaw.byteLength +
  indices.byteLength +
  posRaw.byteLength +
  cdRaw.byteLength;

const outBuf = Buffer.alloc(totalByteLength);
let offset = 0;
outBuf.writeUInt32LE(headerBuf.length, offset); offset += 4;
headerBuf.copy(outBuf, offset); offset += headerBuf.length;
Buffer.from(cpRaw.buffer).copy(outBuf, offset); offset += cpRaw.byteLength;
Buffer.from(indices.buffer).copy(outBuf, offset); offset += indices.byteLength;
Buffer.from(posRaw.buffer).copy(outBuf, offset); offset += posRaw.byteLength;
Buffer.from(cdRaw.buffer).copy(outBuf, offset); offset += cdRaw.byteLength;

fs.writeFileSync('assets/models/lines/line_reel.buf', outBuf);
fs.writeFileSync('dist/assets/models/lines/line_reel.buf', outBuf);
console.log(`Saved line_reel.buf (${outBuf.length} bytes, ${numVertices} vertices)`);

console.log('=== 3. PATCHING HOISTED JAVASCRIPT ===');
function patchHoisted(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. LINES_DATA_LIST[0] with scrollToRatioFactors: [0.0, 3.2]
  const listIdx = content.indexOf('LINES_DATA_LIST=[');
  const reelStart = content.indexOf('{fileName:"line_reel"', listIdx);
  const reelEnd = content.indexOf(',{fileName:"line_goal"', reelStart);
  const boxMinY = (minY - 0.1).toFixed(4);
  const boxMaxY = (maxY + 0.1).toFixed(4);
  const boxMinX = (minX - 0.1).toFixed(4);
  const boxMaxX = (maxX + 0.1).toFixed(4);

  // Early scroll trigger: scrollToRatioFactors: [0.0, 3.2]
  const newLineData = `{fileName:"line_reel",aoThreshold:.555,margin:{x:-0.02,y:-0.65},scrollToRatioFactors:[0.0,3.2],boxMin:new Vector3(${boxMinX},${boxMinY},0),boxMax:new Vector3(${boxMaxX},${boxMaxY},0),color0:"#00f0ff",color1:"#1d35ff"}`;
  content = content.slice(0, reelStart) + newLineData + content.slice(reelEnd);

  // 2. Early scroll trigger in Line.update:
  // Starts immediately upon the very first scroll pixel from hero!
  const aCalcTargetOld = 'let n=this.radius*math.fit(properties.viewportWidth,540,1920,1.85,1),a=math.saturate(-(t.screenY-this.lineData.scrollToRatioFactors[0]*properties.viewportHeight)/(this.lineData.scrollToRatioFactors[1]*properties.viewportHeight));a=ease.quadInOut(a);';
  const aCalcReplacement = 'let n=this.radius*math.fit(properties.viewportWidth,540,1920,1.85,1),a=this.lineId===0?math.saturate((scrollManager.scrollPixel-this.lineData.scrollToRatioFactors[0]*properties.viewportHeight)/(this.lineData.scrollToRatioFactors[1]*properties.viewportHeight)):math.saturate(-(t.screenY-this.lineData.scrollToRatioFactors[0]*properties.viewportHeight)/(this.lineData.scrollToRatioFactors[1]*properties.viewportHeight));a=ease.quadInOut(a);';
  if (content.includes(aCalcTargetOld)) {
    content = content.replace(aCalcTargetOld, aCalcReplacement);
  }

  // 3. Line radius: 0.0105
  const classLineIdx = content.indexOf('class Line{');
  const radIdx = content.indexOf('radius=', classLineIdx);
  const radEnd = content.indexOf(';', radIdx);
  content = content.slice(0, radIdx) + 'radius=0.0105' + content.slice(radEnd);

  // 4. vert$j with responsive aspect scaling + aerodynamic taper + offscreen thickness modulation
  const vertStart = content.indexOf('vert$j=`#define GLSLIFY 1');
  const vertEnd = content.indexOf('`', vertStart + 15);
  const newVert = `vert$j=\`#define GLSLIFY 1
attribute vec3 CP;attribute float Cd;varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_scrollY;uniform vec2 u_viewportResolution;uniform vec2 u_aspect;uniform vec2 u_margin;uniform float u_radius;uniform float u_showRatio;void main(){float sx=(u_viewportResolution.x/length(u_viewportResolution))/0.87157;vec2 cpx=vec2(CP.x*sx,CP.y);float taperLen=0.048;float distToEnd=clamp((u_showRatio-position.z)/taperLen,0.0,1.0);float taper=smoothstep(0.0,1.0,distToEnd);float t1=smoothstep(0.32,0.35,position.z);float t2=smoothstep(0.68,0.70,position.z);float thickness=mix(mix(1.0,1.25,t1),1.10,t2);vec3 pos=vec3(cpx+position.xy*(u_radius*thickness)*taper,0.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_cd=Cd;v_lineRatio=position.z;v_s=CP.z;}\``;
  content = content.slice(0, vertStart) + newVert + content.slice(vertEnd + 1);

  // 5. Disable this.circle
  const addCircle = 'this.innerContainer.add(this.circle)';
  if (content.indexOf(addCircle) !== -1 && !content.includes('this.innerContainer.add(this.circle),this.circle.visible=!1')) {
    content = content.replace(addCircle, 'this.innerContainer.add(this.circle),this.circle.visible=!1');
  }

  // 6. Frag shader multi-stage chromatic transitions + 3D cylindrical lighting with specular
  const fragStart = content.indexOf('frag$m=`#define GLSLIFY 1');
  const fragEnd = content.indexOf('`', fragStart + 15);
  const newFrag = `frag$m=\`#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform float u_hideRatio;uniform vec3 u_colorBg;uniform vec3 u_color0;uniform vec3 u_color1;uniform float u_aoThreshold;float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}void main(){float ao=0.9+0.1*v_cd;float aoRatio=linearStep(u_aoThreshold-0.02,u_aoThreshold+0.02,u_showRatio);if(step(u_showRatio,v_lineRatio)>0.5)discard;vec3 seg1Base=mix(vec3(0.0,0.941,1.0),vec3(0.114,0.208,1.0),clamp(v_lineRatio/0.32,0.0,1.0));vec3 seg1Rim=vec3(0.0,0.941,1.0);vec3 seg1Spec=vec3(0.88,0.96,1.0);vec3 seg2Base=mix(vec3(1.0,0.0,0.333),vec3(1.0,0.20,0.0),clamp((v_lineRatio-0.35)/0.33,0.0,1.0));vec3 seg2Rim=vec3(1.0,0.09,0.267);vec3 seg2Spec=vec3(1.0,0.82,0.88);vec3 seg3Base=mix(vec3(0.0,1.0,0.533),vec3(0.0,0.898,0.459),clamp((v_lineRatio-0.70)/0.30,0.0,1.0));vec3 seg3Rim=vec3(0.0,1.0,0.533);vec3 seg3Spec=vec3(0.85,1.0,0.92);float m1=smoothstep(0.32,0.35,v_lineRatio);float m2=smoothstep(0.68,0.70,v_lineRatio);vec3 baseColor=mix(mix(seg1Base,seg2Base,m1),seg3Base,m2);vec3 rimColor=mix(mix(seg1Rim,seg2Rim,m1),seg3Rim,m2);vec3 specColor=mix(mix(seg1Spec,seg2Spec,m1),seg3Spec,m2);float t=(v_s-0.5)*2.0;float nz=sqrt(max(0.0,1.0-t*t));float diff=0.56+0.44*nz;vec3 n=vec3(t,0.0,nz);vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),26.0);float rim=pow(1.0-nz,3.0);vec3 rimGlow=rimColor*(rim*0.38);float aoFactor=min(1.0,ao+1.0-aoRatio);vec3 shaded=(baseColor*diff+rimGlow)*aoFactor+specColor*(spec*0.42);gl_FragColor.rgb=shaded;float alpha=abs(v_s-0.5);float edgeAlpha=linearStep(0.5,0.5-fwidth(alpha),alpha);float tipAlpha=smoothstep(0.0,0.003,u_showRatio-v_lineRatio);gl_FragColor.a=edgeAlpha*tipAlpha;}\``;
  content = content.slice(0, fragStart) + newFrag + content.slice(fragEnd + 1);

  // 7. Double side in Line.init()
  if (!content.includes('vertexShader:vert$j,fragmentShader:frag$m,depthTest:!1,transparent:!0,side:2')) {
    content = content.replace(
      'vertexShader:vert$j,fragmentShader:frag$m,depthTest:!1,transparent:!0',
      'vertexShader:vert$j,fragmentShader:frag$m,depthTest:!1,transparent:!0,side:2'
    );
  }

  // 8. Container visible check
  const visTarget = 'this.container.visible=_box.max.y>-properties.viewportHeight&&_box.min.y<0)';
  const visReplacement = 'this.container.visible=this.lineId===0?(a>0&&a<=1.):(_box.max.y>-properties.viewportHeight&&_box.min.y<0))';
  if (content.includes(visTarget)) {
    content = content.replace(visTarget, visReplacement);
  }

  // 9. Responsive Mobile Y scale in Line.update
  const innerPosRegex = /this\.innerContainer\.position\.y=\([^)]+\)\*u-l,this\.innerContainer\.scale\.x=c,this\.innerContainer\.scale\.y=\([^)]+\)|this\.innerContainer\.position\.y=this\.lineData\.margin\.y\*u-l,this\.innerContainer\.scale\.x=c,this\.innerContainer\.scale\.y=u|this\.innerContainer\.position\.y=\(properties\.viewportWidth<768\?-0\.32:this\.lineData\.margin\.y\)\*\(properties\.viewportWidth<768\?u\*2\.2:u\)-l,this\.innerContainer\.scale\.x=c,this\.innerContainer\.scale\.y=\(properties\.viewportWidth<768\?u\*2\.2:u\)/;
  const innerPosReplacement = 'this.innerContainer.position.y=(properties.viewportWidth<768?-0.15:this.lineData.margin.y)*u-l,this.innerContainer.scale.x=c,this.innerContainer.scale.y=(properties.viewportWidth<768?u*1.35:u)';
  if (innerPosRegex.test(content)) {
    content = content.replace(innerPosRegex, innerPosReplacement);
  }

  esbuild.transformSync(content, { loader: 'js' });
  fs.writeFileSync(filePath, content, 'utf8');
  const now = new Date();
  fs.utimesSync(filePath, now, now);
  console.log(`[${filePath}] Successfully saved and touched.`);
}

patchHoisted('_astro/hoisted.CUO_IjfL.js');
patchHoisted('dist/_astro/hoisted.CUO_IjfL.js');

console.log('=== 45-DEGREE ZIG-ZAG LINE DEPLOYED SUCCESSFULLY ===');
