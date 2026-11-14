const fs = require('fs');
const path = require('path');
const three = require('three');
const esbuild = require('esbuild');

console.log('=== BUILDING ULTIMATE TUBE COMPLETE ===');

// 1. Waypoints carefully choreographed through ALL sections:
// Center is X = 0.0. Max |X| <= 0.15 (stays within mobile screen 390px, hypot 930 => max 140px, safe screen half-width 195px)
// Total Y span: -1.05 to -7.45 (matches document Y with aspectY * hypot ≈ 950)
const waypoints = [
  // 1. REEL ENTRY & HEADLINE ARCH (s: 0.00 to 0.16)
  { x: -0.15, y: -1.05, name: 'Reel Top-Left Entry' },
  { x: -0.05, y: -1.28, name: 'Reel Sweeping Arch' },
  { x:  0.08, y: -1.52, name: 'Reel Center Sweep under Headline' },
  { x:  0.15, y: -1.76, name: 'Reel Orbit Right Edge' },
  { x:  0.02, y: -2.00, name: 'Reel Exit Swoop' },

  // 2. ACTIVE INITIATIVES HEADER & CARD 1 (FLAGSHIP) (s: 0.16 to 0.36)
  { x: -0.14, y: -2.28, name: 'Initiatives Header & Card 1 Entry' },
  { x: -0.02, y: -2.62, name: 'Card 1 (AI Art Exhibition Flagship) Center Crossing' },
  { x:  0.12, y: -2.96, name: 'Card 1 Bottom to Card 2 Gap Sweep' },

  // 3. CARDS 2 & 3 (MEETUP & SNS) (s: 0.36 to 0.48)
  { x:  0.00, y: -3.28, name: 'Row 1 Horizontal Gap (Cards 2 & 3 Center Crossing)' },
  { x: -0.12, y: -3.60, name: 'Card 2/3 Left Margin Boulevard' },

  // 4. CARDS 4 & 5 (BOT & MEDICAL) (s: 0.48 to 0.62)
  { x: -0.14, y: -3.95, name: 'Card 4 (Chatbot) Left Weave' },
  { x:  0.02, y: -4.30, name: 'Row 2 Horizontal Gap Sweep (Cards 4 & 5)' },

  // 5. CARD 6 (DOCS) & OPEN RIGHT AREA (s: 0.62 to 0.72)
  { x:  0.14, y: -4.68, name: 'Open Right Area beside Card 6' },
  { x:  0.04, y: -5.02, name: 'Card 6 Bottom Curve Approaching CTA' },

  // 6. BLUE CTA BUTTON (#home-featured-cta) (s: 0.72 to 0.82)
  { x: -0.10, y: -5.28, name: 'Blue CTA Button Left Orbit' },
  { x:  0.00, y: -5.46, name: 'Blue CTA Button Sweep Directly Behind' },
  { x:  0.10, y: -5.64, name: 'Blue CTA Button Right Orbit' },
  { x:  0.02, y: -5.82, name: 'Exit toward Members Section' },

  // 7. MEMBERS SECTION (#home-members) (s: 0.82 to 0.95)
  // Passing BEHIND the cards (.member-card has z-index: 2, canvas is z-index: 0)
  { x: -0.11, y: -6.05, name: 'Passing BEHIND Member Card 1 (Kosehira)' },
  { x:  0.00, y: -6.30, name: 'Passing BEHIND Central Gutter between Kosehira & Ito' },
  { x:  0.12, y: -6.55, name: 'Passing BEHIND Member Card 2 (Ito)' },
  { x: -0.04, y: -6.80, name: 'Passing BEHIND Member Card 3 (Sakai)' },
  { x: -0.12, y: -7.05, name: 'Passing BEHIND Member Card 4 (Okamoto)' },

  // 8. GOAL & OUTRO FLOURISH (s: 0.95 to 1.00)
  { x:  0.02, y: -7.30, name: 'Goal Entry Center Weave' },
  { x:  0.00, y: -7.45, name: 'Goal Outro Landing' }
];

