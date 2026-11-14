const fs = require('fs');
const path = require('path');
const three = require('three');
const esbuild = require('esbuild');

console.log('=== 1. GENERATING VIBRANT CHOREOGRAPHED 3D TRAJECTORY ===');

// Coordinates Choreography:
// 1. Reel entrance & arch: top-left (-0.05, -0.78) to upper-right (0.88, -1.05)
// 2. Swirling orbit around blue Reel CTA button (0.82 -> 0.68 -> 0.42 -> 0.22, Y ~ -1.22 to -1.48)
// 3. Grand 360-degree organic loop-de-loop between Reel & Flagship (0.35 -> 0.78 -> 0.72 -> 0.52 -> 0.58 -> 0.82, Y ~ -1.48 to -1.95)
// 4. Undulating 3D wave winding across Active Initiatives & Event Cards (Cards 1 to 6, Y ~ -2.18 to -4.42)
// 5. 3D zig-zag through Core Players Member cards (Kosehira, Ito, Sakai, Okamoto, Y ~ -4.68 to -5.38)
// 6. Grand outro flourish toward Goal (Y ~ -5.55 to -5.70)

const waypoints = [
  // 1. REEL ENTRY & ARCH
  { x: -0.05, y: -0.78, cd: 0.00, name: '1A: Reel Top-Left Entry' },
  { x:  0.35, y: -0.92, cd: 0.05, name: '1B: Sweeping Arch over Headline' },
  { x:  0.88, y: -1.05, cd: 0.10, name: '1C: High Crest Upper-Right' },

  // 2. ORBIT AROUND BLUE REEL BUTTON (swirling curve around HOW IT WORKS / TALK WITH AIUEO)
  { x:  0.82, y: -1.22, cd: 0.14, name: '2A: Descending toward Reel Button' },
  { x:  0.68, y: -1.36, cd: 0.18, name: '2B: Orbiting Right Edge of Button' },
  { x:  0.42, y: -1.38, cd: 0.22, name: '2C: Sweeping Underneath Button' },
  { x:  0.22, y: -1.48, cd: 0.26, name: '2D: Orbit Exit Swoop toward Left' },

  // 3. GRAND 360-DEGREE ORGANIC LOOP-DE-LOOP
  { x:  0.35, y: -1.62, cd: 0.28, name: '3A: Loop Entry & Approach' },
  { x:  0.60, y: -1.68, cd: 0.30, name: '3B: Climbing into Loop Right' },
  { x:  0.78, y: -1.60, cd: 0.32, name: '3C: Loop Right Apex' },
  { x:  0.72, y: -1.48, cd: 0.34, name: '3D: Loop Top Crest' },
  { x:  0.52, y: -1.52, cd: 0.36, name: '3E: Loop Left Apex (Inside Sweep)' },
  { x:  0.58, y: -1.74, cd: 0.38, name: '3F: Loop Crossing Downward (360 Completed!)' },
  { x:  0.82, y: -1.95, cd: 0.42, name: '3G: Loop Exit Flourish toward Initiatives' },

  // 4. UNDULATING WAVE AROUND EVENT CARDS (Serpentine 3D Wave)
  { x:  1.08, y: -2.18, cd: 0.46, name: '4A: Across Active Initiatives Header' },
  { x:  0.95, y: -2.42, cd: 0.50, name: '4B: Dipping behind Flagship Card Top-Right' },
  { x:  0.48, y: -2.68, cd: 0.54, name: '4C: Wave Crest across Central Boulevard' },
  { x: -0.08, y: -2.95, cd: 0.58, name: '4D: Undulating Swoop down-left (Cards 1 & 2)' },
  { x:  0.08, y: -3.32, cd: 0.62, name: '4E: Rising Wave Crest between Card Rows' },
  { x:  0.65, y: -3.55, cd: 0.68, name: '4F: Central Diagonal Weave (Cards 3 & 4)' },
  { x:  1.05, y: -3.85, cd: 0.74, name: '4G: Wave Apex Right (Cards 5 & 6)' },
  { x:  0.72, y: -4.18, cd: 0.78, name: '4H: Downward S-Curve towards Members' },
  { x:  0.25, y: -4.42, cd: 0.82, name: '4I: Lower Weave into Members Transition' },

  // 5. 3D ZIG-ZAG THROUGH MEMBER CARDS
  { x: -0.05, y: -4.68, cd: 0.85, name: '5A: Members Section Entry Left' },
  { x:  0.28, y: -4.85, cd: 0.88, name: '5B: Zig-zag between Top Row Members (Kosehira & Ito)' },
  { x:  0.78, y: -4.98, cd: 0.91, name: '5C: Weaving down between Left & Right Column' },
  { x:  0.35, y: -5.18, cd: 0.94, name: '5D: Zig-zag between Bottom Row Members (Sakai & Okamoto)' },
  { x:  0.80, y: -5.38, cd: 0.96, name: '5E: Sweeping behind Advisor Card' },

  // 6. GRAND GOAL OUTRO FLOURISH
  { x:  0.95, y: -5.55, cd: 0.98, name: '6A: Grand Flourish toward Goal' },
  { x:  0.82, y: -5.70, cd: 1.00, name: '6B: Graceful Outro Landing' }
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
  const s = i / (numPoints - 1); // 0.0 to 1.0 along curve

  if (pt.x < minX) minX = pt.x;
  if (pt.x > maxX) maxX = pt.x;
  if (pt.y < minY) minY = pt.y;
  if (pt.y > maxY) maxY = pt.y;

  // Tangents
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

  // Normals
  const nx = -ty;
  const ny = tx;

  const v0 = i * 2;
  const v1 = i * 2 + 1;

  // Right edge
  cpArray[v0 * 3 + 0] = pt.x;
  cpArray[v0 * 3 + 1] = pt.y;
  cpArray[v0 * 3 + 2] = 1.0;

  posArray[v0 * 3 + 0] = -nx;
  posArray[v0 * 3 + 1] = -ny;
  posArray[v0 * 3 + 2] = s;

  cdArray[v0] = s;

  // Left edge
  cpArray[v1 * 3 + 0] = pt.x;
  cpArray[v1 * 3 + 1] = pt.y;
  cpArray[v1 * 3 + 2] = 0.0;

  posArray[v1 * 3 + 0] = nx;
  posArray[v1 * 3 + 1] = ny;
  posArray[v1 * 3 + 2] = s;

  cdArray[v1] = s;

  // Triangles
  if (i < numPoints - 1) {
    const v2 = (i + 1) * 2;
    const v3 = (i + 1) * 2 + 1;

    const idx = i * 6;
    indices[idx + 0] = v0;
    indices[idx + 1] = v1;
    indices[idx + 2] = v2;

    indices[idx + 3] = v1;
    indices[idx + 4] = v3;
    indices[idx + 5] = v2;
  }
}

