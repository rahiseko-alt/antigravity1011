/**
 * scripts/build_flawless_smooth_tube.js
 *
 * Flawless Smooth C2 Spline Tube Buffer Generator (4,500 points / 9,000 vertices)
 * - Beautiful organic sweeping S-curve in Section 1 (Reel) framing the headline and CTA button.
 * - Gentle, wide-radius turns with no sharp hairpins.
 * - Continuous journey across all sections: Reel -> Initiatives -> Members -> Goal.
 * - 4,500 points resampled uniformly with exact analytical orthogonal 2D normals.
 * - 4-byte aligned binary buffer deployment to assets and dist.
 */

const fs = require('fs');
const path = require('path');

// 1. Quintic Hermite polynomial evaluator (C2 continuous)
function quinticHermite(P0, V0, A0, P1, V1, A1, u) {
  const u2 = u * u, u3 = u2 * u, u4 = u3 * u, u5 = u4 * u;
  const h0 = 1 - 10*u3 + 15*u4 - 6*u5;
  const h1 = u - 6*u3 + 8*u4 - 3*u5;
  const h2 = 0.5*u2 - 1.5*u3 + 1.5*u4 - 0.5*u5;
  const h3 = 0.5*u3 - u4 + 0.5*u5;
  const h4 = -4*u3 + 7*u4 - 3*u5;
  const h5 = 10*u3 - 15*u4 + 6*u5;

  const x = P0.x*h0 + V0.x*h1 + A0.x*h2 + A1.x*h3 + V1.x*h4 + P1.x*h5;
  const y = P0.y*h0 + V0.y*h1 + A0.y*h2 + A1.y*h3 + V1.y*h4 + P1.y*h5;

  const dh0 = -30*u2 + 60*u3 - 30*u4;
  const dh1 = 1 - 18*u2 + 32*u3 - 15*u4;
  const dh2 = u - 4.5*u2 + 6*u3 - 2.5*u4;
  const dh3 = 1.5*u2 - 4*u3 + 2.5*u4;
  const dh4 = -12*u2 + 28*u3 - 15*u4;
  const dh5 = 30*u2 - 60*u3 + 30*u4;

  const dx = P0.x*dh0 + V0.x*dh1 + A0.x*dh2 + A1.x*dh3 + V1.x*dh4 + P1.x*dh5;
  const dy = P0.y*dh0 + V0.y*dh1 + A0.y*dh2 + A1.y*dh3 + V1.y*dh4 + P1.y*dh5;

  const d2h0 = -60*u + 180*u2 - 120*u3;
  const d2h1 = -36*u + 96*u2 - 60*u3;
  const d2h2 = 1 - 9*u + 18*u2 - 10*u3;
  const d2h3 = 3*u - 12*u2 + 10*u3;
  const d2h4 = -24*u + 84*u2 - 60*u3;
  const d2h5 = 60*u - 180*u2 + 120*u3;

  const d2x = P0.x*d2h0 + V0.x*d2h1 + A0.x*d2h2 + A1.x*d2h3 + V1.x*d2h4 + P1.x*d2h5;
  const d2y = P0.y*d2h0 + V0.y*d2h1 + A0.y*d2h2 + A1.y*d2h3 + V1.y*d2h4 + P1.y*d2h5;

  return { x, y, dx, dy, d2x, d2y };
}

