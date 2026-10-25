const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.resolve(__dirname, '../_astro/about.CNa9RfUh.css'),
  path.resolve(__dirname, '../dist/_astro/about.CNa9RfUh.css'),
  path.resolve(__dirname, '../dist/assets/index-DtUm-RFD.css')
];

function validateCssSyntax(cssContent, fileName) {
  let openBraces = 0;
  for (let i = 0; i < cssContent.length; i++) {
    if (cssContent[i] === '{') openBraces++;
    else if (cssContent[i] === '}') openBraces--;
    if (openBraces < 0) {
      throw new Error(`CSS Syntax Error in ${fileName}: Extra closing brace at char ${i}`);
    }
  }
  if (openBraces !== 0) {
    throw new Error(`CSS Syntax Error in ${fileName}: Unclosed brace (${openBraces} remaining)`);
  }
  return true;
}

function patchCssFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`[SKIP] File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  console.log(`\n[PATCHING] ${filePath}`);

  // 1. Patch base .end-section-title-link-word .char rule
  const oldCharRule = '.end-section-title-link-word .char{display:inline-block;position:relative;will-change:transform}';
  const newCharRule = '.end-section-title-link-word .char{display:inline-block;position:relative;will-change:transform;line-height:1 !important;height:1em}';

  if (content.includes(oldCharRule)) {
    content = content.replace(oldCharRule, newCharRule);
    console.log('  ✓ Replaced base .end-section-title-link-word .char');
  } else if (!content.includes('line-height:1 !important') && !content.includes('line-height: 1 !important')) {
    console.warn('  ⚠ Base .char rule pattern not matched directly; will check section override.');
  }

  // 2. Patch base .end-section-title-link-word .char-wrapper rule
  const oldWrapperRule = '.end-section-title-link-word .char-wrapper{position:relative;top:-.2em;will-change:transform}';
  const newWrapperRule = '.end-section-title-link-word .char-wrapper{position:relative;top:-.2em;will-change:transform;height:1em;line-height:1 !important}';

  if (content.includes(oldWrapperRule)) {
    content = content.replace(oldWrapperRule, newWrapperRule);
    console.log('  ✓ Replaced base .end-section-title-link-word .char-wrapper');
  }

  // 3. Patch base .end-section-title-link-word .char-wrapper .char rule
  const oldWrapperCharRule = '.end-section-title-link-word .char-wrapper .char{float:left}';
  const newWrapperCharRule = '.end-section-title-link-word .char-wrapper .char{float:left;line-height:1 !important;height:1em}';

  if (content.includes(oldWrapperCharRule)) {
    content = content.replace(oldWrapperCharRule, newWrapperCharRule);
    console.log('  ✓ Replaced base .end-section-title-link-word .char-wrapper .char');
  }

  // 4. Ensure explicit end-section char rotation override rule exists
  const explicitSectionComment = '/* EndSection Character Rotation Pixel Alignment */';
  const explicitRules = `
${explicitSectionComment}
.end-section-title-link-word .char {
  line-height: 1 !important;
  height: 1em !important;
}
.end-section-title-link-word .char-wrapper {
  line-height: 1 !important;
  height: 1em !important;
}
.end-section-title-link-word .char-wrapper .char {
  line-height: 1 !important;
  height: 1em !important;
}
`;

  if (!content.includes(explicitSectionComment)) {
    content += explicitRules;
    console.log('  ✓ Appended explicit EndSection character alignment override block');
  } else {
    console.log('  ℹ Explicit EndSection character alignment override already present');
  }

  // Validate CSS syntax before writing
  validateCssSyntax(content, path.basename(filePath));
  console.log(`  ✓ CSS syntax validation PASSED for ${path.basename(filePath)}`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`  ✓ Successfully wrote patched file: ${path.basename(filePath)}`);
}

function run() {
  console.log('=== Starting EndSection Character LineHeight & Offset Alignment Patch ===');
  for (const file of targetFiles) {
    patchCssFile(file);
  }
  console.log('\n=== All targets processed successfully ===');
}

run();
