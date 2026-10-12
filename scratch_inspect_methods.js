const fs = require('fs');
const code = fs.readFileSync('home_reel_section_dump.txt', 'utf8');

// Find all method names
const methodRegex = /([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*\{/g;
let match;
const methods = [];
while ((match = methodRegex.exec(code)) !== null) {
  methods.push(match[1]);
}
console.log('Methods:', methods);