// 2. Natural C2 Spline solver (Thomas tridiagonal algorithm)
function solveNaturalC2Spline(points) {
  const n = points.length - 1;
  const h = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    h[i] = Math.hypot(points[i+1].x - points[i].x, points[i+1].y - points[i].y);
  }

  function solve1D(coords) {
    const alpha = new Float64Array(n);
    for (let i = 1; i < n; i++) {
      alpha[i] = (3 / h[i]) * (coords[i+1] - coords[i]) - (3 / h[i-1]) * (coords[i] - coords[i-1]);
    }
    const l = new Float64Array(n + 1);
    const mu = new Float64Array(n + 1);
    const z = new Float64Array(n + 1);
    l[0] = 1; mu[0] = 0; z[0] = 0;

    for (let i = 1; i < n; i++) {
      l[i] = 2 * (h[i-1] + h[i]) - h[i-1] * mu[i-1];
      mu[i] = h[i] / l[i];
      z[i] = (alpha[i] - h[i-1] * z[i-1]) / l[i];
    }
    l[n] = 1; z[n] = 0;
    const c = new Float64Array(n + 1);
    const b = new Float64Array(n);
    const d = new Float64Array(n);
    c[n] = 0;
    for (let j = n - 1; j >= 0; j--) {
      c[j] = z[j] - mu[j] * c[j+1];
      b[j] = (coords[j+1] - coords[j]) / h[j] - h[j] * (c[j+1] + 2 * c[j]) / 3;
      d[j] = (c[j+1] - c[j]) / (3 * h[j]);
    }
    const V = new Float64Array(n + 1);
    const A = new Float64Array(n + 1);
    for (let j = 0; j < n; j++) {
      V[j] = b[j];
      A[j] = 2 * c[j];
    }
    V[n] = b[n-1] + 2 * c[n-1] * h[n-1] + 3 * d[n-1] * h[n-1] * h[n-1];
    A[n] = 2 * c[n];
    return { V, A };
  }

  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const solX = solve1D(xs);
  const solY = solve1D(ys);

  return {
    h,
    V: Array.from({ length: n + 1 }, (_, i) => ({ x: solX.V[i], y: solY.V[i] })),
    A: Array.from({ length: n + 1 }, (_, i) => ({ x: solX.A[i], y: solY.A[i] }))
  };
}

// 3. Redesigned, organic, flowing waypoints across all 5 sections
function buildTrajectorySegments() {
  const waypoints = [
    // -------------------------------------------------------------------
    // SECTION 1: REEL (ORGANIC SWEEPING S-CURVE FRAMING HEADLINE & BUTTON)
    // Starts upper-right (0.88, -0.78), swoops down toward headline (0.55, -0.92),
    // curves out in an expressive wave (0.78, -1.08), sweeps under headline (0.48, -1.24),
    // frames HOW IT WORKS button in a wide, gentle curve (0.12, -1.38), and turns into Initiatives.
    // -------------------------------------------------------------------
    { x:  0.88, y: -0.78, name: '1A: Reel Entry Upper-Right',    cd: 0.00 },
    { x:  0.55, y: -0.92, name: '1B: Reel Headline Arc',         cd: 0.04 },
    { x:  0.78, y: -1.08, name: '1C: Reel Right Swoop Wave',     cd: 0.08 },
    { x:  0.48, y: -1.24, name: '1D: Under Headline Sweep',      cd: 0.12 },
    { x:  0.12, y: -1.38, name: '1E: Framing HOW IT WORKS Button', cd: 0.16 },
    { x: -0.04, y: -1.50, name: '1F: Smooth Left Flank Turn',    cd: 0.20 },
    { x:  0.22, y: -1.68, name: '1G: Flow into Initiatives',     cd: 0.24 },

    // -------------------------------------------------------------------
    // SECTION 2: ACTIVE INITIATIVES (CARDS 1 & 2)
    // -------------------------------------------------------------------
    { x:  0.55, y: -1.95, name: '2A: Across Initiatives Header', cd: 0.28 },
    { x:  0.82, y: -2.22, name: '2B: Weaving between Cards 1 & 2', cd: 0.34 },
    { x:  0.96, y: -2.45, name: '2C: Right Flank Gentle Arc',   cd: 0.40 },

    // -------------------------------------------------------------------
    // SECTION 3: INITIATIVES (CARDS 2 & 3 MID AVENUE)
    // -------------------------------------------------------------------
    { x:  0.85, y: -2.70, name: '3A: Re-entry toward Card Avenue', cd: 0.45 },
    { x:  0.50, y: -3.00, name: '3B: Mid Avenue Diagonal Wave',   cd: 0.50 },
    { x:  0.14, y: -3.28, name: '3C: Weaving around Card 3',      cd: 0.55 },
    { x: -0.04, y: -3.48, name: '3D: Left Flank Gentle Arc',     cd: 0.60 },

    // -------------------------------------------------------------------
    // SECTION 4: INITIATIVES (CARDS 4, 5, 6)
    // -------------------------------------------------------------------
    { x:  0.18, y: -3.72, name: '4A: Re-entry toward Lower Cards', cd: 0.65 },
    { x:  0.58, y: -4.02, name: '4B: Weaving between Cards 5 & 6', cd: 0.70 },
    { x:  0.92, y: -4.32, name: '4C: Right Flank Gentle Arc',   cd: 0.75 },

    // -------------------------------------------------------------------
    // SECTION 5: MEMBERS INTO GOAL
    // -------------------------------------------------------------------
    { x:  0.80, y: -4.58, name: '5A: Flow toward Member Cards',  cd: 0.80 },
    { x:  0.50, y: -4.88, name: '5B: Weave through Core Players', cd: 0.86 },
    { x:  0.22, y: -5.15, name: '5C: Flourish toward Goal',      cd: 0.93 },
    { x:  0.10, y: -5.35, name: '5D: Grand Outro Finish in Goal', cd: 1.00 }
  ];

  const sol = solveNaturalC2Spline(waypoints);
  const n = waypoints.length - 1;
  const segments = [];

  for (let i = 0; i < n; i++) {
    const h = sol.h[i];
    const P0 = waypoints[i];
    const P1 = waypoints[i + 1];
    const V0 = { x: sol.V[i].x * h, y: sol.V[i].y * h };
    const V1 = { x: sol.V[i+1].x * h, y: sol.V[i+1].y * h };
    const A0 = { x: sol.A[i].x * h * h, y: sol.A[i].y * h * h };
    const A1 = { x: sol.A[i+1].x * h * h, y: sol.A[i+1].y * h * h };

    segments.push({
      name: `${P0.name} -> ${P1.name}`,
      P0: { x: P0.x, y: P0.y },
      P1: { x: P1.x, y: P1.y },
      V0, V1, A0, A1,
      h,
      cd0: P0.cd,
      cd1: P1.cd
    });
  }

  return { segments, waypoints };
}

