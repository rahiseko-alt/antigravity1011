const fs = require('fs');
['./_astro/hoisted.CUO_IjfL.js', './dist/_astro/hoisted.CUO_IjfL.js'].forEach(p => {
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('color1:"#1d35ff"}}')) {
    c = c.replace('color1:"#1d35ff"}}', 'color1:"#1d35ff"}');
    fs.writeFileSync(p, c, 'utf8');
    console.log('Fixed extra brace in', p);
  } else {
    console.log('Not found in', p);
  }
});
