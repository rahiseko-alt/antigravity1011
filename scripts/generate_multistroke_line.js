const fs = require('fs');
const path = require('path');
const three = require('three');

console.log('=== GENERATING FLAWLESS MATHEMATICALLY SMOOTH MULTI-STROKE TUBE ===');

// Parametric smooth circular loop with aspect ratio compensation
// rx = 0.228, ry = 0.14 gives a round, beautiful, butter-smooth circle on mobile screen with zero kinks!
function createSmoothLoop(xc, yc, rx, ry, startAngle, endAngle, numKnots = 24) {
  const pts = [];
  for (let k = 0; k <= numKnots; k++) {
    const t = k / numKnots;
    const angle = startAngle + t * (endAngle - startAngle);
    // Vertical drift separates the crossing cleanly so it never self-intersects
    const yDrift = -0.040 * (t - 0.5);
    const x = xc + rx * Math.cos(angle);
    const y = yc + ry * Math.sin(angle) + yDrift;
    pts.push(new three.Vector3(x, y, 0));
  }
  return pts;
}

// 6 continuous strokes covering Hero, Reel, Initiatives (all cards), Members, and Goal!
const strokes = [
  {
    id: 1,
    name: 'Stroke 1: Hero Balloons Entry & Gentle 360 Loop',
    cd: 0.00, // Cyan / Cobalt Blue
    s0: 0.00,
    s1: 0.16,
    knots: [
      new three.Vector3(-0.03, -0.05, 0),
      new three.Vector3( 0.14, -0.10, 0),
      new three.Vector3( 0.28, -0.16, 0),
      ...createSmoothLoop(0.48, -0.24, 0.21, 0.12, -Math.PI * 0.60, -Math.PI * 0.60 + Math.PI * 2.10, 20),
      new three.Vector3( 0.72, -0.40, 0),
      new three.Vector3( 0.86, -0.48, 0),
      new three.Vector3( 0.95, -0.56, 0)
    ]
  },
  {
    id: 2,
    name: 'Stroke 2: Reel Headline Flowing S-Swoop',
    cd: 0.20, // Neon Red / Crimson
    s0: 0.16,
    s1: 0.32,
    knots: [
      new three.Vector3( 0.95, -0.66, 0),
      new three.Vector3( 0.76, -0.74, 0),
      new three.Vector3( 0.52, -0.84, 0), // Swoop under Reel headline
      new three.Vector3( 0.36, -0.94, 0), // Wave crest
      new three.Vector3( 0.20, -1.06, 0), // Descending swoop
      new three.Vector3( 0.06, -1.14, 0),
      new three.Vector3(-0.03, -1.20, 0)
    ]
  },
  {
    id: 3,
    name: 'Stroke 3: HOW IT WORKS & Initiatives Header FLAWLESS GREEN LOOP',
    cd: 0.40, // Emerald Green (The exact loop requested by the user!)
    s0: 0.32,
    s1: 0.50,
    knots: [
      new three.Vector3(-0.03, -1.26, 0), // Enters left right above HOW IT WORKS
      new three.Vector3( 0.14, -1.30, 0),
      new three.Vector3( 0.28, -1.36, 0),
      // Butter-smooth circular loop at xc=0.50, yc=-1.46 (right at HOW IT WORKS / Initiatives header!)
      // Aspect ratio compensated: rx=0.228, ry=0.14 -> 100% GORGEOUS ROUND CIRCLE, ZERO KINKS!
      ...createSmoothLoop(0.50, -1.46, 0.228, 0.14, -Math.PI * 0.60, -Math.PI * 0.60 + Math.PI * 2.10, 24),
      new three.Vector3( 0.72, -1.72, 0),
      new three.Vector3( 0.86, -1.86, 0),
      new three.Vector3( 0.95, -1.98, 0)  // Sweeps out right into cards
    ]
  },
  {
    id: 4,
    name: 'Stroke 4: Initiatives Cards 1 & 2 Flowing Wave',
    cd: 0.60, // Neon Magenta / Purple
    s0: 0.50,
    s1: 0.68,
    knots: [
      new three.Vector3( 0.95, -2.10, 0),
      new three.Vector3( 0.76, -2.25, 0),
      new three.Vector3( 0.52, -2.48, 0), // Weaving between cards 1 & 2
      new three.Vector3( 0.34, -2.68, 0),
      new three.Vector3( 0.18, -2.86, 0),
      new three.Vector3( 0.06, -3.00, 0),
      new three.Vector3(-0.03, -3.12, 0)
    ]
  },
  {
    id: 5,
    name: 'Stroke 5: Initiatives Cards 3 & 4 Giant S-Curve',
    cd: 0.80, // Solar Gold / Amber
    s0: 0.68,
    s1: 0.84,
    knots: [
      new three.Vector3(-0.03, -3.22, 0),
      new three.Vector3( 0.16, -3.38, 0),
      new three.Vector3( 0.40, -3.62, 0), // Weaving across lower cards
      new three.Vector3( 0.62, -3.85, 0),
      new three.Vector3( 0.80, -4.06, 0),
      new three.Vector3( 0.95, -4.24, 0)
    ]
  },
  {
    id: 6,
    name: 'Stroke 6: Core Players / Members into Goal Section',
    cd: 1.00, // Aurora Cyan / Brilliant White
    s0: 0.84,
    s1: 1.00,
    knots: [
      new three.Vector3( 0.95, -4.34, 0),
      new three.Vector3( 0.74, -4.52, 0), // Across Member 1
      new three.Vector3( 0.50, -4.75, 0), // Across Member 2
      new three.Vector3( 0.32, -4.98, 0), // Across Member 3
      new three.Vector3( 0.14, -5.16, 0), // Flourish into Goal warp
      new three.Vector3(-0.03, -5.32, 0)
    ]
  }
];