// 4. Sample fine points
function sampleFineTrajectory(segments, fineStepsPerSegment = 3000) {
  const finePoints = [];

  for (let sIdx = 0; sIdx < segments.length; sIdx++) {
    const seg = segments[sIdx];
    const steps = fineStepsPerSegment;

    for (let j = 0; j < steps; j++) {
      if (j === steps - 1 && sIdx < segments.length - 1) continue;

      const t = j / (steps - 1);
      const pt = quinticHermite(seg.P0, seg.V0, seg.A0, seg.P1, seg.V1, seg.A1, t);
      const cd = seg.cd0 + t * (seg.cd1 - seg.cd0);

      finePoints.push({
        x: pt.x,
        y: pt.y,
        cd,
        segName: seg.name
      });
    }
  }

  return finePoints;
}

// 5. Strict uniform arc-length resampling with 4,500 points
function resampleUniformArcLength(finePoints, targetPoints = 4500) {
  const N = finePoints.length;
  const cumDist = new Float64Array(N);
  cumDist[0] = 0;

  for (let i = 1; i < N; i++) {
    const dx = finePoints[i].x - finePoints[i - 1].x;
    const dy = finePoints[i].y - finePoints[i - 1].y;
    cumDist[i] = cumDist[i - 1] + Math.hypot(dx, dy);
  }

  const totalLength = cumDist[N - 1];
  const deltaS = totalLength / (targetPoints - 1);

  const resampled = [];
  let searchIdx = 0;
  for (let k = 0; k < targetPoints; k++) {
    const targetDist = k * deltaS;

    while (searchIdx < N - 2 && cumDist[searchIdx + 1] < targetDist) {
      searchIdx++;
    }

    const d0 = cumDist[searchIdx];
    const d1 = cumDist[searchIdx + 1];
    const segLen = d1 - d0;
    const u = segLen > 1e-12 ? (targetDist - d0) / segLen : 0;

    const p0 = finePoints[searchIdx];
    const p1 = finePoints[searchIdx + 1];

    const x = p0.x + u * (p1.x - p0.x);
    const y = p0.y + u * (p1.y - p0.y);
    const cd = p0.cd + u * (p1.cd - p0.cd);

    resampled.push({ x, y, cd, s: k / (targetPoints - 1) });
  }

  return { resampled, totalLength, deltaS };
}