console.log(`Bounding Box: X [${minX.toFixed(4)}, ${maxX.toFixed(4)}], Y [${minY.toFixed(4)}, ${maxY.toFixed(4)}]`);

// Buffer quantization & packaging
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
    const norm = Math.max(0, Math.min(1, (cpArray[i + c] - cpPacked[c].from) / cpPacked[c].delta));
    cpRaw[i + c] = Math.round(norm * 65535) - 32768;
  }
}

const posRaw = new Uint16Array(posArray.length);
for (let i = 0; i < posArray.length; i += 3) {
  for (let c = 0; c < 3; c++) {
    const norm = Math.max(0, Math.min(1, (posArray[i + c] - posPacked[c].from) / posPacked[c].delta));
    posRaw[i + c] = Math.round(norm * 65535);
  }
}

const cdRaw = new Uint8Array(cdArray.length);
for (let i = 0; i < cdArray.length; i++) {
  const norm = Math.max(0, Math.min(1, (cdArray[i] - cdPacked[0].from) / cdPacked[0].delta));
  cdRaw[i] = Math.round(norm * 255);
}

const headerLenBuf = Buffer.alloc(4);
headerLenBuf.writeUInt32LE(headerBuf.length, 0);

const cpBuf = Buffer.from(cpRaw.buffer);
const indicesBuf = Buffer.from(indices.buffer);
const posBuf = Buffer.from(posRaw.buffer);
const cdBuf = Buffer.from(cdRaw.buffer);

