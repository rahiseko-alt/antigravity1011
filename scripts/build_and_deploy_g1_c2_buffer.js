
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

// 2. Analytical Loop evaluator
function evaluateLoop(xc, yc, rx, ry, theta0, deltaTheta, yDriftTotal, t) {
  // t from 0 to 1
  const theta = theta0 + t * deltaTheta;
  const yDrift = yDriftTotal * (t - 0.5);

  const x = xc + rx * Math.cos(theta);
  const y = yc + ry * Math.sin(theta) + yDrift;

  // Derivatives wrt t
  // dx/dt = (dx/dtheta) * deltaTheta
  const dx = -rx * Math.sin(theta) * deltaTheta;
  const dy = (ry * Math.cos(theta) * deltaTheta) + yDriftTotal;

  // d2x/dt2 = (d2x/dtheta2) * (deltaTheta)^2
  const d2x = -rx * Math.cos(theta) * (deltaTheta * deltaTheta);
  const d2y = -ry * Math.sin(theta) * (deltaTheta * deltaTheta);

  return { x, y, dx, dy, d2x, d2y };
}

function computeCurvature(dx, dy, d2x, d2y) {
  const v2 = dx * dx + dy * dy;
  const v = Math.sqrt(v2);
  if (v < 1e-9) return 0;
  return (dx * d2y - dy * d2x) / (v2 * v);
}

