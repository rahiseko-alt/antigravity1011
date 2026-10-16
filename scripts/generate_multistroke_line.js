const fs = require('fs');
const path = require('path');
const three = require('three');

console.log('=== GENERATING 5 PLAYFUL DYNAMIC STROKES WITH LOOP-DE-LOOPS & SWOOPING CURVES ===');

// 5 Playful, dynamic strokes with loop-de-loops (くるっと回る) and swooping curves (ぐにーんと曲がる)
// General flow: L->R, R->L, L->R, R->L, L->R
const strokes = [
  {
    id: 1,
    name: 'Stroke 1: Hero Balloons Entry & Playful Loop-de-loop',
    cd: 0.0,
    s0: 0.00,
    s1: 0.20,
    knots: [
      new three.Vector3(-0.02, -0.05, 0), // Enters top-left Hero
      new three.Vector3( 0.18, -0.15, 0), // Swoops down across 3D balloons
      new three.Vector3( 0.35, -0.25, 0), // Pre-loop entry
      // Loop-de-loop (くるっと1回転 360° circle loop in XY space)
      new three.Vector3( 0.45, -0.20, 0), // Climbing into loop
      new three.Vector3( 0.52, -0.15, 0), // Right apex of loop
      new three.Vector3( 0.46, -0.08, 0), // Top apex of loop
      new three.Vector3( 0.38, -0.15, 0), // Left apex of loop
      new three.Vector3( 0.45, -0.28, 0), // Crossing below loop entry
      // Swooshes out right
      new three.Vector3( 0.75, -0.45, 0), // Accelerating sweep
      new three.Vector3( 0.92, -0.55, 0)  // Exits right edge
    ]
  },
  {
    id: 2,
    name: 'Stroke 2: Reel Headline Roller-Coaster S-Bend Swoop',
    cd: 0.25,
    s0: 0.20,
    s1: 0.40,
    knots: [
      new three.Vector3( 0.92, -0.68, 0), // Enters slightly below Exit 1 on right
      new three.Vector3( 0.74, -0.74, 0), // Swooping inward
      new three.Vector3( 0.56, -0.90, 0), // Dramatic dip under Reel headline (ぐにーんと大きくS字にうねる)
      new three.Vector3( 0.40, -0.82, 0), // Crest of roller-coaster wave
      new three.Vector3( 0.22, -1.06, 0), // Deep swoop under HOW IT WORKS button
      new three.Vector3( 0.08, -1.18, 0), // Swooshing out toward left edge
      new three.Vector3(-0.03, -1.25, 0)  // Shoots out left edge
    ]
  },
  {
    id: 3,
    name: 'Stroke 3: Active Initiatives & Event Cards Energetic Loop-de-loop',
    cd: 0.50,
    s0: 0.40,
    s1: 0.60,
    knots: [
      new three.Vector3(-0.03, -1.38, 0), // Enters left edge
      new three.Vector3( 0.18, -1.46, 0), // Curves across Active Initiatives header
      new three.Vector3( 0.35, -1.56, 0), // Approaching event cards
      // Energetic loop-de-loop (くるっと回る) between event cards
      new three.Vector3( 0.45, -1.50, 0), // Climbing into loop
      new three.Vector3( 0.52, -1.45, 0), // Right apex of loop
      new three.Vector3( 0.46, -1.38, 0), // Top apex of loop
      new three.Vector3( 0.38, -1.45, 0), // Left apex of loop
      new three.Vector3( 0.45, -1.58, 0), // Crossing loop bottom
      // Swooshes diagonally out right
      new three.Vector3( 0.72, -1.80, 0), // Flying out across cards
      new three.Vector3( 0.92, -1.95, 0)  // Exits right edge
    ]
  },
  {
    id: 4,
    name: 'Stroke 4: Cards 3 & 4 Giant Playful Weaving Curve',
    cd: 0.75,
    s0: 0.60,
    s1: 0.80,
    knots: [
      new three.Vector3( 0.92, -2.08, 0), // Enters right edge
      new three.Vector3( 0.72, -2.15, 0), // Graceful entry arc
      new three.Vector3( 0.52, -2.40, 0), // Giant playful curve dipping down (ぐにーんと大きく湾曲)
      new three.Vector3( 0.36, -2.52, 0), // Weaving trough between Card 3 & 4
      new three.Vector3( 0.22, -2.38, 0), // Playful upward wave crest
      new three.Vector3( 0.08, -2.52, 0), // Descending swoop
      new three.Vector3(-0.03, -2.65, 0)  // Swooshes out left edge
    ]
  },
  {
    id: 5,
    name: 'Stroke 5: Core Players Corkscrew Wave Curve & Flourish',
    cd: 1.00,
    s0: 0.80,
    s1: 1.00,
    knots: [
      new three.Vector3(-0.03, -2.78, 0), // Enters left edge
      new three.Vector3( 0.16, -2.85, 0), // Dynamic entry curve
      new three.Vector3( 0.32, -2.80, 0), // Corkscrew crest 1
      new three.Vector3( 0.46, -3.02, 0), // Corkscrew trough 1
      new three.Vector3( 0.60, -2.94, 0), // Corkscrew crest 2
      new three.Vector3( 0.72, -3.14, 0), // Corkscrew trough 2 into Goal section
      new three.Vector3( 0.84, -3.24, 0), // Flourish curve
      new three.Vector3( 0.92, -3.35, 0)  // Flourishes out right edge
    ]
  }
];

