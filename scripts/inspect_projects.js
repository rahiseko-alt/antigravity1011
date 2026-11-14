const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const p = html.indexOf('class="project-list"');
console.log('--- PROJECT LIST ---');
console.log(html.substring(p, p + 3500));