let cdPaddedBuf = cdBuf;
if (cdBuf.length % 4 !== 0) {
  const padLen = 4 - (cdBuf.length % 4);
  cdPaddedBuf = Buffer.concat([cdBuf, Buffer.alloc(padLen)]);
}

const finalBuf = Buffer.concat([headerLenBuf, headerBuf, cpBuf, indicesBuf, posBuf, cdPaddedBuf]);
console.log('Final buffer size: ' + finalBuf.length + ' bytes (aligned: ' + (finalBuf.length % 4 === 0) + ')');

const out1 = path.resolve('assets/models/lines/line_reel.buf');
const out2 = path.resolve('dist/assets/models/lines/line_reel.buf');

fs.writeFileSync(out1, finalBuf);
console.log('Wrote buffer:', out1);
if (fs.existsSync(path.dirname(out2))) {
  fs.writeFileSync(out2, finalBuf);
  console.log('Wrote buffer:', out2);
}

// 2. PATCH SHADERS & LOGIC IN HOISTED JS
console.log('\n=== 2. PATCHING HOISTED JAVASCRIPT BUNDLES ===');

const newVertCode = `vert$j=\`#define GLSLIFY 1
attribute vec3 CP;attribute float Cd;varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_scrollY;uniform vec2 u_viewportResolution;uniform vec2 u_aspect;uniform vec2 u_margin;uniform float u_radius;uniform float u_showRatio;float getDynamicThick(float r){float t=clamp(r,0.0,1.0);float wave=sin(t*31.4159)*0.22;float base=1.3;if(t<0.16){float u=t/0.16;base=mix(0.85,1.90,sin(u*3.14159));}else if(t<0.36){float u=(t-0.16)/0.20;base=1.35+1.35*sin(u*3.14159);}else if(t<0.62){float u=(t-0.36)/0.26;base=1.30+0.65*sin(u*6.28318)+wave;}else if(t<0.82){float u=(t-0.62)/0.20;base=1.10+0.50*sin(u*3.14159);}else{float u=(t-0.82)/0.18;base=mix(2.05,1.15,u)+0.35*sin(u*3.14159);}return base;}void main(){float strokeThick=getDynamicThick(position.z);vec3 pos=vec3(CP.xy+position.xy*(u_radius*strokeThick),0.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_cd=Cd;v_lineRatio=position.z;v_s=CP.z;}\``;

const newFragCode = `frag$m=\`#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform vec3 u_color0;vec3 getTubeColor(float t){t=clamp(t,0.0,1.0);vec3 c0=vec3(0.00,0.88,1.00);vec3 c1=vec3(0.98,0.10,0.22);vec3 c2=vec3(1.00,0.12,0.68);vec3 c3=vec3(1.00,0.90,0.02);vec3 c4=vec3(0.00,0.92,0.45);vec3 c5=vec3(0.55,0.10,0.98);vec3 c6=vec3(1.00,0.48,0.05);if(t<0.16){return mix(c0,c1,smoothstep(0.08,0.16,t));}else if(t<0.32){return mix(c1,c2,smoothstep(0.24,0.32,t));}else if(t<0.48){return mix(c2,c3,smoothstep(0.40,0.48,t));}else if(t<0.64){return mix(c3,c4,smoothstep(0.56,0.64,t));}else if(t<0.80){return mix(c4,c5,smoothstep(0.72,0.80,t));}else{return mix(c5,c6,smoothstep(0.90,1.00,t));}}void main(){if(step(u_showRatio,v_lineRatio)>0.5)discard;vec3 color=getTubeColor(v_lineRatio);float dist=abs(v_s-0.5)*2.0;float cyl=sqrt(max(0.0,1.0-dist*dist));gl_FragColor.rgb=color*(0.82+0.28*cyl);float alpha=1.0-smoothstep(1.0-fwidth(dist),1.0,dist);gl_FragColor.a=alpha;}\``;

