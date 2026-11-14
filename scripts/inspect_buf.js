const fs = require('fs');
const three = require('three');

// Let's inspect the spline in assets/models/lines/line_reel.buf
const bufPath = 'assets/models/lines/line_reel.buf';
const buf = fs.readFileSync(bufPath);

console.log('Buffer size:', buf.length);

// Let's parse the buffer header or inspect how buf is parsed
// In Three.js / custom loader:
// Let's see how .buf is parsed in hoisted.CUO_IjfL.js
