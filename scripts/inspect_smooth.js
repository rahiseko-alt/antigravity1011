const three = require('three');

function inspectSmooth(Rx = 0.25, Ry = 0.14, sx = 0.4812) {
  const xc = 0.50, yc = -1.48;
  const knots = [];
  knots.push(new three.Vector3(-0.03, -1.35, 0));
  knots.push(new three.Vector3( 0.15, -1.40, 0));
  knots.push(new three.Vector3( 0.28, -1.48, 0));
  
  const startAngle = -Math.PI * 0.60;
  const endAngle = startAngle + Math.PI * 2.10;
  const numLoopKnots = 16;
  
  for (let k = 0; k <= numLoopKnots; k++) {
    const t = k / numLoopKnots;
    const angle = startAngle + t * (endAngle - startAngle);
    const x = xc + Rx * Math.cos(angle);
    const y = yc + Ry * Math.sin(angle) - 0.03 * (t - 0.5);
    knots.push(new three.Vector3(x, y, 0));
  }
  
  knots.push(new three.Vector3( 0.72, -1.72, 0));
  knots.push(new three.Vector3( 0.84, -1.84, 0));
  knots.push(new three.Vector3( 0.95, -1.95, 0));

  const curve = new three.CatmullRomCurve3(knots, false, 'centripetal', 0.5);
  const segments = 200;
  const points = curve.getSpacedPoints(segments);

  let minRc = Infinity, maxKappa = 0, worstIdx = -1;
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
      worstIdx = i;
    }
  }

  console.log(`Worst point index: ${worstIdx} / ${segments}`);
  console.log('Worst point CP:', points[worstIdx]);
  console.log('Screen coords:', points[worstIdx].x * sx, points[worstIdx].y);
  console.log('minRc:', minRc, 'maxKappa:', maxKappa);
}

inspectSmooth();
