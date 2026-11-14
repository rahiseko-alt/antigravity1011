const fs = require('fs');
const content = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');
console.log('File size:', content.length);

const keywords = ['isIntroWarp', 'introStartTime', 'homeBalloonsPhysics', 'cameraDollyZoomFovOffset', 'intro-whiteout'];
for (const kw of keywords) {
  let idx = 0;
  let count = 0;
  console.log(`\n========================================\nMatches for: ${kw}`);
  while ((idx = content.indexOf(kw, idx)) !== -1) {
    count++;
    const start = Math.max(0, idx - 150);
    const end = Math.min(content.length, idx + 250);
    console.log(`--- Match ${count} at ${idx} ---`);
    console.log(content.slice(start, end));
    idx += kw.length;
    if (count >= 10) {
      console.log('...more matches truncated');
      break;
    }
  }
}
