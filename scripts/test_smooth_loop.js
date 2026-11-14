const three = require('three');

function testSmoothLoop(Rx, Ry, numLoopKnots = 12) {
  const xc = 0.46;
  const yc = -1.48;
  
  // Create an entry that smoothly joins a circular/elliptical loop
  // The loop starts at bottom-left, rotates CCW through right, top, left, and crosses to bottom-right
  const knots = [];
  
  // Entry path from left
  knots.push(new three.Vector3(-0.03, -1.36, 0));
  knots.push(new three.Vector3( 0.16, -1.42, 0));
  knots.push(new three.Vector3( 0.28, -1.50, 0));
  
  // Smooth loop entry at angle -110 deg (-1.92 rad)
  // Loop rotates counter-clockwise: -110 deg -> +290 deg
  const startAngle = -Math.PI * 0.65;
  const endAngle = startAngle + Math.PI * 2.15;
  
  for (let k = 0; k <= numLoopKnots; k++) {
    const t = k / numLoopKnots;
    const angle = startAngle + t * (endAngle - startAngle);
    // Slight expansion in vertical offset to make crossing graceful
    const rScale = 1.0 + 0.08 * Math.sin(t * Math.PI);
    const x = xc + Rx * Math.cos(angle);
    const y = yc + Ry * Math.sin(angle) - 0.04 * (t - 0.5);
    knots.push(new three.Vector3(x, y, 0));
  }
  
  // Exit path swooping out right
  knots.push(new three.Vector3( 0.65, -1.68, 0));
  knots.push(new three.Vector3( 0.80, -1.82, 0));
  knots.push(new three.Vector3( 0.95, -1.95, 0));

  const curve = new three.CatmullRomCurve3(knots, false, 'centripetal', 0.5);
  const segments = 200;
  const points = curve.getSpacedPoints(segments);

  function getMinRc(sx) {
    let minRc = Infinity;
    let maxKappa = 0;
    for (let i = 1; i < points.length - 1; i++) {
      const pPrev = points[i - 1], pCurr = points[i], pNext = points[i + 1];
      const x0 = pPrev.x * sx, y0 = pPrev.y;
      const x1 = pCurr.x * sx, y1 = pCurr.y;
      const x2 = pNext.x * sx, y2 = pNext.y;

      const dx1 = x1 - x0, dy1 = y1 - y0;
      const dx2 = x2 - x1, dy2 = y2 - y1;
      const ds1 = Math.hypot(dx1, dy1), ds2 = Math.hypot(dx2, dy2);
      const ds = (ds1 + ds2) / 2;

      const d2x = (dx2 / ds2 - dx1 / ds1) / ds;
      const d2y = (dy2 / ds2 - dy1 / ds1) / ds;
      const vx = (dx1 + dx2) / (ds1 + ds2);
      const vy = (dy1 + dy2) / (ds1 + ds2);
      const vLen = Math.hypot(vx, vy);
      const cross = Math.abs(vx * d2y - vy * d2x);
      const kappa = cross / Math.pow(vLen, 3);
      const rc = 1 / (kappa || 1e-9);
      if (kappa > maxKappa) {
        maxKappa = kappa;
        minRc = rc;
      }
    }
    return { minRc, maxKappa };
  }

  return {
    desktop: getMinRc(1.0),
    mobile: getMinRc(0.4812),
    knotCount: knots.length
  };
}

console.log('Testing Rx = 0.22, Ry = 0.12:');
console.log(testSmoothLoop(0.22, 0.12));

console.log('\nTesting Rx = 0.26, Ry = 0.13:');
console.log(testSmoothLoop(0.26, 0.13));

console.log('\nTesting Rx = 0.30, Ry = 0.14:');
console.log(testSmoothLoop(0.30, 0.14));
