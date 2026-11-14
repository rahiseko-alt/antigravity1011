const fs = require('fs');
const esbuild = require('esbuild');

const content = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');
try {
  esbuild.transformSync(content, { loader: 'js' });
  console.log('TRANSFORM SUCCESSFUL! No syntax error.');
} catch (e) {
  console.error('ERROR LOC:', e.errors[0].location);
  console.error('TEXT:', e.errors[0].text);
}