// Build all continuous segments
function buildTrajectorySegments() {
  const segments = [];

  // ----------------------------------------------------
  // SECTION 1: HERO ENTRY & BALLOONS LOOP
  // Color: Cd = 0.00
  // ----------------------------------------------------
  const L1_xc = 0.48, L1_yc = -0.24, L1_rx = 0.21, L1_ry = 0.12;
  const L1_theta0 = -Math.PI * 0.60;
  const L1_deltaTheta = Math.PI * 2.10;
  const L1_yDrift = -0.040;

  // Loop 1 at t=0
  const L1_start = evaluateLoop(L1_xc, L1_yc, L1_rx, L1_ry, L1_theta0, L1_deltaTheta, L1_yDrift, 0);
  // Loop 1 at t=1
  const L1_end = evaluateLoop(L1_xc, L1_yc, L1_rx, L1_ry, L1_theta0, L1_deltaTheta, L1_yDrift, 1);

  // Segment 1A: Hero Entry Lead-in (Quintic Hermite to Loop 1)
  const P0_1A = { x: -0.03, y: -0.05 };
  const chord_1A = Math.hypot(L1_start.x - P0_1A.x, L1_start.y - P0_1A.y);
  const V0_1A = { x: chord_1A * 0.95, y: -chord_1A * 0.25 };
  const A0_1A = { x: 0, y: 0 };

  const V1_len_1A = Math.hypot(L1_start.dx, L1_start.dy);
  const alpha_1A = chord_1A / V1_len_1A;
  const V1_1A = { x: alpha_1A * L1_start.dx, y: alpha_1A * L1_start.dy };
  const A1_1A = { x: alpha_1A * alpha_1A * L1_start.d2x, y: alpha_1A * alpha_1A * L1_start.d2y };

  segments.push({
    name: '1A: Hero Entry Lead-in',
    type: 'quintic',
    cd0: 0.00, cd1: 0.00,
    P0: P0_1A, V0: V0_1A, A0: A0_1A,
    P1: { x: L1_start.x, y: L1_start.y }, V1: V1_1A, A1: A1_1A
  });

  // Segment 1B: Hero Balloons Loop (Analytical Loop)
  segments.push({
    name: '1B: Hero Balloons Loop',
    type: 'loop',
    cd0: 0.00, cd1: 0.00,
    xc: L1_xc, yc: L1_yc, rx: L1_rx, ry: L1_ry,
    theta0: L1_theta0, deltaTheta: L1_deltaTheta, yDrift: L1_yDrift
  });

  // Segment 1C: Hero Loop Lead-out (Quintic Hermite to Offscreen Right)
  const P1_1C = { x: 1.08, y: -0.62 };
  const chord_1C = Math.hypot(P1_1C.x - L1_end.x, P1_1C.y - L1_end.y);
  const V0_len_1C = Math.hypot(L1_end.dx, L1_end.dy);
  const beta_1C = chord_1C / V0_len_1C;
  const V0_1C = { x: beta_1C * L1_end.dx, y: beta_1C * L1_end.dy };
  const A0_1C = { x: beta_1C * beta_1C * L1_end.d2x, y: beta_1C * beta_1C * L1_end.d2y };

  const V1_1C = { x: chord_1C * 0.90, y: -chord_1C * 0.40 };
  const A1_1C = { x: 0, y: 0 };

  segments.push({
    name: '1C: Hero Loop Lead-out',
    type: 'quintic',
    cd0: 0.00, cd1: 0.00,
    P0: { x: L1_end.x, y: L1_end.y }, V0: V0_1C, A0: A0_1C,
    P1: P1_1C, V1: V1_1C, A1: A1_1C
  });

  // ----------------------------------------------------
  // OFFSCREEN TURN 1 -> 2 (Right side, x > 1.0)
  // Cd transitions 0.00 -> 0.20
  // ----------------------------------------------------
  const P0_T12 = P1_1C;
  const V0_T12 = V1_1C;
  const A0_T12 = A1_1C;

  const P1_T12 = { x: 1.08, y: -0.72 };
  const chord_T12 = Math.hypot(P1_T12.x - P0_T12.x, P1_T12.y - P0_T12.y);
  // Coming back heading down-left
  const V1_T12 = { x: -chord_T12 * 2.0, y: -chord_T12 * 1.5 };
  const A1_T12 = { x: 0, y: 0 };

  segments.push({
    name: 'Turn 1->2 (Offscreen Right)',
    type: 'quintic',
    cd0: 0.00, cd1: 0.20,
    P0: P0_T12, V0: { x: chord_T12 * 2.0, y: -chord_T12 * 1.5 }, A0: A0_T12,
    P1: P1_T12, V1: V1_T12, A1: A1_T12
  });

  // ----------------------------------------------------
  // SECTION 2: REEL HEADLINE FLOWING S-SWOOP
  // Color: Cd = 0.20
  // ----------------------------------------------------
  const P0_2 = P1_T12;
  const V0_2 = V1_T12;
  const A0_2 = A1_T12;

  // We split into two smooth segments:
  // 2A: swoop under headline to wave crest (0.36, -0.94)
  const P1_2A = { x: 0.36, y: -0.94 };
  const chord_2A = Math.hypot(P1_2A.x - P0_2.x, P1_2A.y - P0_2.y);
  const V1_2A = { x: -chord_2A * 0.95, y: -chord_2A * 0.35 };
  const A1_2A = { x: 0, y: 0 };

  segments.push({
    name: '2A: Reel Headline Swoop',
    type: 'quintic',
    cd0: 0.20, cd1: 0.20,
    P0: P0_2, V0: V0_2, A0: A0_2,
    P1: P1_2A, V1: V1_2A, A1: A1_2A
  });

  // 2B: wave crest descending to offscreen left (-0.10, -1.22)
  const P0_2B = P1_2A;
  const V0_2B = V1_2A;
  const A0_2B = A1_2A;
  const P1_2B = { x: -0.10, y: -1.22 };
  const chord_2B = Math.hypot(P1_2B.x - P0_2B.x, P1_2B.y - P0_2B.y);
  const V1_2B = { x: -chord_2B * 0.85, y: -chord_2B * 0.55 };
  const A1_2B = { x: 0, y: 0 };

  segments.push({
    name: '2B: Reel Crest to Offscreen Left',
    type: 'quintic',
    cd0: 0.20, cd1: 0.20,
    P0: P0_2B, V0: V0_2B, A0: A0_2B,
    P1: P1_2B, V1: V1_2B, A1: A1_2B
  });

  // ----------------------------------------------------
  // OFFSCREEN TURN 2 -> 3 (Left side, x < 0.0)
  // Cd transitions 0.20 -> 0.40
  // ----------------------------------------------------
  const P0_T23 = P1_2B;
  const P1_T23 = { x: -0.06, y: -1.26 };
  const chord_T23 = Math.hypot(P1_T23.x - P0_T23.x, P1_T23.y - P0_T23.y);
  const V0_T23 = { x: -chord_T23 * 2.0, y: -chord_T23 * 1.5 };
  const V1_T23 = { x: chord_T23 * 2.5, y: -chord_T23 * 0.8 };

  segments.push({
    name: 'Turn 2->3 (Offscreen Left)',
    type: 'quintic',
    cd0: 0.20, cd1: 0.40,
    P0: P0_T23, V0: V0_T23, A0: { x: 0, y: 0 },
    P1: P1_T23, V1: V1_T23, A1: { x: 0, y: 0 }
  });

  // ----------------------------------------------------
  // SECTION 3: HOW IT WORKS / INITIATIVES HEADER GORGEOUS ROUND LOOP
  // Color: Cd = 0.40
  // ----------------------------------------------------
  const L2_xc = 0.50, L2_yc = -1.46, L2_rx = 0.228, L2_ry = 0.14;
  const L2_theta0 = -Math.PI * 0.60;
  const L2_deltaTheta = Math.PI * 2.10;
  const L2_yDrift = -0.040;

  const L2_start = evaluateLoop(L2_xc, L2_yc, L2_rx, L2_ry, L2_theta0, L2_deltaTheta, L2_yDrift, 0);
  const L2_end = evaluateLoop(L2_xc, L2_yc, L2_rx, L2_ry, L2_theta0, L2_deltaTheta, L2_yDrift, 1);

  // Segment 3A: Lead-in from offscreen left into Loop 2 (EXACT G1 & C2!)
  const P0_3A = P1_T23;
  const V0_3A = V1_T23;
  const A0_3A = { x: 0, y: 0 };

  const chord_3A = Math.hypot(L2_start.x - P0_3A.x, L2_start.y - P0_3A.y);
  const V1_len_3A = Math.hypot(L2_start.dx, L2_start.dy);
  const alpha_3A = chord_3A / V1_len_3A;
  const V1_3A = { x: alpha_3A * L2_start.dx, y: alpha_3A * L2_start.dy };
  const A1_3A = { x: alpha_3A * alpha_3A * L2_start.d2x, y: alpha_3A * alpha_3A * L2_start.d2y };

  segments.push({
    name: '3A: Initiatives Loop Lead-in (Flawless G1/C2)',
    type: 'quintic',
    cd0: 0.40, cd1: 0.40,
    P0: P0_3A, V0: V0_3A, A0: A0_3A,
    P1: { x: L2_start.x, y: L2_start.y }, V1: V1_3A, A1: A1_3A
  });

  // Segment 3B: Gorgeous Round Loop (rx=0.228, ry=0.14)
  segments.push({
    name: '3B: Initiatives Header Round Loop',
    type: 'loop',
    cd0: 0.40, cd1: 0.40,
    xc: L2_xc, yc: L2_yc, rx: L2_rx, ry: L2_ry,
    theta0: L2_theta0, deltaTheta: L2_deltaTheta, yDrift: L2_yDrift
  });

  // Segment 3C: Initiatives Loop Lead-out (Quintic Hermite to Offscreen Right)
  const P1_3C = { x: 1.08, y: -2.04 };
  const chord_3C = Math.hypot(P1_3C.x - L2_end.x, P1_3C.y - L2_end.y);
  const V0_len_3C = Math.hypot(L2_end.dx, L2_end.dy);
  const beta_3C = chord_3C / V0_len_3C;
  const V0_3C = { x: beta_3C * L2_end.dx, y: beta_3C * L2_end.dy };
  const A0_3C = { x: beta_3C * beta_3C * L2_end.d2x, y: beta_3C * beta_3C * L2_end.d2y };

  const V1_3C = { x: chord_3C * 0.85, y: -chord_3C * 0.55 };
  const A1_3C = { x: 0, y: 0 };

  segments.push({
    name: '3C: Initiatives Loop Lead-out',
    type: 'quintic',
    cd0: 0.40, cd1: 0.40,
    P0: { x: L2_end.x, y: L2_end.y }, V0: V0_3C, A0: A0_3C,
    P1: P1_3C, V1: V1_3C, A1: A1_3C
  });

  // ----------------------------------------------------
  // OFFSCREEN TURN 3 -> 4 (Right side, x > 1.0)
  // Cd transitions 0.40 -> 0.60
  // ----------------------------------------------------
  const P0_T34 = P1_3C;
  const P1_T34 = { x: 1.08, y: -2.16 };
  const chord_T34 = Math.hypot(P1_T34.x - P0_T34.x, P1_T34.y - P0_T34.y);
  const V0_T34 = { x: chord_T34 * 2.0, y: -chord_T34 * 1.5 };
  const V1_T34 = { x: -chord_T34 * 2.0, y: -chord_T34 * 1.5 };

  segments.push({
    name: 'Turn 3->4 (Offscreen Right)',
    type: 'quintic',
    cd0: 0.40, cd1: 0.60,
    P0: P0_T34, V0: V0_T34, A0: { x: 0, y: 0 },
    P1: P1_T34, V1: V1_T34, A1: { x: 0, y: 0 }
  });

  // ----------------------------------------------------
  // SECTION 4: INITIATIVES CARDS 1 & 2 FLOWING WAVE
  // Color: Cd = 0.60
  // ----------------------------------------------------
  const P0_4 = P1_T34;
  const V0_4 = V1_T34;

  const P1_4A = { x: 0.52, y: -2.52 };
  const chord_4A = Math.hypot(P1_4A.x - P0_4.x, P1_4A.y - P0_4.y);
  const V1_4A = { x: -chord_4A * 0.90, y: -chord_4A * 0.45 };

  segments.push({
    name: '4A: Cards 1&2 Boulevard Wave',
    type: 'quintic',
    cd0: 0.60, cd1: 0.60,
    P0: P0_4, V0: V0_4, A0: { x: 0, y: 0 },
    P1: P1_4A, V1: V1_4A, A1: { x: 0, y: 0 }
  });

  const P0_4B = P1_4A;
  const V0_4B = V1_4A;
  const P1_4B = { x: -0.10, y: -3.12 };
  const chord_4B = Math.hypot(P1_4B.x - P0_4B.x, P1_4B.y - P0_4B.y);
  const V1_4B = { x: -chord_4B * 0.85, y: -chord_4B * 0.55 };

  segments.push({
    name: '4B: Cards 1&2 to Offscreen Left',
    type: 'quintic',
    cd0: 0.60, cd1: 0.60,
    P0: P0_4B, V0: V0_4B, A0: { x: 0, y: 0 },
    P1: P1_4B, V1: V1_4B, A1: { x: 0, y: 0 }
  });

  // ----------------------------------------------------
  // OFFSCREEN TURN 4 -> 5 (Left side, x < 0.0)
  // Cd transitions 0.60 -> 0.80
  // ----------------------------------------------------
  const P0_T45 = P1_4B;
  const P1_T45 = { x: -0.10, y: -3.24 };
  const chord_T45 = Math.hypot(P1_T45.x - P0_T45.x, P1_T45.y - P0_T45.y);
  const V0_T45 = { x: -chord_T45 * 2.0, y: -chord_T45 * 1.5 };
  const V1_T45 = { x: chord_T45 * 2.5, y: -chord_T45 * 1.0 };

  segments.push({
    name: 'Turn 4->5 (Offscreen Left)',
    type: 'quintic',
    cd0: 0.60, cd1: 0.80,
    P0: P0_T45, V0: V0_T45, A0: { x: 0, y: 0 },
    P1: P1_T45, V1: V1_T45, A1: { x: 0, y: 0 }
  });

  // ----------------------------------------------------
  // SECTION 5: INITIATIVES CARDS 3 & 4 GIANT S-CURVE
  // Color: Cd = 0.80
  // ----------------------------------------------------
  const P0_5 = P1_T45;
  const V0_5 = V1_T45;

  const P1_5A = { x: 0.45, y: -3.72 };
  const chord_5A = Math.hypot(P1_5A.x - P0_5.x, P1_5A.y - P0_5.y);
  const V1_5A = { x: chord_5A * 0.90, y: -chord_5A * 0.45 };

  segments.push({
    name: '5A: Cards 3&4 Mid Crossing',
    type: 'quintic',
    cd0: 0.80, cd1: 0.80,
    P0: P0_5, V0: V0_5, A0: { x: 0, y: 0 },
    P1: P1_5A, V1: V1_5A, A1: { x: 0, y: 0 }
  });

  const P0_5B = P1_5A;
  const V0_5B = V1_5A;
  const P1_5B = { x: 1.08, y: -4.28 };
  const chord_5B = Math.hypot(P1_5B.x - P0_5B.x, P1_5B.y - P0_5B.y);
  const V1_5B = { x: chord_5B * 0.85, y: -chord_5B * 0.55 };

  segments.push({
    name: '5B: Cards 3&4 to Offscreen Right',
    type: 'quintic',
    cd0: 0.80, cd1: 0.80,
    P0: P0_5B, V0: V0_5B, A0: { x: 0, y: 0 },
    P1: P1_5B, V1: V1_5B, A1: { x: 0, y: 0 }
  });

  // ----------------------------------------------------
  // OFFSCREEN TURN 5 -> 6 (Right side, x > 1.0)
  // Cd transitions 0.80 -> 1.00
  // ----------------------------------------------------
  const P0_T56 = P1_5B;
  const P1_T56 = { x: 1.08, y: -4.40 };
  const chord_T56 = Math.hypot(P1_T56.x - P0_T56.x, P1_T56.y - P0_T56.y);
  const V0_T56 = { x: chord_T56 * 2.0, y: -chord_T56 * 1.5 };
  const V1_T56 = { x: -chord_T56 * 2.5, y: -chord_T56 * 1.0 };

  segments.push({
    name: 'Turn 5->6 (Offscreen Right)',
    type: 'quintic',
    cd0: 0.80, cd1: 1.00,
    P0: P0_T56, V0: V0_T56, A0: { x: 0, y: 0 },
    P1: P1_T56, V1: V1_T56, A1: { x: 0, y: 0 }
  });

  // ----------------------------------------------------
  // SECTION 6: MEMBERS INTO GOAL SECTION
  // Color: Cd = 1.00
  // ----------------------------------------------------
  const P0_6 = P1_T56;
  const V0_6 = V1_T56;

  const P1_6A = { x: 0.50, y: -4.88 };
  const chord_6A = Math.hypot(P1_6A.x - P0_6.x, P1_6A.y - P0_6.y);
  const V1_6A = { x: -chord_6A * 0.90, y: -chord_6A * 0.45 };

  segments.push({
    name: '6A: Members 1, 2, 3 Weave',
    type: 'quintic',
    cd0: 1.00, cd1: 1.00,
    P0: P0_6, V0: V0_6, A0: { x: 0, y: 0 },
    P1: P1_6A, V1: V1_6A, A1: { x: 0, y: 0 }
  });

  const P0_6B = P1_6A;
  const V0_6B = V1_6A;
  const P1_6B = { x: -0.03, y: -5.32 };
  const chord_6B = Math.hypot(P1_6B.x - P0_6B.x, P1_6B.y - P0_6B.y);
  const V1_6B = { x: -chord_6B * 0.70, y: -chord_6B * 0.70 };

  segments.push({
    name: '6B: Grand Goal Outro Flourish',
    type: 'quintic',
    cd0: 1.00, cd1: 1.00,
    P0: P0_6B, V0: V0_6B, A0: { x: 0, y: 0 },
    P1: P1_6B, V1: V1_6B, A1: { x: 0, y: 0 }
  });

  return segments;
}

