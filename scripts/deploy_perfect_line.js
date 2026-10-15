const fs = require('fs');
const path = require('path');
const three = require('three');
const esbuild = require('esbuild');

console.log('=== 1. GENERATING MASTERPIECE S-CURVE TRAJECTORY ===');

// Masterpiece control points:
const controlPoints = [
  new three.Vector3(-0.02,  0.75, 0), // Enters gracefully from top-left
  new three.Vector3( 0.35,  0.50, 0), // Arches gently above/around headline
  new three.Vector3( 0.75,  0.18, 0), // Sweeps down right side of reel
  new three.Vector3( 0.65, -0.22, 0), // Curves under text block
  new three.Vector3( 0.28, -0.60, 0), // Glides under video/button
  new three.Vector3( 0.15, -1.00, 0), // Sweeps toward Active Initiatives header
  new three.Vector3( 0.55, -1.45, 0), // Weaves between cards
  new three.Vector3( 0.78, -1.90, 0), // Graceful curve along initiative cards
  new three.Vector3( 0.40, -2.35, 0)  // Outro flourish
];

const curve = new three.CatmullRomCurve3(controlPoints, false, 'centripetal', 0.5);

const numSplinePoints = 320;
const numVertices = numSplinePoints * 2; // 640
const numIndices = (numSplinePoints - 1) * 6; // 1914

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

  // Vertex 2*i: right edge
  cpArray[i * 6 + 0] = pt.x;
  cpArray[i * 6 + 1] = pt.y;
  cpArray[i * 6 + 2] = 1.0;

  posArray[i * 6 + 0] = -nx;
  posArray[i * 6 + 1] = -ny;
  posArray[i * 6 + 2] = s;

  cdArray[i * 2 + 0] = 1.0;

  // Vertex 2*i + 1: left edge
  cpArray[i * 6 + 3] = pt.x;
  cpArray[i * 6 + 4] = pt.y;
  cpArray[i * 6 + 5] = 0.0;

  posArray[i * 6 + 3] = nx;
  posArray[i * 6 + 4] = ny;
  posArray[i * 6 + 5] = s;

  cdArray[i * 2 + 1] = 1.0;

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
for (let i = 0; i < cdArray.length; i++) cdRaw[i] = 255;

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
console.log(`Saved line_reel.buf (${outBuf.length} bytes)`);

