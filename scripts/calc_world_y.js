const three = require('three');

// Strokes definition from generate_multistroke_line.js
function createSmoothLoop(xc, yc, rx, ry, startAngle, endAngle, numKnots = 24) {
  const pts = [];
  for (let k = 0; k <= numKnots; k++) {
    const t = k / numKnots;
    const angle = startAngle + t * (endAngle - startAngle);
    const yDrift = -0.040 * (t - 0.5);
    const x = xc + rx * Math.cos(angle);
    const y = yc + ry * Math.sin(angle) + yDrift;
    pts.push(new three.Vector3(x, y, 0));
  }
  return pts;
}

const strokes = [
  { id: 1, name: 'Stroke 1 (Blue)', cd: 0.00, s0: 0.00, s1: 0.16, yRange: [-0.05, -0.56] },
  { id: 2, name: 'Stroke 2 (Yellow)', cd: 0.20, s0: 0.16, s1: 0.32, yRange: [-0.66, -1.20] },
  { id: 3, name: 'Stroke 3 (Red)', cd: 0.40, s0: 0.32, s1: 0.50, yRange: [-1.26, -1.98] },
  { id: 4, name: 'Stroke 4 (Green)', cd: 0.60, s0: 0.50, s1: 0.68, yRange: [-2.10, -3.12] },
  { id: 5, name: 'Stroke 5 (Purple)', cd: 0.80, s0: 0.68, s1: 0.84, yRange: [-3.22, -4.24] },
  { id: 6, name: 'Stroke 6 (Orange)', cd: 1.00, s0: 0.84, s1: 1.00, yRange: [-4.34, -5.32] }
];

const W = 1440;
const H = 900;
const u = Math.hypot(W, H); // 1698.1166
const c = u; // 1698.1166

// In hoisted.CUO_IjfL.js:
// this.innerContainer.scale.set(c, u, 1);
// this.innerContainer.position.y = 0.5 * s + 0.5 * ((0.78 + 4.57 * a) * u - 0.45 * H);
// pos.y in screen/world coordinates:
// worldY = innerContainer.position.y + pt.y * u

function calcOldA(s) {
  if (s <= 750) return 0;
  if (s < 1400) { const d = s - 750; return d * d * (1.354669642405376e-6 - 9.552951257761362e-10 * d); }
  if (s < 2500) { const d = s - 1400; return 0.31 + d * (5.502339632057363e-4 + d * (-5.08155852858089e-7 + 1.8002345787526508e-10 * d)); }
  if (s < 3800) { const d = s - 2500; return 0.54 + d * (8.577623900515268e-5 + d * (8.592155813028578e-8 - 1.671212742234021e-11 * d)); }
  const d = s - 3800; return 0.76 + d * (2.2444180411263078e-4 + d * (2.0744261183158925e-8 - 4.2470309283275194e-11 * d));
}

[3600, 3900, 4200, 4500].forEach(s => {
  const a = calcOldA(s);
  const containerY = 0.5 * s + 0.5 * ((0.78 + 4.57 * a) * u - 0.45 * H);
  console.log(`\n=== Scroll s=${s}, a=${a.toFixed(3)}, containerY=${containerY.toFixed(1)} ===`);
  
  strokes.forEach(st => {
    const minY = containerY + st.yRange[0] * u;
    const maxY = containerY + st.yRange[1] * u;
    // In three.js camera, visible Y range is approximately [-H/2, H/2] = [-450, 450]
    // Or let's see how three.js camera is configured!
    console.log(`  ${st.name}: worldY [${minY.toFixed(1)}, ${maxY.toFixed(1)}] (s0=${st.s0}, s1=${st.s1})`);
  });
});