const segmentsPerStroke = 100;
const pointsPerStroke = segmentsPerStroke + 1; // 101 points
const verticesPerStroke = pointsPerStroke * 2; // 202 vertices
const indicesPerStroke = segmentsPerStroke * 6; // 600 indices (100 quads * 2 triangles * 3 indices)

const numStrokes = strokes.length; // 5
const numVertices = numStrokes * verticesPerStroke; // 1010 vertices
const numIndices = numStrokes * indicesPerStroke; // 3000 indices

const cpArray = new Float32Array(numVertices * 3);
const posArray = new Float32Array(numVertices * 3);
const cdArray = new Float32Array(numVertices);
const indices = new Uint16Array(numIndices);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

strokes.forEach((stroke, k) => {
  const vBase = k * verticesPerStroke;
  const idxBase = k * indicesPerStroke;

  const curve = new three.CatmullRomCurve3(stroke.knots, false, 'centripetal', 0.5);
  const points = curve.getSpacedPoints(segmentsPerStroke); // 101 points

  console.log(`\n[Stroke ${stroke.id}] ${stroke.name}`);
  console.log(`  Knots: ${stroke.knots.length}, Sampled points: ${points.length}`);
  console.log(`  s-range: [${stroke.s0.toFixed(2)}, ${stroke.s1.toFixed(2)}], Cd: ${stroke.cd.toFixed(2)}`);

  // Generate vertices along stroke
  for (let j = 0; j < pointsPerStroke; j++) {
    const pt = points[j];
    const u = j / segmentsPerStroke;
    const s = stroke.s0 + u * (stroke.s1 - stroke.s0);

    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;

    // Central difference tangent on sampled polyline
    let tx, ty;
    if (j === 0) {
      tx = points[1].x - points[0].x;
      ty = points[1].y - points[0].y;
    } else if (j === pointsPerStroke - 1) {
      tx = points[j].x - points[j - 1].x;
      ty = points[j].y - points[j - 1].y;
    } else {
      tx = points[j + 1].x - points[j - 1].x;
      ty = points[j + 1].y - points[j - 1].y;
    }
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;

    // Normal perpendicular to tangent: 90 deg counter-clockwise
    const nx = -ty;
    const ny = tx;

    const v0 = vBase + j * 2;     // right edge
    const v1 = vBase + j * 2 + 1; // left edge

    // Right edge vertex: pos=(-nx, -ny, s), CP.z = 1.0
    cpArray[v0 * 3 + 0] = pt.x;
    cpArray[v0 * 3 + 1] = pt.y;
    cpArray[v0 * 3 + 2] = 1.0;

    posArray[v0 * 3 + 0] = -nx;
    posArray[v0 * 3 + 1] = -ny;
    posArray[v0 * 3 + 2] = s;

    cdArray[v0] = stroke.cd;

    // Left edge vertex: pos=(nx, ny, s), CP.z = 0.0
    cpArray[v1 * 3 + 0] = pt.x;
    cpArray[v1 * 3 + 1] = pt.y;
    cpArray[v1 * 3 + 2] = 0.0;

    posArray[v1 * 3 + 0] = nx;
    posArray[v1 * 3 + 1] = ny;
    posArray[v1 * 3 + 2] = s;

    cdArray[v1] = stroke.cd;

    // Quads within stroke (NO cross-stroke connections - strictly disjoint!)
    if (j < segmentsPerStroke) {
      const quadV0 = vBase + j * 2;
      const quadV1 = vBase + j * 2 + 1;
      const quadV2 = vBase + (j + 1) * 2;
      const quadV3 = vBase + (j + 1) * 2 + 1;

      // Exact original winding: [quadV0, quadV3, quadV1, quadV3, quadV0, quadV2]
      const quadIdx = idxBase + j * 6;
      indices[quadIdx + 0] = quadV0;
      indices[quadIdx + 1] = quadV3;
      indices[quadIdx + 2] = quadV1;
      indices[quadIdx + 3] = quadV3;
      indices[quadIdx + 4] = quadV0;
      indices[quadIdx + 5] = quadV2;
    }
  }
});