console.log('=== 3. PATCHING HOISTED JAVASCRIPT ===');
function patchHoisted(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. LINES_DATA_LIST[0]
  const listIdx = content.indexOf('LINES_DATA_LIST=[');
  const reelStart = content.indexOf('{fileName:"line_reel"', listIdx);
  const reelEnd = content.indexOf(',{fileName:"line_goal"', reelStart);
  const boxMinY = (minY - 0.1).toFixed(4);
  const boxMaxY = (maxY + 0.1).toFixed(4);
  const boxMinX = (minX - 0.1).toFixed(4);
  const boxMaxX = (maxX + 0.1).toFixed(4);

  // margin: {x: -0.02, y: -0.65}, scrollToRatioFactors: [0.35, 2.8]
  const newLineData = `{fileName:"line_reel",aoThreshold:.555,margin:{x:-0.02,y:-0.65},scrollToRatioFactors:[.35,2.8],boxMin:new Vector3(${boxMinX},${boxMinY},0),boxMax:new Vector3(${boxMaxX},${boxMaxY},0),color0:"#00f0ff",color1:"#1d35ff"}`;
  content = content.slice(0, reelStart) + newLineData + content.slice(reelEnd);

  // 2. Line radius: 0.0105
  const classLineIdx = content.indexOf('class Line{');
  const radIdx = content.indexOf('radius=', classLineIdx);
  const radEnd = content.indexOf(';', radIdx);
  content = content.slice(0, radIdx) + 'radius=0.0105' + content.slice(radEnd);

  // 3. vert$j with responsive aspect scaling + smooth aerodynamic taper
  const vertStart = content.indexOf('vert$j=`#define GLSLIFY 1');
  const vertEnd = content.indexOf('`', vertStart + 15);
  const newVert = `vert$j=\`#define GLSLIFY 1
attribute vec3 CP;attribute float Cd;varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_scrollY;uniform vec2 u_viewportResolution;uniform vec2 u_aspect;uniform vec2 u_margin;uniform float u_radius;uniform float u_showRatio;void main(){float sx=(u_viewportResolution.x/length(u_viewportResolution))/0.87157;vec2 cpx=vec2(CP.x*sx,CP.y);float taperLen=0.048;float distToEnd=clamp((u_showRatio-position.z)/taperLen,0.0,1.0);float taper=smoothstep(0.0,1.0,distToEnd);vec3 pos=vec3(cpx+position.xy*u_radius*taper,0.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_cd=Cd;v_lineRatio=position.z;v_s=CP.z;}\``;
  content = content.slice(0, vertStart) + newVert + content.slice(vertEnd + 1);

  // 4. Disable this.circle
  const addCircle = 'this.innerContainer.add(this.circle)';
  if (content.indexOf(addCircle) !== -1 && !content.includes('this.innerContainer.add(this.circle),this.circle.visible=!1')) {
    content = content.replace(addCircle, 'this.innerContainer.add(this.circle),this.circle.visible=!1');
  }

  // 5. Frag shader smooth tip alpha + 3D cylindrical lighting
  const fragStart = content.indexOf('frag$m=`#define GLSLIFY 1');
  const fragEnd = content.indexOf('`', fragStart + 15);
  const newFrag = `frag$m=\`#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform float u_hideRatio;uniform vec3 u_colorBg;uniform vec3 u_color0;uniform vec3 u_color1;uniform float u_aoThreshold;float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}vec3 hsv2rgb(in vec3 c){vec3 rgb=clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);rgb=rgb*rgb*(3.0-2.0*rgb);return c.z*mix(vec3(1.0),rgb,c.y);}vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)),d/(q.x+e),q.x);}vec3 lerpHSV(in vec3 a,in vec3 b,in float x){float hue=(mod(mod((b.x-a.x),1.)+1.5,1.)-0.5)*x+a.x;return vec3(hue,mix(a.yz,b.yz,x));}void main(){float ao=0.9+0.1*v_cd;float aoRatio=linearStep(u_aoThreshold-0.02,u_aoThreshold+0.02,u_showRatio);if(step(u_showRatio,v_lineRatio)>0.5)discard;float mixRatio=1.0-pow(1.0-clamp(v_lineRatio,0.0,1.0),2.0);vec3 baseColor=hsv2rgb(lerpHSV(rgb2hsv(u_color1),rgb2hsv(u_color0),mixRatio));float t=(v_s-0.5)*2.0;float nz=sqrt(max(0.0,1.0-t*t));float diff=0.58+0.42*nz;vec3 n=vec3(t,0.0,nz);vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),26.0);float rim=pow(1.0-nz,3.0);vec3 rimColor=u_color0*(rim*0.28);float aoFactor=min(1.0,ao+1.0-aoRatio);vec3 shaded=(baseColor*diff+rimColor)*aoFactor+vec3(1.0)*(spec*0.38);gl_FragColor.rgb=shaded;float alpha=abs(v_s-.5);float edgeAlpha=linearStep(0.5,0.5-fwidth(alpha),alpha);float tipAlpha=smoothstep(0.0,0.003,u_showRatio-v_lineRatio);gl_FragColor.a=edgeAlpha*tipAlpha;}\``;
  content = content.slice(0, fragStart) + newFrag + content.slice(fragEnd + 1);

  // 6. Double side in Line.init()
  if (!content.includes('vertexShader:vert$j,fragmentShader:frag$m,depthTest:!1,transparent:!0,side:2')) {
    content = content.replace(
      'vertexShader:vert$j,fragmentShader:frag$m,depthTest:!1,transparent:!0',
      'vertexShader:vert$j,fragmentShader:frag$m,depthTest:!1,transparent:!0,side:2'
    );
  }

  // 7. Container visible check
  const visTarget = 'this.container.visible=_box.max.y>-properties.viewportHeight&&_box.min.y<0)';
  const visReplacement = 'this.container.visible=this.lineId===0?(a>0&&a<=1.):(_box.max.y>-properties.viewportHeight&&_box.min.y<0))';
  if (content.includes(visTarget)) {
    content = content.replace(visTarget, visReplacement);
  }

  // 8. Responsive Mobile Y scale in Line.update
  const innerPosTarget = 'this.innerContainer.position.y=this.lineData.margin.y*u-l,this.innerContainer.scale.x=c,this.innerContainer.scale.y=u';
  const innerPosReplacement = 'this.innerContainer.position.y=(properties.viewportWidth<768?-0.32:this.lineData.margin.y)*(properties.viewportWidth<768?u*2.2:u)-l,this.innerContainer.scale.x=c,this.innerContainer.scale.y=(properties.viewportWidth<768?u*2.2:u)';
  if (content.includes(innerPosTarget)) {
    content = content.replace(innerPosTarget, innerPosReplacement);
  }

  esbuild.transformSync(content, { loader: 'js' });
  fs.writeFileSync(filePath, content, 'utf8');
  const now = new Date();
  fs.utimesSync(filePath, now, now);
  console.log(`[${filePath}] Successfully saved and touched.`);
}

patchHoisted('_astro/hoisted.CUO_IjfL.js');
patchHoisted('dist/_astro/hoisted.CUO_IjfL.js');

console.log('=== MASTERPIECE LINE DEPLOYED ===');
