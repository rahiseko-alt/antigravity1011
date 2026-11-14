const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// Basic structural check
const openTags = [];
const selfClosing = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

// Strip comments and scripts/styles content
let sanitized = html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '');

const tagRegex = /<\/?([a-zA-Z0-9\-]+)(?:\s+[^>]*)?\/?>/g;
let match;
let errors = 0;

while ((match = tagRegex.exec(sanitized)) !== null) {
  const fullTag = match[0];
  const tagName = match[1].toLowerCase();

  if (selfClosing.has(tagName) || fullTag.endsWith('/>')) {
    continue;
  }

  if (fullTag.startsWith('</')) {
    if (openTags.length === 0) {
      console.error(`Unexpected closing tag: </${tagName}>`);
      errors++;
    } else {
      const last = openTags.pop();
      if (last !== tagName) {
        console.error(`Mismatched closing tag: expected </${last}>, found </${tagName}>`);
        errors++;
      }
    }
  } else {
    openTags.push(tagName);
  }
}

if (openTags.length > 0) {
  console.error(`Unclosed tags remaining: ${openTags.join(', ')}`);
  errors += openTags.length;
}

if (errors === 0) {
  console.log('HTML validation SUCCESS: All non-void tags are balanced and correctly nested!');
} else {
  console.error(`HTML validation FAILED with ${errors} errors.`);
  process.exit(1);
}
