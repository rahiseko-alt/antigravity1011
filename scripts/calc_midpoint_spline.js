const S = [750, 1400, 2500, 3800, 5300];
const A = [0.0, 0.31, 0.54, 0.76, 1.00];
const n = S.length - 1;
const h = [];
for (let i = 0; i < n; i++) h.push(S[i + 1] - S[i]);

const M = Array.from({ length: n + 1 }, () => new Float64Array(n + 1));
const R = new Float64Array(n + 1);

M[0][0] = 1; R[0] = 0;
M[n][n] = 1; R[n] = 0;

for (let i = 1; i < n; i++) {
  const h0 = h[i - 1];
  const h1 = h[i];
  const d0 = (A[i] - A[i - 1]) / h0;
  const d1 = (A[i + 1] - A[i]) / h1;
  M[i][i - 1] = 1 / h0;
  M[i][i] = 2 * (1 / h0 + 1 / h1);
  M[i][i + 1] = 1 / h1;
  R[i] = 3 * (d0 / h0 + d1 / h1);
}

const c_star = new Float64Array(n + 1);
const d_star = new Float64Array(n + 1);
c_star[0] = M[0][1] / M[0][0];
d_star[0] = R[0] / M[0][0];

for (let i = 1; i <= n; i++) {
  const m = M[i][i] - M[i][i - 1] * c_star[i - 1];
  c_star[i] = i < n ? M[i][i + 1] / m : 0;
  d_star[i] = (R[i] - M[i][i - 1] * d_star[i - 1]) / m;
}

const V = new Float64Array(n + 1);
V[n] = d_star[n];
for (let i = n - 1; i >= 0; i--) {
  V[i] = d_star[i] - c_star[i] * V[i + 1];
}

console.log('Velocities:', Array.from(V).map(v => v.toExponential(4)));

const segments = [];
for (let i = 0; i < n; i++) {
  const h_i = h[i];
  const a0 = A[i];
  const a1 = A[i + 1];
  const v0 = V[i];
  const v1 = V[i + 1];
  const b = (3 * (a1 - a0) / h_i - 2 * v0 - v1) / h_i;
  const c = (v0 + v1 - 2 * (a1 - a0) / h_i) / (h_i * h_i);
  segments.push({ s0: S[i], s1: S[i + 1], a0, v0, b, c });
}

console.log(JSON.stringify(segments, null, 2));

// Test monotonicity and print code snippet
let prevA = -1;
let monotonic = true;
for (let s = 750; s <= 5300; s += 25) {
  let a;
  if (s < 1400) {
    const d = s - 750;
    a = segments[0].a0 + d * (segments[0].v0 + d * (segments[0].b + segments[0].c * d));
  } else if (s < 2500) {
    const d = s - 1400;
    a = segments[1].a0 + d * (segments[1].v0 + d * (segments[1].b + segments[1].c * d));
  } else if (s < 3800) {
    const d = s - 2500;
    a = segments[2].a0 + d * (segments[2].v0 + d * (segments[2].b + segments[2].c * d));
  } else {
    const d = s - 3800;
    a = segments[3].a0 + d * (segments[3].v0 + d * (segments[3].b + segments[3].c * d));
  }
  if (a < prevA) {
    console.error('Monotonicity error at ' + s);
    monotonic = false;
  }
  prevA = a;
}

if (monotonic) {
  console.log('MONOTONIC CHECK PASSED!');
}
