const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const targets = [
  {
    type: 'css',
    files: [
      path.join(rootDir, '_astro/about.CNa9RfUh.css'),
      path.join(rootDir, 'dist/_astro/about.CNa9RfUh.css')
    ],
    oldStr: '#end-section{height:calc(var(--vh, 1vh) * 350);font-size:clamp(.875rem,1vw,2rem);color:var(--color-white)}',
    newStr: '#end-section{height:calc(var(--vh, 1vh) * 190);font-size:clamp(.875rem,1vw,2rem);color:var(--color-white)}'
  },
  {
    type: 'js',
    files: [
      path.join(rootDir, '_astro/hoisted.CUO_IjfL.js'),
      path.join(rootDir, 'dist/_astro/hoisted.CUO_IjfL.js')
    ],
    oldStr: 'this.activeRatio=math.saturate(this.activeRatio+(c?e:-e)),',
    newStr: 'this.activeRatio=Math.max(math.saturate(this.activeRatio+(c?e*2.8:-e*1.5)),math.fit(t.showScreenOffset,.7,1.2,0,1)),'
  }
];

let totalPatched = 0;

for (const target of targets) {
  for (const filePath of target.files) {
    if (!fs.existsSync(filePath)) {
      console.log(`Skipping non-existent file: ${filePath}`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes(target.newStr)) {
      console.log(`Already patched: ${path.relative(rootDir, filePath)}`);
      continue;
    }

    if (!content.includes(target.oldStr)) {
      console.error(`ERROR: target oldStr not found in ${path.relative(rootDir, filePath)}`);
      process.exit(1);
    }

    content = content.replace(target.oldStr, target.newStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully patched: ${path.relative(rootDir, filePath)}`);
    totalPatched++;
  }
}

console.log(`Finished patching. Total updated files: ${totalPatched}`);
