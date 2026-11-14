const cp = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== GENERATING RIGHT-TO-LEFT REEL TUBE BUFFER (EXACT LUSION INVERSION) ===');

// 1. Read original 0cb5a99 line_reel.buf
const origBuf = cp.execSync('git show 0cb5a99:assets/models/lines/line_reel.buf');
const headerLen = origBuf.readUInt32LE(0);
const header = JSON.parse(origBuf.toString('utf8', 4, 4 + headerLen));
console.log('Original Header:', header);

let offset = 4 + headerLen;

// Unpack original attributes
const vCount = header.vertexCount;
const iCount = header.indexCount;

// CP: Int16Array
const cpBytes = vCount * 3 * 2;
const cpBuf = origBuf.subarray(offset, offset + cpBytes);
const cpRaw = new Int16Array(cpBuf.buffer, cpBuf.byteOffset, vCount * 3);
offset += cpBytes;

// indices: Uint16Array
const idxBytes = iCount * 2;
const idxBuf = origBuf.subarray(offset, offset + idxBytes);
const indices = new Uint16Array(idxBuf.buffer, idxBuf.byteOffset, iCount);
offset += idxBytes;

// position: Uint16Array
const posBytes = vCount * 3 * 2;
const posBuf = origBuf.subarray(offset, offset + posBytes);
const posRaw = new Uint16Array(posBuf.buffer, posBuf.byteOffset, vCount * 3);
offset += posBytes;

// Cd: Uint8Array
const cdBytes = vCount * 1;
const cdBuf = origBuf.subarray(offset, offset + cdBytes);
const cdRaw = new Uint8Array(cdBuf.buffer, cdBuf.byteOffset, vCount);

const cpDesc = header.attributes.find(a => a.id === 'CP').packedComponents;
const posDesc = header.attributes.find(a => a.id === 'position').packedComponents;

// Decode all vertices
const unpackedCP = new Float32Array(vCount * 3);
const unpackedPos = new Float32Array(vCount * 3);

for (let i = 0; i < vCount; i++) {
  // CP: unpack X, Y, Z
  const normX = (cpRaw[i * 3 + 0] + 32768) / 65535;
  const normY = (cpRaw[i * 3 + 1] + 32768) / 65535;
  const normZ = (cpRaw[i * 3 + 2] + 32768) / 65535;

  const origX = cpDesc[0].from + normX * cpDesc[0].delta;
  const origY = cpDesc[1].from + normY * cpDesc[1].delta;
  const origZ = cpDesc[2].from + normZ * cpDesc[2].delta;

  // Invert X: 1.0 - origX (Right to Left!)
  unpackedCP[i * 3 + 0] = 1.0 - origX;
  unpackedCP[i * 3 + 1] = origY;
  unpackedCP[i * 3 + 2] = origZ; // v_s (0.0 to 1.0)

  // position (normal offset nx, ny, and ratio s)
  const normPx = posRaw[i * 3 + 0] / 65535;
  const normPy = posRaw[i * 3 + 1] / 65535;
  const normPz = posRaw[i * 3 + 2] / 65535;

  const origPx = posDesc[0].from + normPx * posDesc[0].delta;
  const origPy = posDesc[1].from + normPy * posDesc[1].delta;
  const origPz = posDesc[2].from + normPz * posDesc[2].delta;

  // Invert normal nx because X is flipped
  unpackedPos[i * 3 + 0] = -origPx;
  unpackedPos[i * 3 + 1] = origPy;
  unpackedPos[i * 3 + 2] = origPz;
}

// Compute new bounds for CP
let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

for (let i = 0; i < vCount; i++) {
  const x = unpackedCP[i * 3 + 0];
  const y = unpackedCP[i * 3 + 1];
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
  if (y < minY) minY = y;
  if (y > maxY) maxY = y;
}

console.log(`New Right-to-Left Bounds: X [${minX.toFixed(4)}, ${maxX.toFixed(4)}], Y [${minY.toFixed(4)}, ${maxY.toFixed(4)}]`);

const newCpPacked = [
  { from: minX, delta: maxX - minX },
  { from: minY, delta: maxY - minY },
  { from: 0, delta: 1 }
];

const newPosPacked = [
  { from: -1, delta: 2 },
  { from: -1, delta: 2 },
  { from: 0, delta: 1 }
];

const newCdPacked = [
  { from: 0, delta: 1 }
];

const newHeader = {
  vertexCount: vCount,
  indexCount: iCount,
  attributes: [
    { id: 'CP', needsPack: true, componentSize: 3, storageType: 'Int16Array', packedComponents: newCpPacked },
    { id: 'indices', needsPack: false, componentSize: 1, storageType: 'Uint16Array' },
    { id: 'position', needsPack: true, componentSize: 3, storageType: 'Uint16Array', packedComponents: newPosPacked },
    { id: 'Cd', needsPack: true, componentSize: 1, storageType: 'Uint8Array', packedComponents: newCdPacked }
  ],
  meshType: 'Mesh'
};

let headerJson = JSON.stringify(newHeader);
while ((4 + Buffer.byteLength(headerJson, 'utf8')) % 4 !== 0) {
  headerJson += ' ';
}

const headerBuf = Buffer.from(headerJson, 'utf8');
const headerLenBuf = Buffer.alloc(4);
headerLenBuf.writeUInt32LE(headerBuf.length, 0);

// Pack CP
const outCpRaw = new Int16Array(vCount * 3);
for (let i = 0; i < vCount; i++) {
  for (let c = 0; c < 3; c++) {
    const val = unpackedCP[i * 3 + c];
    const norm = Math.max(0, Math.min(1, (val - newCpPacked[c].from) / newCpPacked[c].delta));
    outCpRaw[i * 3 + c] = Math.round(norm * 65535) - 32768;
  }
}

// Pack position
const outPosRaw = new Uint16Array(vCount * 3);
for (let i = 0; i < vCount; i++) {
  for (let c = 0; c < 3; c++) {
    const val = unpackedPos[i * 3 + c];
    const norm = Math.max(0, Math.min(1, (val - newPosPacked[c].from) / newPosPacked[c].delta));
    outPosRaw[i * 3 + c] = Math.round(norm * 65535);
  }
}

const outBuf = Buffer.concat([
  headerLenBuf,
  headerBuf,
  Buffer.from(outCpRaw.buffer, outCpRaw.byteOffset, outCpRaw.byteLength),
  Buffer.from(indices.buffer, indices.byteOffset, indices.byteLength),
  Buffer.from(outPosRaw.buffer, outPosRaw.byteOffset, outPosRaw.byteLength),
  Buffer.from(cdRaw.buffer, cdRaw.byteOffset, cdRaw.byteLength)
]);

console.log(`Final Buffer Size: ${outBuf.length} bytes (4-byte aligned: ${outBuf.length % 4 === 0})`);

fs.writeFileSync('assets/models/lines/line_reel.buf', outBuf);
if (fs.existsSync('dist/assets/models/lines/line_reel.buf')) {
  fs.writeFileSync('dist/assets/models/lines/line_reel.buf', outBuf);
}

console.log('Successfully written assets/models/lines/line_reel.buf!');
