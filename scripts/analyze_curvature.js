const three = require('three');

// Let's test the curvature of the original Stroke 3 vs an improved smooth Stroke 3
const originalKnots = [
  new three.Vector3(-0.03, -1.38, 0),
  new three.Vector3( 0.18, -1.46, 0),
  new three.Vector3( 0.35, -1.56, 0),
  new three.Vector3( 0.45, -1.50, 0),
  new three.Vector3( 0.52, -1.45, 0),
  new three.Vector3( 0.46, -1.38, 0),
  new three.Vector3( 0.38, -1.45, 0),
  new three.Vector3( 0.45, -1.58, 0),
  new three.Vector3( 0.72, -1.80, 0),
  new three.Vector3( 0.92, -1.95, 0)
];

function analyzeCurve(knots, sx, segments = 200) {
  const curve = new three.CatmullRomCurve3(knots, false, 'centripetal', 0.5);
  const points = curve.getSpacedPoints(segments);
  let minRc = Infinity;
  let maxKappa = 0;
  let worstIndex = -1;

  for (let i = 1; i < points.length - 1; i++) {
    const pPrev = points[i - 1];
    const pCurr = points[i];
    const pNext = points[i + 1];

    // Screen coordinates with sx scaling
    const x0 = pPrev.x * sx, y0 = pPrev.y;
    const x1 = pCurr.x * sx, y1 = pCurr.y;
    const x2 = pNext.x * sx, y2 = pNext.y;

    const dx1 = x1 - x0, dy1 = y1 - y0;
    const dx2 = x2 - x1, dy2 = y2 - y1;

    const ds1 = Math.hypot(dx1, dy1);
    const ds2 = Math.hypot(dx2, dy2);
    const ds = (ds1 + ds2) / 2;

    const d2x = (dx2 / ds2 - dx1 / ds1) / ds;
    const d2y = (dy2 / ds2 - dy1 / ds1) / ds;

    // Curvature kappa = |x' y'' - y' x''| / (x'^2 + y'^2)^1.5
    const vx = (dx1 + dx2) / (ds1 + ds2);
    const vy = (dy1 + dy2) / (ds1 + ds2);
    const vLen = Math.hypot(vx, vy);

    const cross = Math.abs(vx * d2y - vy * d2x);
    const kappa = cross / Math.pow(vLen, 3);
    const rc = 1 / (kappa || 1e-9);

    if (kappa > maxKappa) {
      maxKappa = kappa;
      minRc = rc;
      worstIndex = i;
    }
  }

  return {
    minRc,
    maxKappa,
    worstPoint: points[worstIndex],
    worstIndex
  };
}

console.log('=== ORIGINAL STROKE 3 ON DESKTOP (sx = 1.0) ===');
console.log(analyzeCurve(originalKnots, 1.0));

console.log('\n=== ORIGINAL STROKE 3 ON MOBILE (sx = 0.4812) ===');
const origMobile = analyzeCurve(originalKnots, 0.4812);
console.log(origMobile);
console.log('Tube radius on mobile: 0.0252');
console.log('Is tube radius > minRc?', 0.0252 > origMobile.minRc ? 'YES! CRITICAL DEFECT (CUSP/KINK)!' : 'No');