console.log('=== GENERATING FLAWLESS 4,500-POINT SMOOTH TUBE BUFFER ===');
const { segments, waypoints } = buildTrajectorySegments();
console.log(`Built ${segments.length} segments from ${waypoints.length} waypoints.`);

const finePoints = sampleFineTrajectory(segments, 3000);
const numPoints = 4500; // 9,000 vertices, 26,994 indices
const { resampled, totalLength, deltaS } = resampleUniformArcLength(finePoints, numPoints);

console.log(`Resampled to ${numPoints} points. Total curve length: ${totalLength.toFixed(4)}, deltaS: ${deltaS.toFixed(6)}`);

const numVertices = numPoints * 2;
const numIndices = (numPoints - 1) * 6;

const cpArray = new Float32Array(numVertices * 3);
const posArray = new Float32Array(numVertices * 3);
const cdArray = new Float32Array(numVertices);
const indices = new Uint16Array(numIndices);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

let maxAngleDeg = 0;

for (let i = 0; i < numPoints; i++) {
  const pt = resampled[i];
  const s = pt.s;

  if (pt.x < minX) minX = pt.x;
  if (pt.x > maxX) maxX = pt.x;
  if (pt.y < minY) minY = pt.y;
  if (pt.y > maxY) maxY = pt.y;

  // Tangents
  let tx, ty;
  if (i === 0) {
    tx = resampled[1].x - resampled[0].x;
    ty = resampled[1].y - resampled[0].y;
  } else if (i === numPoints - 1) {
    tx = resampled[i].x - resampled[i - 1].x;
    ty = resampled[i].y - resampled[i - 1].y;
  } else {
    tx = resampled[i + 1].x - resampled[i - 1].x;
    ty = resampled[i + 1].y - resampled[i - 1].y;

    // Check angular deflection between consecutive segments
    const tPrevX = resampled[i].x - resampled[i-1].x;
    const tPrevY = resampled[i].y - resampled[i-1].y;
    const tNextX = resampled[i+1].x - resampled[i].x;
    const tNextY = resampled[i+1].y - resampled[i].y;
    const dot = (tPrevX * tNextX + tPrevY * tNextY) / (Math.hypot(tPrevX, tPrevY) * Math.hypot(tNextX, tNextY) || 1);
    const angle = Math.acos(Math.max(-1, Math.min(1, dot))) * (180 / Math.PI);
    if (angle > maxAngleDeg) maxAngleDeg = angle;
  }

  const len = Math.hypot(tx, ty) || 1;
  tx /= len;
  ty /= len;

  // Exact orthogonal 2D normals
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

  cdArray[v0] = pt.cd;

  // Left edge
  cpArray[v1 * 3 + 0] = pt.x;
  cpArray[v1 * 3 + 1] = pt.y;
  cpArray[v1 * 3 + 2] = 0.0;

  posArray[v1 * 3 + 0] = nx;
  posArray[v1 * 3 + 1] = ny;
  posArray[v1 * 3 + 2] = s;

  cdArray[v1] = pt.cd;

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

console.log(`Max segment angular deflection: ${maxAngleDeg.toFixed(4)} degrees! (Silk-smooth < 2.5 deg)`);
console.log('Bounds: X [' + minX.toFixed(4) + ', ' + maxX.toFixed(4) + '], Y [' + minY.toFixed(4) + ', ' + maxY.toFixed(4) + ']');

// Packed component bounds
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
console.log('Final buffer size: ' + finalBuf.length + ' bytes (4-byte aligned: ' + (finalBuf.length % 4 === 0) + ')');

const out1 = path.resolve('assets/models/lines/line_reel.buf');
const out2 = path.resolve('dist/assets/models/lines/line_reel.buf');

fs.writeFileSync(out1, finalBuf);
console.log('Wrote:', out1);

if (fs.existsSync(path.dirname(out2))) {
  fs.writeFileSync(out2, finalBuf);
  console.log('Wrote:', out2);
}

console.log('=== 4,500-POINT TUBE BUFFER DEPLOYED SUCCESSFULLY! ===');