console.log(`Choreographed waypoints: ${waypoints.length}`);

const vectors = waypoints.map(w => new three.Vector3(w.x, w.y, 0));
const curve = new three.CatmullRomCurve3(vectors, false, 'centripetal', 0.5);

const numPoints = 1400;
const numVertices = numPoints * 2; // 2800
const numIndices = (numPoints - 1) * 6; // 8394

const points = curve.getSpacedPoints(numPoints - 1);
const cpArray = new Float32Array(numVertices * 3);
const posArray = new Float32Array(numVertices * 3);
const cdArray = new Float32Array(numVertices);
const indices = new Uint16Array(numIndices);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

for (let i = 0; i < numPoints; i++) {
  const pt = points[i];
  const s = i / (numPoints - 1);

  if (pt.x < minX) minX = pt.x;
  if (pt.x > maxX) maxX = pt.x;
  if (pt.y < minY) minY = pt.y;
  if (pt.y > maxY) maxY = pt.y;

  let tx, ty;
  if (i === 0) {
    tx = points[1].x - points[0].x;
    ty = points[1].y - points[0].y;
  } else if (i === numPoints - 1) {
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

  const v0 = i * 2;
  const v1 = i * 2 + 1;

  // Right vertex
  cpArray[v0 * 3 + 0] = pt.x;
  cpArray[v0 * 3 + 1] = pt.y;
  cpArray[v0 * 3 + 2] = 1.0;

  posArray[v0 * 3 + 0] = -nx;
  posArray[v0 * 3 + 1] = -ny;
  posArray[v0 * 3 + 2] = s;

  cdArray[v0] = s;

  // Left vertex
  cpArray[v1 * 3 + 0] = pt.x;
  cpArray[v1 * 3 + 1] = pt.y;
  cpArray[v1 * 3 + 2] = 0.0;

  posArray[v1 * 3 + 0] = nx;
  posArray[v1 * 3 + 1] = ny;
  posArray[v1 * 3 + 2] = s;

  cdArray[v1] = s;

  if (i < numPoints - 1) {
    indices[i * 6 + 0] = v0;
    indices[i * 6 + 1] = v1;
    indices[i * 6 + 2] = v0 + 2;
    indices[i * 6 + 3] = v1;
    indices[i * 6 + 4] = v1 + 2;
    indices[i * 6 + 5] = v0 + 2;
  }
}

console.log(`Bounds: X [${minX.toFixed(4)}, ${maxX.toFixed(4)}], Y [${minY.toFixed(4)}, ${maxY.toFixed(4)}]`);

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
    { id: 'Cd', needsPack: true, componentSize: 1, storageType: 'Uint16Array', packedComponents: cdPacked }
  ]
};

let headerJson = JSON.stringify(header);
while ((4 + Buffer.byteLength(headerJson, 'utf8')) % 4 !== 0) {
  headerJson += ' ';
}
const headerBuf = Buffer.from(headerJson, 'utf8');
console.log(`Padded header byteLength: ${headerBuf.length}, start offset of data: ${4 + headerBuf.length}`);

// Pack CP: Int16Array [-32767, 32767]
const cpRaw = new Int16Array(cpArray.length);
for (let i = 0; i < numVertices; i++) {
  const normX = (cpArray[i * 3 + 0] - minX) / (maxX - minX);
  cpRaw[i * 3 + 0] = Math.round(normX * 65534 - 32767);
  const normY = (cpArray[i * 3 + 1] - minY) / (maxY - minY);
  cpRaw[i * 3 + 1] = Math.round(normY * 65534 - 32767);
  cpRaw[i * 3 + 2] = Math.round(cpArray[i * 3 + 2] * 65534 - 32767);
}

