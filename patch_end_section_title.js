const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.resolve(__dirname, '_astro/about.CNa9RfUh.css'),
  path.resolve(__dirname, 'dist/_astro/about.CNa9RfUh.css')
];

function patchCSS(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return false;
  }

  let css = fs.readFileSync(filePath, 'utf8');
  let originalCss = css;

  // 1. PC: #end-section-title and #end-section-title-link
  // Ensure clamp(2.0rem, 4.6vw, 4.8rem) !important;
  css = css.replace(
    /(#end-section-title\s*\{[^}]*?--font-size:\s*)clamp\([^)]+\)(\s*!important;)/g,
    '$1clamp(2.0rem, 4.6vw, 4.8rem)$2'
  );
  css = css.replace(
    /(#end-section-title\s*\{[^}]*?font-size:\s*)clamp\([^)]+\)(\s*!important;)/g,
    '$1clamp(2.0rem, 4.6vw, 4.8rem)$2'
  );
  css = css.replace(
    /(#end-section-title-link\s*\{[^}]*?font-size:\s*)clamp\([^)]+\)(\s*!important;)/g,
    '$1clamp(2.0rem, 4.6vw, 4.8rem)$2'
  );

  // 1b. Mobile: @media (max-width: 812px) for #end-section-title, #end-section-title-link
  // Ensure clamp(1.2rem, 6.0vw, 2.0rem) !important;
  const mobileRegex = /(@media\s*\(max-width:\s*812px\)\s*\{[\s\S]*?#end-section-title,\s*#end-section-title-link\s*\{)([\s\S]*?)(\})/g;
  css = css.replace(mobileRegex, (match, p1, p2, p3) => {
    let inner = p2;
    inner = inner.replace(/(--font-size:\s*)clamp\([^)]+\)(\s*!important;)/g, '$1clamp(1.2rem, 6.0vw, 2.0rem)$2');
    inner = inner.replace(/(font-size:\s*)clamp\([^)]+\)(\s*!important;)/g, '$1clamp(1.2rem, 6.0vw, 2.0rem)$2');
    return p1 + inner + p3;
  });

  // 2. .end-section-title-link-word
  // Ensure white-space: nowrap !important; and height: 1.08em !important;
  const wordRuleRegex = /\.end-section-title-link-word\s*\{([^}]*)\}/;
  const wordRuleContent = `
  white-space: nowrap !important;
  height: 1.08em !important;
`;

  if (wordRuleRegex.test(css)) {
    css = css.replace(wordRuleRegex, `.end-section-title-link-word {${wordRuleContent}}`);
  } else {
    // Append to file
    css += `\n/* EndSection Typography Fit & Overflow Fix */\n.end-section-title-link-word {${wordRuleContent}}\n`;
  }

  // 3. Verify Phase 2 rules exist:
  // .end-section-title-link-word .char-wrapper { height: 1em !important; line-height: 1 !important; }
  // .end-section-title-link-word .char-wrapper .char { height: 1em !important; line-height: 1 !important; }
  if (!css.includes('.end-section-title-link-word .char-wrapper')) {
    const phase2Rules = `
/* Phase 2: Perfect 0.0px Seamless Text Rollup */
.end-section-title-link-word .char-wrapper {
  height: 1em !important;
  line-height: 1 !important;
}
.end-section-title-link-word .char-wrapper .char {
  height: 1em !important;
  line-height: 1 !important;
}
`;
    css += phase2Rules;
  }

  // 4. CSS Syntax Validation: brace balance
  let openBraces = (css.match(/\{/g) || []).length;
  let closeBraces = (css.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    throw new Error(`CSS syntax error in ${filePath}: unbalanced braces (${openBraces} open vs ${closeBraces} close)`);
  }

  // Verification of required rules
  const checks = [
    { name: 'PC #end-section-title font-size', pattern: /#end-section-title\s*\{[\s\S]*?font-size:\s*clamp\(2\.0rem,\s*4\.6vw,\s*4\.8rem\)\s*!important;/ },
    { name: 'PC #end-section-title-link font-size', pattern: /#end-section-title-link\s*\{[\s\S]*?font-size:\s*clamp\(2\.0rem,\s*4\.6vw,\s*4\.8rem\)\s*!important;/ },
    { name: 'Mobile #end-section-title font-size', pattern: /#end-section-title,\s*#end-section-title-link\s*\{[\s\S]*?font-size:\s*clamp\(1\.2rem,\s*6\.0vw,\s*2\.0rem\)\s*!important;/ },
    { name: '.end-section-title-link-word nowrap', pattern: /\.end-section-title-link-word\s*\{[\s\S]*?white-space:\s*nowrap\s*!important;/ },
    { name: '.end-section-title-link-word height', pattern: /\.end-section-title-link-word\s*\{[\s\S]*?height:\s*1\.08em\s*!important;/ },
    { name: 'Phase 2 .char-wrapper height/line-height', pattern: /\.end-section-title-link-word\s+\.char-wrapper\s*\{[\s\S]*?height:\s*1em\s*!important;[\s\S]*?line-height:\s*1\s*!important;/ },
    { name: 'Phase 2 .char height/line-height', pattern: /\.end-section-title-link-word\s+\.char-wrapper\s+\.char\s*\{[\s\S]*?height:\s*1em\s*!important;[\s\S]*?line-height:\s*1\s*!important;/ }
  ];

  for (const check of checks) {
    if (!check.pattern.test(css)) {
      throw new Error(`Verification failed for ${filePath}: ${check.name} missing or malformed`);
    }
  }

  fs.writeFileSync(filePath, css, 'utf8');
  console.log(`Successfully verified and patched: ${filePath}`);
  return true;
}

for (const f of targetFiles) {
  patchCSS(f);
}
console.log('All patches applied and verified successfully.');
