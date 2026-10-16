const fs = require('fs');
const path = require('path');

console.log('=== GENERATING 5-STROKE 45-DEGREE DISJOINT RIBBON GEOMETRY ===');

// Definition of 5 independent 45-degree diagonal strokes
// Screen normalized width: 0.0 to 0.87157 (corresponds to full viewport width at 1920x1080)
const strokeDefinitions = [
  {
    id: 1,
    name: 'Stroke 1 (Left to Right, 45° down)',
    x0: -0.02, y0: -0.05,
    x1:  0.89, y1: -0.60,
    s0: 0.00,  s1: 0.20,
    cd: 0.0
  },
  {
    id: 2,
    name: 'Stroke 2 (Right to Left, 45° down)',
    x0:  0.89, y0: -0.72,
    x1: -0.02, y1: -1.27,
    s0: 0.20,  s1: 0.40,
    cd: 0.25
  },
  {
    id: 3,
    name: 'Stroke 3 (Left to Right, 45° down)',
    x0: -0.02, y0: -1.39,
    x1:  0.89, y1: -1.94,
    s0: 0.40,  s1: 0.60,
    cd: 0.50
  },
  {
    id: 4,
    name: 'Stroke 4 (Right to Left, 45° down)',
    x0:  0.89, y0: -2.06,
    x1: -0.02, y1: -2.61,
    s0: 0.60,  s1: 0.80,
    cd: 0.75
  },
  {
    id: 5,
    name: 'Stroke 5 (Left to Right, 45° down)',
    x0: -0.02, y0: -2.73,
    x1:  0.89, y1: -3.28,
    s0: 0.80,  s1: 1.00,
    cd: 1.00
  }
];

const segmentsPerStroke = 80;
const pointsPerStroke = segmentsPerStroke + 1; // 81 points
const verticesPerStroke = pointsPerStroke * 2; // 162 vertices
const indicesPerStroke = segmentsPerStroke * 6; // 480 indices (80 quads * 2 triangles * 3 indices)

const numStrokes = strokeDefinitions.length; // 5
const numVertices = numStrokes * verticesPerStroke; // 810 vertices
const numIndices = numStrokes * indicesPerStroke; // 2400 indices

const cpArray = new Float32Array(numVertices * 3);
const posArray = new Float32Array(numVertices * 3);
const cdArray = new Float32Array(numVertices);
const indices = new Uint16Array(numIndices);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

strokeDefinitions.forEach((stroke, k) => {
  const vBase = k * verticesPerStroke;
  const idxBase = k * indicesPerStroke;

  const dx = stroke.x1 - stroke.x0;
  const dy = stroke.y1 - stroke.y0;
  const len = Math.hypot(dx, dy) || 1;
  const tx = dx / len;
  const ty = dy / len;

  // Normal perpendicular to tangent: 90 deg counter-clockwise
  const nx = -ty;
  const ny = tx;

  console.log(`[Stroke ${stroke.id}] ${stroke.name}`);
  console.log(`  Start: (${stroke.x0.toFixed(2)}, ${stroke.y0.toFixed(2)}), End: (${stroke.x1.toFixed(2)}, ${stroke.y1.toFixed(2)})`);
  console.log(`  Tangent: (${tx.toFixed(4)}, ${ty.toFixed(4)}), Normal: (${nx.toFixed(4)}, ${ny.toFixed(4)})`);
  console.log(`  s-range: [${stroke.s0.toFixed(2)}, ${stroke.s1.toFixed(2)}], Cd: ${stroke.cd.toFixed(2)}`);

  // Generate vertices along stroke
  for (let j = 0; j < pointsPerStroke; j++) {
    const u = j / segmentsPerStroke;
    const px = stroke.x0 + u * (stroke.x1 - stroke.x0);
    const py = stroke.y0 + u * (stroke.y1 - stroke.y0);
    const s = stroke.s0 + u * (stroke.s1 - stroke.s0);

    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;

    const v0 = vBase + j * 2;     // right edge
    const v1 = vBase + j * 2 + 1; // left edge

    // Right edge vertex: pos=(-nx, -ny, s), CP.z = 1.0
    cpArray[v0 * 3 + 0] = px;
    cpArray[v0 * 3 + 1] = py;
    cpArray[v0 * 3 + 2] = 1.0;

    posArray[v0 * 3 + 0] = -nx;
    posArray[v0 * 3 + 1] = -ny;
    posArray[v0 * 3 + 2] = s;

    cdArray[v0] = stroke.cd;

    // Left edge vertex: pos=(nx, ny, s), CP.z = 0.0
    cpArray[v1 * 3 + 0] = px;
    cpArray[v1 * 3 + 1] = py;
    cpArray[v1 * 3 + 2] = 0.0;

    posArray[v1 * 3 + 0] = nx;
    posArray[v1 * 3 + 1] = ny;
    posArray[v1 * 3 + 2] = s;

    cdArray[v1] = stroke.cd;

    // Quads within stroke (NO connections to other strokes)
    if (j < segmentsPerStroke) {
      const quadV0 = vBase + j * 2;
      const quadV1 = vBase + j * 2 + 1;
      const quadV2 = vBase + (j + 1) * 2;
      const quadV3 = vBase + (j + 1) * 2 + 1;

      // Exact original winding: [v0, v3, v1, v3, v0, v2]
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