// Pack pos: Uint16Array [0, 65535]
const posRaw = new Uint16Array(posArray.length);
for (let i = 0; i < numVertices; i++) {
  const normX = (posArray[i * 3 + 0] - (-1)) / 2;
  posRaw[i * 3 + 0] = Math.round(normX * 65535);
  const normY = (posArray[i * 3 + 1] - (-1)) / 2;
  posRaw[i * 3 + 1] = Math.round(normY * 65535);
  const normZ = posArray[i * 3 + 2];
  posRaw[i * 3 + 2] = Math.round(normZ * 65535);
}

// Pack cd: Uint16Array [0, 65535]
const cdRaw = new Uint16Array(cdArray.length);
for (let i = 0; i < numVertices; i++) {
  cdRaw[i] = Math.round(cdArray[i] * 65535);
}

const totalByteLength = 4 + headerBuf.length + cpRaw.byteLength + indices.byteLength + posRaw.byteLength + cdRaw.byteLength;
const outBuf = Buffer.alloc(totalByteLength);
let offset = 0;
outBuf.writeUInt32LE(headerBuf.length, offset); offset += 4;
headerBuf.copy(outBuf, offset); offset += headerBuf.length;
Buffer.from(cpRaw.buffer).copy(outBuf, offset); offset += cpRaw.byteLength;
Buffer.from(indices.buffer).copy(outBuf, offset); offset += indices.byteLength;
Buffer.from(posRaw.buffer).copy(outBuf, offset); offset += posRaw.byteLength;
Buffer.from(cdRaw.buffer).copy(outBuf, offset); offset += cdRaw.byteLength;

fs.writeFileSync('assets/models/lines/line_reel.buf', outBuf);
if (fs.existsSync('dist/assets/models/lines/line_reel.buf')) {
  fs.writeFileSync('dist/assets/models/lines/line_reel.buf', outBuf);
}
console.log(`Saved line_reel.buf (${outBuf.length} bytes, ${numVertices} vertices)`);

// 2. SHADERS DEFINITION
// C2-continuous thickness strictly in [0.92, 1.22]
const vertShaderBody = `#define GLSLIFY 1
attribute vec3 CP;attribute float Cd;varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_scrollY;uniform vec2 u_viewportResolution;uniform vec2 u_aspect;uniform vec2 u_margin;uniform float u_radius;uniform float u_showRatio;float getDynamicThick(float r){float t=clamp(r,0.0,1.0);float swell=0.08*sin(t*3.14159265);float wave=0.04*sin(t*18.8495559);return clamp(1.02+swell+wave,0.92,1.22);}void main(){float strokeThick=getDynamicThick(position.z);float aspectX=mix(1.0,1.45,smoothstep(540.0,1400.0,u_viewportResolution.x));float aspectY=mix(1.0,0.44,smoothstep(540.0,1400.0,u_viewportResolution.x));vec3 pos=vec3(vec2(CP.x*aspectX,CP.y*aspectY)+position.xy*(u_radius*strokeThick),0.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_cd=Cd;v_lineRatio=position.z;v_s=CP.z;}`;

// Dynamic 7-stage primary color progression:
// Cyan -> Blue -> Red -> Orange -> Yellow -> Green -> Indigo -> Purple -> Magenta
const fragColorFunc = `vec3 getTubeColor(float t){t=clamp(t,0.0,1.0);vec3 c_cyan=vec3(0.00,0.88,1.00);vec3 c_blue=vec3(0.06,0.28,0.98);vec3 c_red=vec3(0.98,0.08,0.20);vec3 c_orange=vec3(1.00,0.42,0.04);vec3 c_yellow=vec3(1.00,0.85,0.00);vec3 c_green=vec3(0.00,0.88,0.36);vec3 c_indigo=vec3(0.08,0.46,1.00);vec3 c_purple=vec3(0.68,0.10,1.00);vec3 c_magenta=vec3(1.00,0.08,0.60);if(t<0.16){float u=t/0.16;return mix(c_cyan,c_blue,smoothstep(0.0,1.0,u));}else if(t<0.36){float u=(t-0.16)/0.20;return mix(c_blue,mix(c_red,c_orange,smoothstep(0.4,1.0,u)),smoothstep(0.0,0.4,u));}else if(t<0.55){float u=(t-0.36)/0.19;return mix(c_orange,c_yellow,smoothstep(0.0,1.0,u));}else if(t<0.72){float u=(t-0.55)/0.17;return mix(c_yellow,c_green,smoothstep(0.0,1.0,u));}else if(t<0.82){float u=(t-0.72)/0.10;return mix(c_green,c_indigo,smoothstep(0.0,1.0,u));}else if(t<0.94){float u=(t-0.82)/0.12;return mix(c_indigo,c_purple,smoothstep(0.0,1.0,u));}else{float u=(t-0.94)/0.06;return mix(c_purple,c_magenta,smoothstep(0.0,1.0,u));}}`;

