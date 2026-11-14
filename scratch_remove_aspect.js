const fs = require('fs');
let js = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

// 1. In vert$j:
const oldVertSnippet = 'float aspectX=mix(1.0,1.45,smoothstep(540.0,1400.0,u_viewportResolution.x));float aspectY=mix(1.0,0.44,smoothstep(540.0,1400.0,u_viewportResolution.x));vec3 pos=vec3(vec2(CP.x*aspectX,CP.y*aspectY)+position.xy*(u_radius*strokeThick),0.0);';
const newVertSnippet = 'vec3 pos=vec3(CP.xy+position.xy*(u_radius*strokeThick),0.0);';

if (js.includes(oldVertSnippet)) {
  js = js.replace(oldVertSnippet, newVertSnippet);
  console.log('1. Fixed vertex shader: removed artificial 1.45x / 0.44x aspect distortion!');
} else {
  console.log('oldVertSnippet not found!');
}

// 2. In JS Line.update:
const jsAspectIdx = js.indexOf('aspectX=');
console.log('Next aspectX in JS at:', jsAspectIdx);
if (jsAspectIdx !== -1) {
  const jsAspectStart = js.lastIndexOf('const aspectX', jsAspectIdx);
  const setCallIdx = js.indexOf('this.circle.position.set', jsAspectIdx);
  const setCallEnd = js.indexOf(';', setCallIdx);
  const fullJsSnippet = js.slice(jsAspectStart, setCallEnd + 1);
  console.log('Full snippet to replace:', JSON.stringify(fullJsSnippet));
  js = js.replace(fullJsSnippet, 'this.circle.position.copy(_v0$2);');
  console.log('2. Fixed JS Line.update: removed circle tip aspect distortion!');
}

fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', js, 'utf8');
console.log('Saved _astro/hoisted.CUO_IjfL.js');
