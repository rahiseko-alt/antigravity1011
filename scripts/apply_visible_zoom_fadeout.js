const fs = require('fs');
let js = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const p1Old = 'const scale=math.fit(p1,0.5,1,1,12,ease.cubicIn)*math.fit(p1,0,0.15,0.85,1,ease.cubicOut);const opacity=math.fit(p1,0,0.05,0,1)*math.fit(p1,0.9,1,1,0);const spread=math.fit(p1,0.4,0.6,0,1,ease.cubicInOut);';
const p2Old = 'const scale=math.fit(p2,0.5,1,1,12,ease.cubicIn)*math.fit(p2,0,0.15,0.85,1,ease.cubicOut);const opacity=math.fit(p2,0,0.05,0,1)*math.fit(p2,0.9,1,1,0);const spread=math.fit(p2,0.4,0.6,0,1,ease.cubicInOut);';

const p1New = 'const scale=math.fit(p1,0.45,0.85,1,10,ease.cubicIn)*math.fit(p1,0,0.15,0.85,1,ease.cubicOut);const opacity=math.fit(p1,0,0.15,0,1)*math.fit(p1,0.45,0.85,1,0);const spread=math.fit(p1,0.3,0.7,0,1,ease.cubicInOut);';
const p2New = 'const scale=math.fit(p2,0.45,0.85,1,10,ease.cubicIn)*math.fit(p2,0,0.15,0.85,1,ease.cubicOut);const opacity=math.fit(p2,0,0.15,0,1)*math.fit(p2,0.45,0.85,1,0);const spread=math.fit(p2,0.3,0.7,0,1,ease.cubicInOut);';

if (!js.includes(p1Old) || !js.includes(p2Old)) {
  console.error('Target strings not found in hoisted.CUO_IjfL.js!');
  process.exit(1);
}

js = js.replace(p1Old, p1New);
js = js.replace(p2Old, p2New);

// Also set opacity on introP1 and introP2 to match opacity exactly
js = js.replace('introP1.style.opacity="1"', 'introP1.style.opacity=opacity.toFixed(4)');
js = js.replace('introP2.style.opacity="1"', 'introP2.style.opacity=opacity.toFixed(4)');

fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', js, 'utf8');
console.log('Successfully updated _astro/hoisted.CUO_IjfL.js with smooth zoom-in while fade-out!');
