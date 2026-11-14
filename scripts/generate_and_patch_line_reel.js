const fs = require('fs');
const path = require('path');
const three = require('three');

// 1. GENERATE SPLINE GEOMETRY FOR LINE_REEL
function createSplineGeometry() {
  const hypot = 2202.9; // 1920x1080 baseline

  // Exact pixel-aligned trajectory:
  // - Starts near upper-left headline at x=140px, y=120px in reel coordinates
  // - Sweeps down into open lower-left area under headline (x=260px, y=420px)
  // - Swoops across under description and "HOW IT WORKS" button (x=720px, y=650px)
  // - Rises into a dynamic, luminous wave crest beside the video player (x=1480px, y=780px)
  // - Sweeps down and back across into Active Initiatives header (x=1200px, y=1250px)
  // - Weaves down the left side of the initiative cards (x=380px, y=1750px)
  // - Glides smoothly between cards (x=700px, y=2200px)
  // - Sweeps through the lower cards (x=1350px, y=2650px)
  // - Cascades toward center pointing downwards toward members (x=960px, y=3100px)
  // - Outro flourish (x=960px, y=3450px)
  const controlPoints = [
    new three.Vector3( 140 / hypot, -120 / hypot, 0),
    new three.Vector3( 260 / hypot, -420 / hypot, 0),
    new three.Vector3( 720 / hypot, -650 / hypot, 0),
    new three.Vector3(1480 / hypot, -780 / hypot, 0),
    new three.Vector3(1200 / hypot, -1250 / hypot, 0),
    new three.Vector3( 380 / hypot, -1750 / hypot, 0),
    new three.Vector3( 700 / hypot, -2200 / hypot, 0),
    new three.Vector3(1350 / hypot, -2650 / hypot, 0),
    new three.Vector3( 960 / hypot, -3100 / hypot, 0),
    new three.Vector3( 960 / hypot, -3450 / hypot, 0)
  ];

  const curve = new three.CatmullRomCurve3(controlPoints, false, 'centripetal', 0.5);

  const numSplinePoints = 320;
  const numVertices = numSplinePoints * 2; // 640 vertices
  const numIndices = (numSplinePoints - 1) * 6; // 1914 indices

  const points = curve.getSpacedPoints(numSplinePoints - 1);
  const cpArray = new Float32Array(numVertices * 3);
  const posArray = new Float32Array(numVertices * 3);
  const cdArray = new Float32Array(numVertices);
  const indices = new Uint16Array(numIndices);

  for (let i = 0; i < numSplinePoints; i++) {
    const pt = points[i];
    const s = i / (numSplinePoints - 1); // 0.0 -> 1.0 along spline

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

  return { cpArray, posArray, cdArray, indices, points };
}

// 2. SERIALIZE TO .BUF BINARY FORMAT
function serializeToBuf(geo) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < geo.cpArray.length; i += 3) {
    const x = geo.cpArray[i];
    const y = geo.cpArray[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

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
    vertexCount: 640,
    indexCount: 1914,
    attributes: [
      { id: 'CP', needsPack: true, componentSize: 3, storageType: 'Int16Array', packedComponents: cpPacked },
      { id: 'indices', needsPack: false, componentSize: 1, storageType: 'Uint16Array' },
      { id: 'position', needsPack: true, componentSize: 3, storageType: 'Uint16Array', packedComponents: posPacked },
      { id: 'Cd', needsPack: true, componentSize: 1, storageType: 'Uint8Array', packedComponents: cdPacked }
    ],
    meshType: 'Mesh'
  };

  const headerJson = JSON.stringify(header);
  const headerBuf = Buffer.from(headerJson, 'utf8');

  // Pack CP into Int16Array
  const cpRaw = new Int16Array(geo.cpArray.length);
  for (let i = 0; i < geo.cpArray.length; i += 3) {
    for (let c = 0; c < 3; c++) {
      const val = geo.cpArray[i + c];
      const p = cpPacked[c];
      const norm = Math.max(0, Math.min(1, (val - p.from) / p.delta));
      cpRaw[i + c] = Math.round(norm * 65535) - 32768;
    }
  }

  // Pack position into Uint16Array
  const posRaw = new Uint16Array(geo.posArray.length);
  for (let i = 0; i < geo.posArray.length; i += 3) {
    for (let c = 0; c < 3; c++) {
      const val = geo.posArray[i + c];
      const p = posPacked[c];
      const norm = Math.max(0, Math.min(1, (val - p.from) / p.delta));
      posRaw[i + c] = Math.round(norm * 65535);
    }
  }

  // Pack Cd into Uint8Array
  const cdRaw = new Uint8Array(geo.cdArray.length);
  for (let i = 0; i < geo.cdArray.length; i++) {
    cdRaw[i] = 255;
  }

  const indicesRaw = geo.indices;

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

  return { outBuf, minX, maxX, minY, maxY };
}

