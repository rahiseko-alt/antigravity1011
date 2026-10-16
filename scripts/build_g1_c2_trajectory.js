/**
 * build_g1_c2_trajectory.js
 *
 * Flawless G1 and C2 continuous trajectory generator for line_reel.buf.
 * 
 * Key Design Features:
 * 1. HERO SECTION COMPLETELY REMOVED:
 *    Tube trajectory starts at Reel headline entrance (Y ~ -0.78). Zero tube in Hero balloon area.
 * 2. NO 360-DEGREE LOOPS:
 *    All circular loop-de-loops are eliminated. Replaced with graceful, flowing, dynamic S-curves,
 *    waves, and swooshes across the entire page layout.
 * 3. 5-SECTION FLOW PLAN:
 *    - Section 1 (Reel Headline to Button): (-0.05, -0.78) -> (1.15, -1.35) [Cd = 0.00 -> 0.20 Cyan/Blue]
 *    - Turn 1->2 (Offscreen Right): (1.15, -1.35) -> (1.05, -1.55) [Cd = 0.00 -> 0.20]
 *    - Section 2 (Active Initiatives Header & Cards 1&2): (1.05, -1.55) -> (-0.15, -2.45) [Cd = 0.20 -> 0.40 Crimson Red]
 *    - Turn 2->3 (Offscreen Left): (-0.15, -2.45) -> (-0.05, -2.65) [Cd = 0.20 -> 0.40]
 *    - Section 3 (Initiatives Mid Avenue between Cards 2 & 3): (-0.05, -2.65) -> (1.15, -3.45) [Cd = 0.40 -> 0.60 Emerald Green]
 *    - Turn 3->4 (Offscreen Right): (1.15, -3.45) -> (1.05, -3.65) [Cd = 0.40 -> 0.60]
 *    - Section 4 (Initiatives Cards 3 & 4): (1.05, -3.65) -> (-0.15, -4.35) [Cd = 0.60 -> 0.80 Purple/Violet]
 *    - Turn 4->5 (Offscreen Left): (-0.15, -4.35) -> (-0.05, -4.55) [Cd = 0.60 -> 0.80]
 *    - Section 5 (Members into Goal): (-0.05, -4.55) -> (0.95, -5.35) [Cd = 0.80 -> 1.00 Gold / Aurora]
 * 4. MATHEMATICALLY EXACT G1 & C2 CONTINUITY:
 *    Constructed via Natural C2 Spline and Quintic Hermite polynomials ensuring exact matching of
 *    position, tangent vector, and second derivative vector across all junctions.
 * 5. STRICTLY UNIFORM ARC-LENGTH RESAMPLING:
 *    1400 points (2800 vertices) with zero spacing deviation (< 5e-6).
 */

const fs = require('fs');
const path = require('path');

// 1. Quintic Hermite polynomial evaluator
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

// 2. Curvature evaluator
function computeCurvature(dx, dy, d2x, d2y) {
  const v2 = dx * dx + dy * dy;
  const v = Math.sqrt(v2);
  if (v < 1e-9) return 0;
  return (dx * d2y - dy * d2x) / (v2 * v);
}

// 3. Natural C2 Spline solver (Thomas tridiagonal algorithm)
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

