const fs = require('fs');

const code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');
const vertEnd = code.indexOf('v_s=CP.z;}');
console.log('vertEnd at:', vertEnd);
const sub = code.substring(vertEnd, vertEnd + 80);
console.log('After vertEnd:', sub);

const varNameMatch = sub.match(/,([a-zA-Z0-9_$]+)=`#define GLSLIFY/);
if (varNameMatch) {
  const varName = varNameMatch[1];
  console.log('Shader variable name is:', varName);
  let idx = 0;
  while ((idx = code.indexOf(varName, idx)) !== -1) {
    console.log(`Usage at ${idx}:`, code.substring(Math.max(0, idx - 40), Math.min(code.length, idx + 40)));
    idx += varName.length;
  }
}