const segmentsPerStroke = 180;
const pointsPerStroke = segmentsPerStroke + 1; // 181 points
const verticesPerStroke = pointsPerStroke * 2; // 362 vertices
const indicesPerStroke = segmentsPerStroke * 6; // 1080 indices

const numStrokes = strokes.length; // 6
const numVertices = numStrokes * verticesPerStroke; // 2172
const numIndices = numStrokes * indicesPerStroke; // 6480

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
  const points = curve.getSpacedPoints(segmentsPerStroke);

  console.log(`[Stroke ${stroke.id}] ${stroke.name}: ${points.length} points, s [${stroke.s0.toFixed(2)}, ${stroke.s1.toFixed(2)}]`);

  for (let j = 0; j < pointsPerStroke; j++) {
    const pt = points[j];
    const u = j / segmentsPerStroke;
    const s = stroke.s0 + u * (stroke.s1 - stroke.s0);

    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;

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

    const nx = -ty;
    const ny = tx;

    const v0 = vBase + j * 2;
    const v1 = vBase + j * 2 + 1;

    // Right vertex
    cpArray[v0 * 3 + 0] = pt.x;
    cpArray[v0 * 3 + 1] = pt.y;
    cpArray[v0 * 3 + 2] = 1.0;

    posArray[v0 * 3 + 0] = -nx;
    posArray[v0 * 3 + 1] = -ny;
    posArray[v0 * 3 + 2] = s;

    cdArray[v0] = stroke.cd;

    // Left vertex
    cpArray[v1 * 3 + 0] = pt.x;
    cpArray[v1 * 3 + 1] = pt.y;
    cpArray[v1 * 3 + 2] = 0.0;

    posArray[v1 * 3 + 0] = nx;
    posArray[v1 * 3 + 1] = ny;
    posArray[v1 * 3 + 2] = s;

    cdArray[v1] = stroke.cd;

    // Triangles
    if (j < segmentsPerStroke) {
      const quadV0 = vBase + j * 2;
      const quadV1 = vBase + j * 2 + 1;
      const quadV2 = vBase + (j + 1) * 2;
      const quadV3 = vBase + (j + 1) * 2 + 1;

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

console.log(`Bounding Box: X [${minX.toFixed(4)}, ${maxX.toFixed(4)}], Y [${minY.toFixed(4)}, ${maxY.toFixed(4)}]`);

// Quantize & Serialize Buffer (4-byte aligned)
const cpPacked = [{ from: minX, delta: maxX - minX }, { from: minY, delta: maxY - minY }, { from: 0, delta: 1 }];
const posPacked = [{ from: -1, delta: 2 }, { from: -1, delta: 2 }, { from: 0, delta: 1 }];
const cdPacked = [{ from: 0, delta: 1 }];

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
while ((4 + Buffer.byteLength(headerJson, 'utf8')) % 4 !== 0) headerJson += ' ';
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
console.log(`Buffer created: ${finalBuf.length} bytes (4-byte aligned: ${finalBuf.length % 4 === 0})`);

const outPath1 = path.resolve('assets/models/lines/line_reel.buf');
const outPath2 = path.resolve('dist/assets/models/lines/line_reel.buf');

fs.writeFileSync(outPath1, finalBuf);
console.log(`Saved: ${outPath1}`);

if (fs.existsSync(path.dirname(outPath2))) {
  fs.writeFileSync(outPath2, finalBuf);
  console.log(`Saved: ${outPath2}`);
}

console.log('=== BUFFER GENERATION COMPLETE ===');
