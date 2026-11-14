const three = require('three');

function createSmoothLoop(xc, yc, rx, ry, startAngle, endAngle, numKnots = 16) {
  const pts = [];
  for (let k = 0; k <= numKnots; k++) {
    const t = k / numKnots;
    const angle = startAngle + t * (endAngle - startAngle);
    const yDrift = -0.035 * (t - 0.5);
    const x = xc + rx * Math.cos(angle);
    const y = yc + ry * Math.sin(angle) + yDrift;
    pts.push(new three.Vector3(x, y, 0));
  }
  return pts;
}

const knots = [
  new three.Vector3(-0.03, -1.28, 0),
  new three.Vector3( 0.14, -1.32, 0),
  new three.Vector3( 0.28, -1.38, 0),
  ...createSmoothLoop(0.50, -1.46, 0.22, 0.14, -Math.PI * 0.60, -Math.PI * 0.60 + Math.PI * 2.10, 16),
  new three.Vector3( 0.72, -1.70, 0),
  new three.Vector3( 0.86, -1.84, 0),
  new three.Vector3( 0.95, -1.96, 0)
];

const curve = new three.CatmullRomCurve3(knots, false, 'centripetal', 0.5);
const pts = curve.getSpacedPoints(180);
const s0 = 0.30, s1 = 0.48;

pts.forEach((p, j) => {
  const s = s0 + (j / 180) * (s1 - s0);
  if (j % 10 === 0) {
    console.log(`pt ${j.toString().padStart(3)}: x=${p.x.toFixed(3)}, y=${p.y.toFixed(3)}, s=${s.toFixed(4)}`);
  }
});