const fragShaderBody = `#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform vec3 u_color0;${fragColorFunc}void main(){if(step(u_showRatio,v_lineRatio)>0.5)discard;vec3 baseColor=getTubeColor(v_lineRatio);float t=(v_s-0.5)*2.0;float nz=sqrt(max(0.0,1.0-t*t));vec3 n=vec3(t,0.0,nz);float diff=0.58+0.42*nz;vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),24.0);float rim=pow(1.0-nz,3.0);vec3 finalColor=baseColor*diff+baseColor*(rim*0.35)+vec3(1.0)*(spec*0.35);float distFromCenter=abs(v_s-0.5);float edgeAlpha=1.0-smoothstep(0.5-fwidth(distFromCenter),0.5,distFromCenter);gl_FragColor=vec4(finalColor,edgeAlpha);}`;

const lineEndFragBody = `#define GLSLIFY 1
uniform float u_cd;uniform float u_lineRatio;varying vec2 v_uv;${fragColorFunc}void main(){vec2 p=(v_uv-0.5)*2.0;float d2=dot(p,p);if(d2>1.0)discard;float d=sqrt(d2);float nz=sqrt(max(0.0,1.0-d2));vec3 n=vec3(p.x,p.y,nz);vec3 baseColor=getTubeColor(u_lineRatio);float diff=0.58+0.42*nz;vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),24.0);float rim=pow(1.0-nz,3.0);vec3 finalColor=baseColor*diff+baseColor*(rim*0.35)+vec3(1.0)*(spec*0.35);float edgeAlpha=1.0-smoothstep(1.0-fwidth(d),1.0,d);gl_FragColor=vec4(finalColor,edgeAlpha);}`;

