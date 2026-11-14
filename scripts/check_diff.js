const fs = require('fs');
const { execSync } = require('child_process');

const orig = execSync('git show HEAD:_astro/hoisted.CUO_IjfL.js', { maxBuffer: 20 * 1024 * 1024 }).toString();
const curr = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const sIdx = orig.indexOf('vert$j');
console.log('=== ORIG vert$j ===\n', orig.slice(sIdx, orig.indexOf('`', sIdx + 15) + 1));
const sIdx2 = curr.indexOf('vert$j');
console.log('=== CURR vert$j ===\n', curr.slice(sIdx2, curr.indexOf('`', sIdx2 + 15) + 1));

const fIdx = orig.indexOf('frag$m');
console.log('=== ORIG frag$m ===\n', orig.slice(fIdx, orig.indexOf('`', fIdx + 15) + 1));
const fIdx2 = curr.indexOf('frag$m');
console.log('=== CURR frag$m ===\n', curr.slice(fIdx2, curr.indexOf('`', fIdx2 + 15) + 1));

const lIdx = orig.indexOf('LINES_DATA_LIST');
console.log('=== ORIG LINES_DATA_LIST ===\n', orig.slice(lIdx, lIdx + 300));
const lIdx2 = curr.indexOf('LINES_DATA_LIST');
console.log('=== CURR LINES_DATA_LIST ===\n', curr.slice(lIdx2, lIdx2 + 300));
