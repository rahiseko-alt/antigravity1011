const three = require('three');

const W = 1440;
const H = 900;
const u = Math.hypot(W, H); // 1698.1166

// Function to calculate `a` from `s`
function getA(s) {
  if (s <= 750) return 0;
  if (s < 1400) {
    const d = s - 750;
    return 0.7 * d * d * (1.354669642405376e-6 - 9.552951257761362e-10 * d);
  }
  if (s < 2500) {
    const d = s - 1400;
    return 0.7 * (0.31 + d * (5.502339632057363e-4 + d * (-5.08155852858089e-7 + 1.8002345787526508e-10 * d)));
  }
  if (s < 3800) {
    const d = s - 2500;
    return 0.7 * (0.54 + d * (8.577623900515268e-5 + d * (8.592155813028578e-8 - 1.671212742234021e-11 * d)));
  }
  const d = s - 3800;
  return 0.7 * (0.76 + d * (2.2444180411263078e-4 + d * (2.0744261183158925e-8 - 4.2470309283275194e-11 * d)));
}

// Old `a` (without 0.7)
function getOldA(s) {
  if (s <= 750) return 0;
  if (s < 1400) {
    const d = s - 750;
    return d * d * (1.354669642405376e-6 - 9.552951257761362e-10 * d);
  }
  if (s < 2500) {
    const d = s - 1400;
    return 0.31 + d * (5.502339632057363e-4 + d * (-5.08155852858089e-7 + 1.8002345787526508e-10 * d));
  }
  if (s < 3800) {
    const d = s - 2500;
    return 0.54 + d * (8.577623900515268e-5 + d * (8.592155813028578e-8 - 1.671212742234021e-11 * d));
  }
  const d = s - 3800;
  return 0.76 + d * (2.2444180411263078e-4 + d * (2.0744261183158925e-8 - 4.2470309283275194e-11 * d));
}

console.log('Scroll | Current a | Old a');
[750, 1100, 1400, 2000, 2500, 3200, 3600, 3800, 4200, 4600, 5000, 5300].forEach(s => {
  console.log(`${s.toString().padStart(6)} | ${getA(s).toFixed(3)}     | ${getOldA(s).toFixed(3)}`);
});