// 3. Patching JS files
function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  console.log(`\nPatching ${filePath}...`);
  let code = fs.readFileSync(filePath, 'utf8');

  // Replace vert$j
  const vVar = 'vert' + String.fromCharCode(36) + 'j=';
  const vStart = code.indexOf(vVar);
  if (vStart === -1) {
    console.error('vert$j variable not found!');
    process.exit(1);
  }
  const vBacktick1 = code.indexOf('`', vStart);
  const vBacktick2 = code.indexOf('`', vBacktick1 + 1);
  code = code.slice(0, vBacktick1 + 1) + vertShaderBody + code.slice(vBacktick2);

  // Replace frag$m
  const fVar = 'frag' + String.fromCharCode(36) + 'm=';
  const fStart = code.indexOf(fVar);
  if (fStart === -1) {
    console.error('frag$m variable not found!');
    process.exit(1);
  }
  const fBacktick1 = code.indexOf('`', fStart);
  const fBacktick2 = code.indexOf('`', fBacktick1 + 1);
  code = code.slice(0, fBacktick1 + 1) + fragShaderBody + code.slice(fBacktick2);

  // Replace lineEndFrag
  const eVar = 'lineEndFrag=';
  const eStart = code.indexOf(eVar);
  if (eStart === -1) {
    console.error('lineEndFrag variable not found!');
    process.exit(1);
  }
  const eBacktick1 = code.indexOf('`', eStart);
  const eBacktick2 = code.indexOf('`', eBacktick1 + 1);
  code = code.slice(0, eBacktick1 + 1) + lineEndFragBody + code.slice(eBacktick2);

  // Update LINES_DATA_LIST[0] boxMin & boxMax
  const linesListIdx = code.indexOf('LINES_DATA_LIST=[');
  if (linesListIdx !== -1) {
    const boxMinRegex = /boxMin:new Vector3\([^)]+\),boxMax:new Vector3\([^)]+\)/;
    code = code.replace(boxMinRegex, 'boxMin:new Vector3(-0.4000,-8.0000,-0.5000),boxMax:new Vector3(0.4000,0.5000,0.5000)');
  }

  // Set line radius: 0.016
  const classLineIdx = code.indexOf('class Line{');
  const radIdx = code.indexOf('radius=', classLineIdx);
  const radEnd = code.indexOf(';', radIdx);
  code = code.slice(0, radIdx) + 'radius=0.016' + code.slice(radEnd);

  // Ensure preInit assigns this.mesh.geometry upon onLoad
  const preInitIdx = code.indexOf('preInit(){', classLineIdx);
  const onLoadIdx = code.indexOf('onLoad:e=>{', preInitIdx);
  if (onLoadIdx !== -1) {
    const geomAssignIdx = code.indexOf('this.geometry=e;', onLoadIdx);
    if (geomAssignIdx !== -1 && !code.substring(geomAssignIdx, geomAssignIdx + 45).includes('this.mesh')) {
      code = code.slice(0, geomAssignIdx + 16) + 'if(this.mesh)this.mesh.geometry=e;' + code.slice(geomAssignIdx + 16);
    }
  }

  // Replace update() inside class Line
  const updateIdx = code.indexOf('update(e,t,r=0){', classLineIdx);
  const endUpdateNeedle = 'this.circle.material.uniforms.u_mixRatio.value=w}}';
  const endUpdateIdx = code.indexOf(endUpdateNeedle, updateIdx);
  if (updateIdx === -1 || endUpdateIdx === -1) {
    console.error('update method boundary not found!');
    process.exit(1);
  }

  const newUpdateMethod = `update(e,t,r=0){if(this.lineId===0)window.__line0=this;let n=this.radius*math.fit(properties.viewportWidth,540,1920,1.45,1.0),a;const s=scrollManager.scrollPixel,isMob=properties.viewportWidth<768;if(this.lineId===0){if(isMob){const mK=[[500,0.0],[1000,0.16],[1900,0.36],[2600,0.48],[3200,0.62],[3650,0.72],[4000,0.82],[5000,0.95],[5800,1.0]];if(s<=mK[0][0])a=0;else if(s>=mK[mK.length-1][0])a=1.0;else{for(let i=0;i<mK.length-1;i++){if(s>=mK[i][0]&&s<mK[i+1][0]){const tr=(s-mK[i][0])/(mK[i+1][0]-mK[i][0]);const st=tr*tr*(3.0-2.0*tr);a=mK[i][1]+(mK[i+1][1]-mK[i][1])*st;break;}}}}else{const dK=[[700,0.0],[1400,0.16],[2500,0.36],[3400,0.48],[4200,0.62],[4800,0.72],[5350,0.82],[6200,0.95],[6800,1.0]];if(s<=dK[0][0])a=0;else if(s>=dK[dK.length-1][0])a=1.0;else{for(let i=0;i<dK.length-1;i++){if(s>=dK[i][0]&&s<dK[i+1][0]){const tr=(s-dK[i][0])/(dK[i+1][0]-dK[i][0]);const st=tr*tr*(3.0-2.0*tr);a=dK[i][1]+(dK[i+1][1]-dK[i][1])*st;break;}}}}}else{a=ease.quadInOut(math.saturate(-(t.screenY-this.lineData.scrollToRatioFactors[0]*properties.viewportHeight)/(this.lineData.scrollToRatioFactors[1]*properties.viewportHeight)));}const l=t.screenY+r,hypot=Math.hypot(properties.viewportWidth,properties.viewportHeight);let c=hypot,u=hypot;this.mesh.material.uniforms.u_showRatio.value=math.saturate(a),this.mesh.material.uniforms.u_scrollY.value=-l,this.mesh.material.uniforms.u_colorBg.value.copy(properties.bgColor),this.mesh.material.uniforms.u_radius.value=n;this.innerContainer.position.x=this.lineId===0?(properties.viewportWidth*0.5):(this.lineData.margin.x*c);this.innerContainer.position.y=this.lineId===0?s:(this.lineData.margin.y*u-l);this.innerContainer.scale.x=c;this.innerContainer.scale.y=u;this.container.visible=!1;this.container.parent&&(this.container.parent.updateMatrixWorld(!0),_box.min.copy(this.lineData.boxMin),_box.max.copy(this.lineData.boxMax),_box.applyMatrix4(this.innerContainer.matrixWorld),this.container.visible=this.lineId===0?(s>=(isMob?450:650)&&s<=7600):(_box.max.y>-properties.viewportHeight&&_box.min.y<0));if(this.mesh&&this.geometry&&this.mesh.geometry!==this.geometry){this.mesh.geometry=this.geometry;}if(!this.geometry||!this.geometry.attributes||!this.geometry.attributes.CP||!this.geometry.attributes.position||!this.lineRatioArray){this.container&&(this.container.visible=!1);return;}const{array:f,count:p}=this.geometry.attributes.CP,{array:g}=this.geometry.attributes.position;let v=0,_=0;for(let R=0;R<p;R++)a>=this.lineRatioArray[R]&&(v=R,R===p-1?_=0:_=(a-this.lineRatioArray[R])/(this.lineRatioArray[R+1]-this.lineRatioArray[R]));const T=v,M=Math.min(v+1,p-1);_v0$2.fromArray(f,v*3),_v1$5.fromArray(f,Math.min(p-1,v+1)*3),_v0$2.lerp(_v1$5,_);const aspectX=properties.viewportWidth>=1400?1.45:(properties.viewportWidth<=540?1.0:1.0+0.45*(properties.viewportWidth-540)/(1400-540));const aspectY=properties.viewportWidth>=1400?0.44:(properties.viewportWidth<=540?1.0:1.0-0.56*(properties.viewportWidth-540)/(1400-540));const strokeThick=Math.max(0.92,Math.min(1.22,1.02+0.08*Math.sin(a*Math.PI)+0.04*Math.sin(a*18.8495559)));this.circle.position.set(_v0$2.x*aspectX,_v0$2.y*aspectY,_v0$2.z);this.circle.scale.set(n*strokeThick,n*strokeThick,1);this.circle.material.uniforms.u_lineRatio.value=a;this.circle.material.uniforms.u_cd.value=a;this.circle.visible=(this.lineId===0?(s>=(isMob?450:650)&&a>0.001&&a<0.999):(a>0.001&&a<0.999));let w=math.lerp(g[T*3+2],g[M*3+2],_);w=1-Math.pow(1-math.clamp(w,0,1),2),this.circle.material.uniforms.u_mixRatio.value=w}}`;

  code = code.slice(0, updateIdx) + newUpdateMethod + code.slice(endUpdateIdx + endUpdateNeedle.length);

  // Validate syntax
  console.log('Validating with esbuild...');
  esbuild.transformSync(code, { loader: 'js' });
  console.log('Validation PASSED!');

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Successfully saved ${filePath}`);
}

patchFile('_astro/hoisted.CUO_IjfL.js');
patchFile('dist/_astro/hoisted.CUO_IjfL.js');

console.log('=== BUILD COMPLETE ===');