// 3. PATCH HOISTED JS FILE
function patchHoistedFile(filePath, bounds) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Update LINES_DATA_LIST[0] (line_reel)
  const listIdx = content.indexOf('LINES_DATA_LIST=[');
  if (listIdx === -1) throw new Error('LINES_DATA_LIST=[ not found');
  const reelStart = content.indexOf('{fileName:"line_reel"', listIdx);
  const reelEnd = content.indexOf(',{fileName:"line_goal"', reelStart);
  if (reelStart === -1 || reelEnd === -1) throw new Error('line_reel segment not found');

  const boxMinY = Math.min(-1.8, bounds.minY - 0.1).toFixed(4);
  const boxMaxY = Math.max(0.2, bounds.maxY + 0.1).toFixed(4);
  const boxMinX = Math.min(-0.1, bounds.minX - 0.1).toFixed(4);
  const boxMaxX = Math.max(1.0, bounds.maxX + 0.1).toFixed(4);

  // scrollToRatioFactors: [.45, 3.0] allows smooth, majestic drawing across 3 full viewport heights!
  const newLineData = `{fileName:"line_reel",aoThreshold:.555,margin:{x:0,y:0},scrollToRatioFactors:[.45,3.0],boxMin:new Vector3(${boxMinX},${boxMinY},0),boxMax:new Vector3(${boxMaxX},${boxMaxY},0),color0:"#00f0ff",color1:"#1d35ff"}`;
  content = content.slice(0, reelStart) + newLineData + content.slice(reelEnd);
  console.log(`[${filePath}] Updated LINES_DATA_LIST[0] with scrollToRatioFactors: [.45, 3.0], bbox [${boxMinX}, ${boxMinY}] to [${boxMaxX}, ${boxMaxY}]`);

  // 2. Class Line radius
  const classLineIdx = content.indexOf('class Line{');
  const radIdx = content.indexOf('radius=', classLineIdx);
  const radEnd = content.indexOf(';', radIdx);
  content = content.slice(0, radIdx) + 'radius=0.0105' + content.slice(radEnd);

  // 3. In Line.preInit(), ensure mesh.geometry is synced on load!
  const onLoadIdx = content.indexOf('onLoad:e=>{this.geometry=e;', classLineIdx);
  if (onLoadIdx !== -1) {
    const replacement = 'onLoad:e=>{this.geometry=e,this.mesh&&(this.mesh.geometry=e);';
    content = content.slice(0, onLoadIdx) + replacement + content.slice(onLoadIdx + 'onLoad:e=>{this.geometry=e;'.length);
    console.log(`[${filePath}] Synced this.mesh.geometry in Line.preInit onLoad.`);
  }

  // 4. Update uniforms in class Line.init() to supply u_responsiveX
  const uMarginIdx = content.indexOf('u_margin:{value:new Vector2(this.lineData.margin.x,this.lineData.margin.y)},', classLineIdx);
  if (uMarginIdx !== -1) {
    const replacement = 'u_responsiveX:{value:this.lineId===0?1.:0.},u_margin:{value:new Vector2(this.lineData.margin.x,this.lineData.margin.y)},';
    content = content.slice(0, uMarginIdx) + replacement + content.slice(uMarginIdx + 'u_margin:{value:new Vector2(this.lineData.margin.x,this.lineData.margin.y)},'.length);
    console.log(`[${filePath}] Injected u_responsiveX into class Line uniforms.`);
  }

  // 5. Update vert$j shader to support responsive aspect scaling
  const vertIdx = content.indexOf('vert$j=`#define GLSLIFY 1');
  if (vertIdx !== -1) {
    const vertEnd = content.indexOf('`', vertIdx + 15);
    const newVert = `vert$j=\`#define GLSLIFY 1
attribute vec3 CP;attribute float Cd;varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_scrollY;uniform vec2 u_viewportResolution;uniform vec2 u_aspect;uniform vec2 u_margin;uniform float u_radius;uniform float u_responsiveX;void main(){float sx=mix(1.0,u_viewportResolution.x/length(u_viewportResolution)/0.87157,u_responsiveX);vec2 cpx=vec2(CP.x*sx,CP.y);vec3 pos=vec3(cpx+position.xy*u_radius,0.0);gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);v_cd=Cd;v_lineRatio=position.z;v_s=CP.z;}\``;
    content = content.slice(0, vertIdx) + newVert + content.slice(vertEnd + 1);
    console.log(`[${filePath}] Updated vert$j with responsive aspect scaling.`);
  }

  // 6. Update circle cap position calculation in Line.update()
  const circlePosIdx = content.indexOf('this.circle.position.copy(_v0$2)', classLineIdx);
  if (circlePosIdx !== -1) {
    const newCirclePos = 'this.lineId===0&&(_v0$2.x*=(properties.viewportWidth/Math.hypot(properties.viewportWidth,properties.viewportHeight)/.87157)),this.circle.position.copy(_v0$2)';
    content = content.slice(0, circlePosIdx) + newCirclePos + content.slice(circlePosIdx + 'this.circle.position.copy(_v0$2)'.length);
    console.log(`[${filePath}] Updated circle cap tracking in Line.update().`);
  }

  // 7. Ensure container.visible is reliably true for lineId 0 when in scroll range
  const boxVisIdx = content.indexOf('this.container.visible=_box.max.y>-properties.viewportHeight&&_box.min.y<0', classLineIdx);
  if (boxVisIdx !== -1) {
    const newBoxVis = 'this.container.visible=this.lineId===0?(_box.max.y>-properties.viewportHeight*2.&&_box.min.y<properties.viewportHeight):(_box.max.y>-properties.viewportHeight&&_box.min.y<0)';
    content = content.slice(0, boxVisIdx) + newBoxVis + content.slice(boxVisIdx + 'this.container.visible=_box.max.y>-properties.viewportHeight&&_box.min.y<0'.length);
    console.log(`[${filePath}] Expanded container.visible frustum check for line 0.`);
  }

  // 8. Frag shaders (3D cylindrical shading & spherical cap)
  const fragStart = content.indexOf('frag$m=`#define GLSLIFY 1');
  if (fragStart !== -1) {
    const fragEnd = content.indexOf('`', fragStart + 15);
    const newFrag = `frag$m=\`#define GLSLIFY 1
varying float v_cd;varying float v_lineRatio;varying float v_s;uniform float u_showRatio;uniform float u_hideRatio;uniform vec3 u_colorBg;uniform vec3 u_color0;uniform vec3 u_color1;uniform float u_aoThreshold;float linearStep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.0,1.0);}vec3 hsv2rgb(in vec3 c){vec3 rgb=clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);rgb=rgb*rgb*(3.0-2.0*rgb);return c.z*mix(vec3(1.0),rgb,c.y);}vec3 rgb2hsv(vec3 c){vec4 K=vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)),d/(q.x+e),q.x);}vec3 lerpHSV(in vec3 a,in vec3 b,in float x){float hue=(mod(mod((b.x-a.x),1.)+1.5,1.)-0.5)*x+a.x;return vec3(hue,mix(a.yz,b.yz,x));}void main(){float ao=0.9+0.1*v_cd;float aoRatio=linearStep(u_aoThreshold-0.02,u_aoThreshold+0.02,u_showRatio);if(step(u_showRatio,v_lineRatio)>0.5)discard;float mixRatio=1.0-pow(1.0-clamp(v_lineRatio,0.0,1.0),2.0);vec3 baseColor=hsv2rgb(lerpHSV(rgb2hsv(u_color1),rgb2hsv(u_color0),mixRatio));float t=(v_s-0.5)*2.0;float nz=sqrt(max(0.0,1.0-t*t));float diff=0.58+0.42*nz;vec3 n=vec3(t,0.0,nz);vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),26.0);float rim=pow(1.0-nz,3.0);vec3 rimColor=u_color0*(rim*0.28);float aoFactor=min(1.0,ao+1.0-aoRatio);vec3 shaded=(baseColor*diff+rimColor)*aoFactor+vec3(1.0)*(spec*0.38);gl_FragColor.rgb=shaded;float alpha=abs(v_s-.5);gl_FragColor.a=linearStep(0.5,0.5-fwidth(alpha),alpha);}\``;
    content = content.slice(0, fragStart) + newFrag + content.slice(fragEnd + 1);
  }

  const endFragStart = content.indexOf('lineEndFrag=`#define GLSLIFY 1');
  if (endFragStart !== -1) {
    const endFragEnd = content.indexOf('`', endFragStart + 15);
    const newLineEndFrag = `lineEndFrag=\`#define GLSLIFY 1
varying vec3 v_color;varying vec2 v_uv;void main(){float d=length(v_uv-.5)*2.;if(d>1.0)discard;float nz=sqrt(max(0.0,1.0-clamp(d*d,0.0,1.0)));float diff=0.58+0.42*nz;vec3 n=vec3((v_uv-.5)*2.,nz);vec3 lightDir=normalize(vec3(0.25,0.45,0.85));vec3 h=normalize(lightDir+vec3(0.0,0.0,1.0));float spec=pow(max(0.0,dot(n,h)),26.0);float rim=pow(1.0-nz,3.0);gl_FragColor.rgb=(v_color*diff+v_color*rim*0.28)+vec3(1.0)*(spec*0.38);gl_FragColor.a=smoothstep(1.,1.-fwidth(d),d);}\``;
    content = content.slice(0, endFragStart) + newLineEndFrag + content.slice(endFragEnd + 1);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`[${filePath}] Saved successfully.`);
}

// MAIN EXECUTION
console.log('=== 1. Generating Spline Geometry ===');
const geo = createSplineGeometry();
const { outBuf, minX, maxX, minY, maxY } = serializeToBuf(geo);
const bounds = { minX, maxX, minY, maxY };
console.log('Bounds:', JSON.stringify(bounds));

console.log('=== 2. Writing line_reel.buf files ===');
const paths = [
  path.resolve('assets/models/lines/line_reel.buf'),
  path.resolve('dist/assets/models/lines/line_reel.buf')
];
for (const p of paths) {
  if (fs.existsSync(path.dirname(p))) {
    fs.writeFileSync(p, outBuf);
    console.log(`Wrote ${outBuf.length} bytes to ${p}`);
  }
}

console.log('=== 3. Patching JS files ===');
const jsPaths = [
  '_astro/hoisted.CUO_IjfL.js',
  'dist/_astro/hoisted.CUO_IjfL.js'
];
for (const p of jsPaths) {
  if (fs.existsSync(p)) {
    patchHoistedFile(p, bounds);
  }
}

console.log('=== ALL COMPLETED ===');