const newLineEndFrag = `lineEndFrag=\`#define GLSLIFY 1
uniform float u_cd;uniform float u_lineRatio;varying vec2 v_uv;vec3 getTubeColor(float t){t=clamp(t,0.0,1.0);vec3 c0=vec3(0.00,0.88,1.00);vec3 c1=vec3(0.98,0.10,0.22);vec3 c2=vec3(1.00,0.12,0.68);vec3 c3=vec3(1.00,0.90,0.02);vec3 c4=vec3(0.00,0.92,0.45);vec3 c5=vec3(0.55,0.10,0.98);vec3 c6=vec3(1.00,0.48,0.05);if(t<0.16){return mix(c0,c1,smoothstep(0.08,0.16,t));}else if(t<0.32){return mix(c1,c2,smoothstep(0.24,0.32,t));}else if(t<0.48){return mix(c2,c3,smoothstep(0.40,0.48,t));}else if(t<0.64){return mix(c3,c4,smoothstep(0.56,0.64,t));}else if(t<0.80){return mix(c4,c5,smoothstep(0.72,0.80,t));}else{return mix(c5,c6,smoothstep(0.90,1.00,t));}}void main(){float d=length(v_uv-0.5)*2.0;if(d>1.0)discard;vec3 color=getTubeColor(u_lineRatio);float cyl=sqrt(max(0.0,1.0-d*d));gl_FragColor.rgb=color*(0.82+0.28*cyl);float alpha=1.0-smoothstep(1.0-fwidth(d),1.0,d);gl_FragColor.a=alpha;}\``;

