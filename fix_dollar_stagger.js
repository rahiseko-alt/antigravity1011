const fs = require('fs');
const esbuild = require('esbuild');

for (const p of ['_astro/hoisted.CUO_IjfL.js', 'dist/_astro/hoisted.CUO_IjfL.js']) {
  if (!fs.existsSync(p)) continue;
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace('TITLE_STAGGER=40,TITLE_DELAY=.4;', 'TITLE_STAGGER$1=40,TITLE_DELAY=.4;');
  fs.writeFileSync(p, c, 'utf8');
  console.log('Fixed TITLE_STAGGER$1 in', p);
}
