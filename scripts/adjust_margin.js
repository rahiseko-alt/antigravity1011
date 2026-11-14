const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

// margin: {x: -.05, y: -.8} -> margin: {x: 0.15, y: -0.8}
const oldReelItem = `{fileName:"line_reel",aoThreshold:.555,margin:{x:-.05,y:-.8},scrollToRatioFactors:[.9,.7],boxMin:new Vector3(-.0112049,-.0141946,0),boxMax:new Vector3(1.01357,.718671,0),color0:"#00ebff",color1:"#00ebff"}`;
const newReelItem = `{fileName:"line_reel",aoThreshold:.555,margin:{x:.18,y:-.70},scrollToRatioFactors:[.9,.7],boxMin:new Vector3(-.0112049,-.0141946,0),boxMax:new Vector3(1.01357,.718671,0),color0:"#00ebff",color1:"#00ebff"}`;

if (!code.includes(oldReelItem)) {
  console.error('oldReelItem not found!');
  process.exit(1);
}
code = code.replace(oldReelItem, newReelItem);

try {
  esbuild.transformSync(code, { minify: false });
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully adjusted margin to x:0.18, y:-0.70');
} catch (err) {
  console.error(err);
  process.exit(1);
}