function patchBundle(filePath) {
  if (!fs.existsSync(filePath)) return;
  console.log(`\nPatching ${filePath}...`);
  let code = fs.readFileSync(filePath, 'utf8');

  // 1. Replace vert$j
  const vertStart = code.indexOf('vert$j=`#define GLSLIFY 1');
  if (vertStart === -1) {
    console.error('ERROR: vert$j not found!');
    process.exit(1);
  }
  const vertEnd = code.indexOf('`', vertStart + 8);
  code = code.slice(0, vertStart) + newVertCode + code.slice(vertEnd + 1);
  console.log('  1. Replaced vert$j with dynamic thickness function');

  // 2. Replace frag$m
  const fragStart = code.indexOf('frag$m=`#define GLSLIFY 1');
  if (fragStart === -1) {
    console.error('ERROR: frag$m not found!');
    process.exit(1);
  }
  const fragEnd = code.indexOf('`', fragStart + 8);
  code = code.slice(0, fragStart) + newFragCode + code.slice(fragEnd + 1);
  console.log('  2. Replaced frag$m with 7-color rich palette & 3D volumetric cylinder highlight');

  // 3. Replace lineEndFrag
  const endFragStart = code.indexOf('lineEndFrag=`#define GLSLIFY 1');
  if (endFragStart === -1) {
    console.error('ERROR: lineEndFrag not found!');
    process.exit(1);
  }
  const endFragEnd = code.indexOf('`', endFragStart + 13);
  code = code.slice(0, endFragStart) + newLineEndFrag + code.slice(endFragEnd + 1);
  console.log('  3. Replaced lineEndFrag with matching 7-color dome cap');

  // 4. Update box bounds in LINES_DATA_LIST
  const listStart = code.indexOf('LINES_DATA_LIST=[');
  if (listStart !== -1) {
    const reelStart = code.indexOf('{fileName:"line_reel"', listStart);
    const reelEnd = code.indexOf(',{fileName:"line_goal"', reelStart);
    if (reelStart !== -1 && reelEnd !== -1) {
      const newLineData = `{fileName:"line_reel",aoThreshold:.555,margin:{x:-0.02,y:-0.65},scrollToRatioFactors:[0.0,4.2],boxMin:new Vector3(-0.2500,-5.8500,0),boxMax:new Vector3(1.2500,0.1500,0),color0:"#00f0ff",color1:"#1d35ff"}`;
      code = code.slice(0, reelStart) + newLineData + code.slice(reelEnd);
      console.log('  4. Updated box bounds in LINES_DATA_LIST');
    }
  }

  // 5. Update circle tip scale & uniforms & visibility
  const circlePosMarker = code.indexOf('this.circle.position.copy(_v0$2),this.circle.scale.set(');
  if (circlePosMarker !== -1) {
    const endSemicolon = code.indexOf(';', circlePosMarker + 55);
    const oldCircleScale = code.slice(circlePosMarker, endSemicolon + 1);
    const newCircleScale = `strokeThick=((r)=>{const t=Math.max(0,Math.min(1,r)),w=Math.sin(t*31.4159)*0.22;if(t<0.16){const u=t/0.16;return 0.85+1.05*Math.sin(u*Math.PI)}else if(t<0.36){const u=(t-0.16)/0.20;return 1.35+1.35*Math.sin(u*Math.PI)}else if(t<0.62){const u=(t-0.36)/0.26;return 1.30+0.65*Math.sin(u*2*Math.PI)+w}else if(t<0.82){const u=(t-0.62)/0.20;return 1.10+0.50*Math.sin(u*Math.PI)}else{const u=(t-0.82)/0.18;return(2.05*(1-u)+1.15*u)+0.35*Math.sin(u*Math.PI)}})(a);this.circle.position.copy(_v0$2),this.circle.scale.set(n*strokeThick,n*strokeThick,1),this.circle.material.uniforms.u_lineRatio.value=a,this.circle.material.uniforms.u_cd.value=a,this.circle.visible=(this.lineId===0?(scrollManager.scrollPixel>=(properties.viewportWidth<768?550:700)&&a>0.001&&a<0.999):(a>0.001&&a<0.999));`;
    code = code.replace(oldCircleScale, newCircleScale);
    console.log('  5. Synchronized round dome cap scale, uniforms, and visibility with dynamic thickness function');
  } else {
    console.warn('  WARNING: circle scale pattern not matched!');
  }

  // 6. Update innerContainer.position.x, y, and scale.x for responsive framing
  const oldPosNeedle = code.indexOf('this.innerContainer.position.x=this.lineId===0?0:this.lineData.margin.x*c,');
  if (oldPosNeedle !== -1) {
    const endScale = code.indexOf('this.innerContainer.scale.y=u,', oldPosNeedle);
    if (endScale !== -1) {
      const oldBlock = code.slice(oldPosNeedle, endScale + 30);
      const newBlock = `this.innerContainer.position.x=this.lineId===0?(properties.viewportWidth<768?-0.225*c:0):this.lineData.margin.x*c,this.innerContainer.position.y=this.lineId===0?((0.78+4.92*a)*u-0.15*properties.viewportHeight):this.lineData.margin.y*u-l,this.innerContainer.scale.x=this.lineId===0?(properties.viewportWidth<768?c*0.45:c):c,this.innerContainer.scale.y=u,`;
      code = code.replace(oldBlock, newBlock);
      console.log('  6. Updated innerContainer position & scale with mobile responsive framing');
    }
  }

  // 7. Validate ESBuild syntax
  try {
    esbuild.transformSync(code, { minify: false });
    console.log('  7. ESBuild syntax validation 100% PASSED!');
    fs.writeFileSync(filePath, code, 'utf8');
    const now = new Date();
    fs.utimesSync(filePath, now, now);
    console.log(`  Successfully saved: ${filePath}`);
  } catch (err) {
    console.error(`  ERROR in ${filePath}:`, err);
    process.exit(1);
  }
}

patchBundle('_astro/hoisted.CUO_IjfL.js');
patchBundle('dist/_astro/hoisted.CUO_IjfL.js');

console.log('\n=== COMPLETE: VIBRANT EXPRESSIVE TUBE DEPLOYED! ===');