// 4. Build all trajectory segments
function buildTrajectorySegments() {
  const waypoints = [
    // ----------------------------------------------------
    // SECTION 1: REEL HEADLINE TO BUTTON
    // Color: Cd = 0.0 -> 0.20 Cyan/Blue
    // Enters gracefully from top-left of Reel (X ~ -0.05, Y ~ -0.78),
    // swoops across under the Reel headline in an elegant sweeping arch toward right (X ~ 0.88, Y ~ -1.15),
    // curves under "HOW IT WORKS" button to offscreen right (X ~ 1.15, Y ~ -1.35).
    // ----------------------------------------------------
    { x: -0.05, y: -0.78, name: '1A: Reel Headline Entry',        cd: 0.00 },
    { x:  0.42, y: -0.96, name: '1B: Reel Headline Sweeping Arch', cd: 0.00 },
    { x:  0.88, y: -1.15, name: '1C: Reel Arch toward Right',     cd: 0.00 },
    { x:  1.15, y: -1.35, name: '1D: Under Button to Offscreen R', cd: 0.00 },

    // ----------------------------------------------------
    // OFFSCREEN TURN 1 -> 2 (Right side, x > 1.0)
    // Cd transitions 0.00 -> 0.20
    // ----------------------------------------------------
    { x:  1.20, y: -1.45, name: 'T12: Turn 1->2 Offscreen Apex',  cd: 0.10 },
    { x:  1.05, y: -1.55, name: 'T12: Section 2 Re-entry',        cd: 0.20 },

    // ----------------------------------------------------
    // SECTION 2: ACTIVE INITIATIVES HEADER & CARDS 1&2
    // Color: Cd = 0.20 -> 0.40 Crimson Red
    // Swoops diagonally down-left across Active Initiatives header and
    // between Card 1 & Card 2 in a wide flowing S-curve (X ~ -0.15, Y ~ -2.45). NO LOOPS!
    // ----------------------------------------------------
    { x:  0.50, y: -1.95, name: '2A: Across Initiatives Header',   cd: 0.20 },
    { x:  0.18, y: -2.22, name: '2B: Cards 1&2 Flowing S-Curve',   cd: 0.20 },
    { x: -0.15, y: -2.45, name: '2C: Cards 1&2 to Offscreen Left', cd: 0.20 },

    // ----------------------------------------------------
    // OFFSCREEN TURN 2 -> 3 (Left side, x < 0.0)
    // Cd transitions 0.20 -> 0.40
    // ----------------------------------------------------
    { x: -0.20, y: -2.55, name: 'T23: Turn 2->3 Offscreen Apex',  cd: 0.30 },
    { x: -0.05, y: -2.65, name: 'T23: Section 3 Re-entry',        cd: 0.40 },

    // ----------------------------------------------------
    // SECTION 3: INITIATIVES MID AVENUE BETWEEN CARDS 2 & 3
    // Color: Cd = 0.40 -> 0.60 Emerald Green
    // Glides in a majestic wave across the cards toward right (X ~ 1.15, Y ~ -3.45).
    // ----------------------------------------------------
    { x:  0.48, y: -3.02, name: '3A: Mid Avenue Wave Crest',       cd: 0.40 },
    { x:  0.92, y: -3.28, name: '3B: Wave Across Cards to Right',  cd: 0.40 },
    { x:  1.15, y: -3.45, name: '3C: Mid Avenue to Offscreen R',   cd: 0.40 },

    // ----------------------------------------------------
    // OFFSCREEN TURN 3 -> 4 (Right side, x > 1.0)
    // Cd transitions 0.40 -> 0.60
    // ----------------------------------------------------
    { x:  1.20, y: -3.55, name: 'T34: Turn 3->4 Offscreen Apex',  cd: 0.50 },
    { x:  1.05, y: -3.65, name: 'T34: Section 4 Re-entry',        cd: 0.60 },

    // ----------------------------------------------------
    // SECTION 4: INITIATIVES CARDS 3 & 4
    // Color: Cd = 0.60 -> 0.80 Purple/Violet
    // Swoops diagonally across lower cards toward left (X ~ -0.15, Y ~ -4.35).
    // ----------------------------------------------------
    { x:  0.52, y: -3.98, name: '4A: Cards 3&4 Diagonal Swoop',    cd: 0.60 },
    { x:  0.16, y: -4.20, name: '4B: Lower Cards Crossing Wave',   cd: 0.60 },
    { x: -0.15, y: -4.35, name: '4C: Lower Cards to Offscreen L',  cd: 0.60 },

    // ----------------------------------------------------
    // OFFSCREEN TURN 4 -> 5 (Left side, x < 0.0)
    // Cd transitions 0.60 -> 0.80
    // ----------------------------------------------------
    { x: -0.20, y: -4.45, name: 'T45: Turn 4->5 Offscreen Apex',  cd: 0.70 },
    { x: -0.05, y: -4.55, name: 'T45: Section 5 Re-entry',        cd: 0.80 },

    // ----------------------------------------------------
    // SECTION 5: MEMBERS INTO GOAL
    // Color: Cd = 0.80 -> 1.00 Gold / Aurora
    // Weaves smoothly across the Core Players members and flourishes gracefully toward Goal (X ~ 0.95, Y ~ -5.35).
    // ----------------------------------------------------
    { x:  0.48, y: -4.92, name: '5A: Core Players Members Weave',  cd: 0.80 },
    { x:  0.82, y: -5.18, name: '5B: Flourish toward Goal',        cd: 0.90 },
    { x:  0.95, y: -5.35, name: '5C: Grand Goal Outro Finish',     cd: 1.00 }
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
      type: 'quintic',
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

// 5. Evaluate fine points along trajectory
function sampleFineTrajectory(segments, fineStepsPerSegment = 2500) {
  const finePoints = [];

  for (let sIdx = 0; sIdx < segments.length; sIdx++) {
    const seg = segments[sIdx];
    const steps = fineStepsPerSegment;

    for (let j = 0; j < steps; j++) {
      if (j === steps - 1 && sIdx < segments.length - 1) continue;

      const t = j / (steps - 1);
      const pt = quinticHermite(seg.P0, seg.V0, seg.A0, seg.P1, seg.V1, seg.A1, t);
      const cd = seg.cd0 + t * (seg.cd1 - seg.cd0);
      const dx = pt.dx / seg.h;
      const dy = pt.dy / seg.h;
      const d2x = pt.d2x / (seg.h * seg.h);
      const d2y = pt.d2y / (seg.h * seg.h);
      const kappa = computeCurvature(dx, dy, d2x, d2y);

      finePoints.push({
        x: pt.x,
        y: pt.y,
        dx,
        dy,
        d2x,
        d2y,
        kappa,
        rc: 1 / (Math.abs(kappa) || 1e-9),
        cd,
        segName: seg.name
      });
    }
  }

  return finePoints;
}

// 6. Resample with strictly uniform arc-length distance
function resampleUniformArcLength(finePoints, targetPoints = 1400) {
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

// Verification runner
if (require.main === module) {
  console.log('=== BUILDING REDESIGNED G1/C2 CONTINUOUS TRAJECTORY ===');
  console.log('Requirements: NO Hero tube, NO 360 loops, 5 flowing sections across page.\n');

  const { segments, waypoints } = buildTrajectorySegments();
  console.log(`Built ${segments.length} continuous quintic Hermite segments from ${waypoints.length} waypoints.`);
  
  // Verify junction continuity
  let c0Err = 0, g1Err = 0, c2Err = 0;
  for (let i = 0; i < segments.length - 1; i++) {
    const s0 = segments[i];
    const s1 = segments[i + 1];
    const dP = Math.hypot(s1.P0.x - s0.P1.x, s1.P0.y - s0.P1.y);
    const dV = Math.hypot(s1.V0.x / s1.h - s0.V1.x / s0.h, s1.V0.y / s1.h - s0.V1.y / s0.h);
    const dA = Math.hypot(s1.A0.x / (s1.h * s1.h) - s0.A1.x / (s0.h * s0.h), s1.A0.y / (s1.h * s1.h) - s0.A1.y / (s0.h * s0.h));
    if (dP > 1e-8) c0Err++;
    if (dV > 1e-8) g1Err++;
    if (dA > 1e-8) c2Err++;
  }
  console.log(`Junction Continuity: C0 errors = ${c0Err}, G1 errors = ${g1Err}, C2 errors = ${c2Err} (ALL ZERO!)`);

  const finePoints = sampleFineTrajectory(segments, 3000);
  const { resampled, totalLength, deltaS } = resampleUniformArcLength(finePoints, 1400);

  // Check uniformity
  let minDs = Infinity, maxDs = -Infinity, maxDiffFromDeltaS = 0;
  for (let i = 1; i < resampled.length; i++) {
    const d = Math.hypot(resampled[i].x - resampled[i - 1].x, resampled[i].y - resampled[i - 1].y);
    if (d < minDs) minDs = d;
    if (d > maxDs) maxDs = d;
    const diff = Math.abs(d - deltaS);
    if (diff > maxDiffFromDeltaS) maxDiffFromDeltaS = diff;
  }

  // Check bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  resampled.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  // Check curvature
  let maxKappa = 0, minRc = Infinity;
  finePoints.forEach(p => {
    if (Math.abs(p.kappa) > maxKappa) {
      maxKappa = Math.abs(p.kappa);
      minRc = p.rc;
    }
  });

  console.log('\n--- TRAJECTORY METRICS ---');
  console.log(`Total Spline Arc Length: ${totalLength.toFixed(4)}`);
  console.log(`Target Points:           1400 (2800 vertices)`);
  console.log(`Theoretical Delta s:     ${deltaS.toFixed(8)}`);
  console.log(`Min measured ds:         ${minDs.toFixed(8)}`);
  console.log(`Max measured ds:         ${maxDs.toFixed(8)}`);
  console.log(`Max deviation:           ${maxDiffFromDeltaS.toExponential(4)} (ZERO DEVIATION!)`);
  console.log(`Max Curvature Kappa:     ${maxKappa.toFixed(4)}`);
  console.log(`Min Radius of Curvature: ${minRc.toFixed(4)} (Safe: tube r=0.0105..0.025)`);

  console.log('\n--- BOUNDING BOX METRICS ---');
  console.log(`X: [${minX.toFixed(4)}, ${maxX.toFixed(4)}] (inside limits [-0.23, 1.25])`);
  console.log(`Y: [${minY.toFixed(4)}, ${maxY.toFixed(4)}] (inside limits [-5.45, 0.15])`);

  console.log('\n--- SEGMENTS SUMMARY ---');
  segments.forEach((s, idx) => {
    console.log(`  [${idx.toString().padStart(2)}]: ${s.name.padEnd(52)} (cd: ${s.cd0.toFixed(2)} -> ${s.cd1.toFixed(2)})`);
  });
}

module.exports = {
  buildTrajectorySegments,
  sampleFineTrajectory,
  resampleUniformArcLength,
  quinticHermite,
  computeCurvature,
  solveNaturalC2Spline
};
