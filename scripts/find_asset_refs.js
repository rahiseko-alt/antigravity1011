const fs = require('fs');

const files = ["_astro/about.CNa9RfUh.css", "index.html", "_astro/hoisted.CUO_IjfL.js"];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/assets\/[a-zA-Z0-9_\-\/.]+\.(?:png|jpg|jpeg|webp|avif)/gi) || [];
  console.log(f, Array.from(new Set(matches)));
}