// Evaluate high-resolution fine points along trajectory
function sampleFineTrajectory(segments, fineStepsPerSegment = 2000) {
  const finePoints = [];

  for (let sIdx = 0; sIdx < segments.length; sIdx++) {
    const seg = segments[sIdx];
    const steps = fineStepsPerSegment;

    for (let j = 0; j < steps; j++) {
      // Don't duplicate the end point of a segment unless it's the very last segment
      if (j === steps - 1 && sIdx < segments.length - 1) continue;

      const t = j / (steps - 1);
      let pt;
      if (seg.type === 'quintic') {
        pt = quinticHermite(seg.P0, seg.V0, seg.A0, seg.P1, seg.V1, seg.A1, t);
      } else if (seg.type === 'loop') {
        pt = evaluateLoop(seg.xc, seg.yc, seg.rx, seg.ry, seg.theta0, seg.deltaTheta, seg.yDrift, t);
      }

      const cd = seg.cd0 + t * (seg.cd1 - seg.cd0);
      finePoints.push({
        x: pt.x,
        y: pt.y,
        cd: cd,
        segName: seg.name
      });
    }
  }

  return finePoints;
}

// Resample with strictly uniform arc-length distance
function resampleUniformArcLength(finePoints, targetPoints = 1400) {
  // 1. Compute cumulative arc-length
  const N = finePoints.length;
  const cumDist = new Float64Array(N);
  cumDist[0] = 0;

  for (let i = 1; i < N; i++) {
    const dx = finePoints[i].x - finePoints[i - 1].x;
    const dy = finePoints[i].y - finePoints[i - 1].y;
    cumDist[i] = cumDist[i - 1] + Math.hypot(dx, dy);
  }

  const totalLength = cumDist[N - 1];
  console.log(`Fine points: ${N}, Total spline arc length: ${totalLength.toFixed(4)}`);

  const resampled = [];
  const deltaS = totalLength / (targetPoints - 1);
  console.log(`Target points: ${targetPoints}, Strictly uniform Delta s: ${deltaS.toFixed(6)}`);

  let searchIdx = 0;
  for (let k = 0; k < targetPoints; k++) {
    const targetDist = k * deltaS;

    // Advance searchIdx
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



console.log('=== BUILDING FLAWLESS G1/C2 CONTINUOUS BUFFER ===');
const segments = buildTrajectorySegments();
console.log('Built segments:', segments.length);

const finePoints = sampleFineTrajectory(segments, 2500);
const numPoints = 1400; // 2800 vertices
const { resampled, totalLength, deltaS } = resampleUniformArcLength(finePoints, numPoints);

const numVertices = numPoints * 2;
const numIndices = (numPoints - 1) * 6;

const cpArray = new Float32Array(numVertices * 3);
const posArray = new Float32Array(numVertices * 3);
const cdArray = new Float32Array(numVertices);
const indices = new Uint16Array(numIndices);

let minX = Infinity, maxX = -Infinity;
let minY = Infinity, maxY = -Infinity;

for (let i = 0; i < numPoints; i++) {
  const pt = resampled[i];
  const s = pt.s; // 0.0 -> 1.0 strictly continuous

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
  }
  const len = Math.hypot(tx, ty) || 1;
  tx /= len;
  ty /= len;

  // Exact orthogonal 2D normals in isotropic coordinate system
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

console.log('=== BUFFER DEPLOYED SUCCESSFULLY! ===');
