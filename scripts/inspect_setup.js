const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const links = html.match(/<link[^>]+stylesheet[^>]*>/g) || [];
console.log('Stylesheets in index.html:', links);

const styles = html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || [];
console.log('Inline style tags in index.html:', styles.length);

// Also search in _astro/*.css
const astroFiles = fs.readdirSync('_astro').filter(f => f.endsWith('.css'));
console.log('Astro CSS files:', astroFiles);
for (const file of astroFiles) {
  const css = fs.readFileSync('_astro/' + file, 'utf8');
  if (css.includes('home-members')) {
    console.log(`Found home-members in _astro/${file}`);
  }
}