console.log(`\nOverall Bounding Box: X [${minX.toFixed(4)}, ${maxX.toFixed(4)}], Y [${minY.toFixed(4)}, ${maxY.toFixed(4)}]`);
console.log(`Total Vertices: ${numVertices}, Total Indices: ${numIndices} (${numIndices / 3} triangles)`);

// 2. BINARY BUFFER SERIALIZATION
console.log('\n=== SERIALIZING BUFFER WITH 4-BYTE ALIGNMENT PADDING ===');

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
console.log(`Header JSON length: ${headerBuf.length} bytes (aligned to 4 bytes: ${(4 + headerBuf.length) % 4 === 0})`);

// Quantize attributes
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
Buffer.from(cpRaw.buffer, cpRaw.byteOffset, cpRaw.byteLength).copy(outBuf, offset); offset += cpRaw.byteLength;
Buffer.from(indices.buffer, indices.byteOffset, indices.byteLength).copy(outBuf, offset); offset += indices.byteLength;
Buffer.from(posRaw.buffer, posRaw.byteOffset, posRaw.byteLength).copy(outBuf, offset); offset += posRaw.byteLength;
Buffer.from(cdRaw.buffer, cdRaw.byteOffset, cdRaw.byteLength).copy(outBuf, offset); offset += cdRaw.byteLength;

// Write output files
const targetFiles = [
  path.resolve('assets/models/lines/line_reel.buf'),
  path.resolve('dist/assets/models/lines/line_reel.buf')
];

for (const targetFile of targetFiles) {
  fs.mkdirSync(path.dirname(targetFile), { recursive: true });
  fs.writeFileSync(targetFile, outBuf);
  console.log(`Saved: ${targetFile} (${outBuf.length} bytes)`);
}

// 3. PATCH HOISTED JAVASCRIPT BOX BOUNDS
function patchHoisted(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  const boxMinY = (minY - 0.1).toFixed(4);
  const boxMaxY = (maxY + 0.1).toFixed(4);
  const boxMinX = (minX - 0.1).toFixed(4);
  const boxMaxX = (maxX + 0.1).toFixed(4);

  const listIdx = content.indexOf('LINES_DATA_LIST=[');
  if (listIdx !== -1) {
    const reelStart = content.indexOf('{fileName:"line_reel"', listIdx);
    const reelEnd = content.indexOf(',{fileName:"line_goal"', reelStart);
    if (reelStart !== -1 && reelEnd !== -1) {
      const newLineData = `{fileName:"line_reel",aoThreshold:.555,margin:{x:-0.02,y:-0.65},scrollToRatioFactors:[0.0,3.2],boxMin:new Vector3(${boxMinX},${boxMinY},0),boxMax:new Vector3(${boxMaxX},${boxMaxY},0),color0:"#00f0ff",color1:"#1d35ff"}`;
      content = content.slice(0, reelStart) + newLineData + content.slice(reelEnd);
      fs.writeFileSync(filePath, content, 'utf8');
      const now = new Date();
      fs.utimesSync(filePath, now, now);
      console.log(`[${filePath}] Updated box bounds in LINES_DATA_LIST.`);
    }
  }
}

patchHoisted('_astro/hoisted.CUO_IjfL.js');
patchHoisted('dist/_astro/hoisted.CUO_IjfL.js');

console.log('\n=== SUMMARY ===');
console.log(`Buffer byte length: ${outBuf.length} bytes`);
console.log(`Header length: ${headerBuf.length} bytes`);
console.log(`CP bytes (Int16Array x 3): ${cpRaw.byteLength} bytes`);
console.log(`Indices bytes (Uint16Array): ${indices.byteLength} bytes`);
console.log(`Position bytes (Uint16Array x 3): ${posRaw.byteLength} bytes`);
console.log(`Cd bytes (Uint8Array x 1): ${cdRaw.byteLength} bytes`);
console.log(`Total vertices: ${numVertices}`);
console.log(`Total indices: ${numIndices} (${numIndices / 3} triangles)`);
console.log(`Bounding Box:`);
console.log(`  X: [${minX.toFixed(4)}, ${maxX.toFixed(4)}]`);
console.log(`  Y: [${minY.toFixed(4)}, ${maxY.toFixed(4)}]`);
