const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const get = c => execSync(`git show ${c}:_astro/hoisted.CUO_IjfL.js`, { maxBuffer: 1 << 28 }).toString('utf8').replace(/\r\n/g, '\n');
const split = s => s.replace(/([;{}])/g, '$1\n');
const A = process.argv[2] || '178a34e', B = process.argv[3] || '4b0146c';
const fa = path.join(os.tmpdir(), 'A.txt'), fb = path.join(os.tmpdir(), 'B.txt');
fs.writeFileSync(fa, split(get(A)));
fs.writeFileSync(fb, split(get(B)));
let out = '';
try { out = execSync(`git diff --no-index -U2 --minimal "${fa}" "${fb}"`, { maxBuffer: 1 << 28 }).toString('utf8'); } catch (e) { out = e.stdout ? e.stdout.toString('utf8') : String(e); }
const lines = out.split('\n');
const hunks = []; let cur = null;
for (const l of lines) {
  if (l.startsWith('@@')) { cur = { head: l, body: [] }; hunks.push(cur); }
  else if (cur) cur.body.push(l);
}
console.log(`${A} -> ${B}: hunks=${hunks.length}`);
const trunc = s => s.length > 220 ? s.slice(0, 220) + '…' : s;
const res = hunks.map((h, i) => {
  const minus = h.body.filter(l => l.startsWith('-')).length;
  const plus = h.body.filter(l => l.startsWith('+')).length;
  return { i, head: h.head, minus, plus, body: h.body };
});
fs.writeFileSync(path.join(os.tmpdir(), 'hunks.json'), JSON.stringify(res));
for (const h of res) {
  console.log(`\n#${h.i} ${h.head} (-${h.minus}/+${h.plus})`);
  const shown = h.body.filter(l => l.startsWith('-') || l.startsWith('+')).slice(0, 8).map(trunc);
  console.log(shown.join('\n'));
}
