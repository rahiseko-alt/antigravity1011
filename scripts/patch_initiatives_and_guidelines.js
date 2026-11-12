import fs from 'fs';
import path from 'path';

const indexPath = path.resolve('index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. CSS for Initiatives CTA group (LINE + Email) and Compact Home Goal CTA
const CUSTOM_CSS = `
/* ==========================================================================
   INITIATIVES CTA GROUP (LINE & EMAIL BUTTONS) & COMPACT GOAL CTA SPEC
   ========================================================================== */

.initiatives-cta-group {
  place-self: center !important;
  grid-column: 1 / span 12 !important;
  margin-top: 3.5em !important;
  margin-bottom: 2.5em !important;
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 16px !important;
  z-index: 10 !important;
  position: relative !important;
  width: 100% !important;
}

@media (max-width: 812px) {
  .initiatives-cta-group {
    grid-column: 1 / span 6 !important;
    margin-top: 2.5em !important;
    margin-bottom: 3.5em !important;
    flex-direction: column !important;
    gap: 12px !important;
    padding: 0 16px !important;
    box-sizing: border-box !important;
  }
}

#home-featured-cta-line,
#home-featured-cta {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: relative !important;
  font-size: clamp(0.875rem, 0.95vw, 1.15rem) !important;
  font-family: 'Aeonik', -apple-system, BlinkMacSystemFont, sans-serif !important;
  font-weight: 500 !important;
  letter-spacing: 0.03em !important;
  height: 3.2em !important;
  padding: 0 1.5em 0 1.625em !important;
  border-radius: 6.25em !important;
  border: none !important;
  overflow: hidden !important;
  cursor: pointer !important;
  text-decoration: none !important;
  pointer-events: auto !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25) !important;
  margin: 0 !important;
  float: none !important;
  place-self: unset !important;
  grid-column: unset !important;
  transition: color 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              background-color 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.3s ease,
              transform 0.3s ease !important;
}

@media (max-width: 812px) {
  #home-featured-cta-line,
  #home-featured-cta {
    width: 100% !important;
    max-width: 340px !important;
  }
}

/* LINE Button Style */
#home-featured-cta-line {
  background: #06C755 !important;
  color: #ffffff !important;
}

@media (hover: hover) {
  #home-featured-cta-line:hover {
    background: #05b04c !important;
    box-shadow: 0 6px 22px rgba(6, 199, 85, 0.45) !important;
    transform: translateY(-2px) !important;
  }
  #home-featured-cta-line:hover .pill-cta-arrow {
    transform: translateZ(0) !important;
  }
  #home-featured-cta-line:hover .pill-cta-text {
    transform: translate3d(1.5em, 0, 0) !important;
  }
  #home-featured-cta-line:hover .pill-cta-dots {
    transform: scale(0) translateZ(0) !important;
  }
}

/* Email Button Style */
#home-featured-cta {
  background: #0016ec !important;
  color: #ffffff !important;
}

@media (hover: hover) {
  #home-featured-cta:hover {
    background: #000eb3 !important;
    box-shadow: 0 6px 22px rgba(0, 22, 236, 0.5) !important;
    transform: translateY(-2px) !important;
  }
  #home-featured-cta:hover .pill-cta-arrow {
    transform: translateZ(0) !important;
  }
  #home-featured-cta:hover .pill-cta-text {
    transform: translate3d(1.5em, 0, 0) !important;
  }
  #home-featured-cta:hover .pill-cta-dots {
    transform: scale(0) translateZ(0) !important;
  }
}

/* Compact Home Goal CTA */
.home-goal-cta-wrap {
  margin-top: 1.8em !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-start !important;
}

#home-goal-details-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  position: relative !important;
  font-size: clamp(0.875rem, 0.95vw, 1.05rem) !important;
  font-family: 'Aeonik', -apple-system, BlinkMacSystemFont, sans-serif !important;
  font-weight: 500 !important;
  letter-spacing: 0.03em !important;
  height: 3.1em !important;
  padding: 0 1.5em 0 1.625em !important;
  border-radius: 6.25em !important;
  border: 1px solid rgba(255, 255, 255, 0.25) !important;
  background: rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  color: #ffffff !important;
  text-decoration: none !important;
  cursor: pointer !important;
  overflow: hidden !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

@media (hover: hover) {
  #home-goal-details-btn:hover {
    background: #ffffff !important;
    color: #050810 !important;
    border-color: #ffffff !important;
    box-shadow: 0 6px 24px rgba(255, 255, 255, 0.3) !important;
    transform: translateY(-2px) !important;
  }
  #home-goal-details-btn:hover .pill-cta-arrow {
    transform: translateZ(0) !important;
  }
  #home-goal-details-btn:hover .pill-cta-text {
    transform: translate3d(1.5em, 0, 0) !important;
  }
  #home-goal-details-btn:hover .pill-cta-dots {
    transform: scale(0) translateZ(0) !important;
  }
}
`;

// Insert custom CSS before </style> or inside existing styles
if (html.includes('/* COMPACT_INITIATIVES_AND_GOAL_STYLES */')) {
  // Already present
} else {
  html = html.replace('</style>', `${CUSTOM_CSS}\n</style>`);
}

// 2. Replace the single #home-featured-cta with the dual LINE + Email button group
const oldCtaRegex = /<a id="home-featured-cta" class="pill-cta-btn pill-cta-blue"[\s\S]*?<\/a>/;

const newCtaGroup = `<div class="initiatives-cta-group">
  <a id="home-featured-cta-line" class="pill-cta-btn pill-cta-line" href="https://line.me/ti/p/~kosehirakouhei" target="_blank" rel="noopener noreferrer" aria-label="LINEで企画を提案する">
    <div class="pill-cta-container">
      <span class="pill-cta-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
      </span>
      <span class="pill-cta-text">LINEで企画を提案する</span>
      <span class="pill-cta-dots"><span class="pill-cta-dot"></span></span>
    </div>
  </a>
  <a id="home-featured-cta" class="pill-cta-btn pill-cta-blue" href="mailto:info@kouheikosehira.com?subject=%E3%80%90AIueo%E3%80%91%E4%BC%81%E7%94%BB%E3%81%AE%E3%81%94%E6%8F%90%E6%A1%88" target="_blank" aria-label="メールで企画を提案する">
    <div class="pill-cta-container" id="home-featured-cta-container">
      <span class="pill-cta-arrow" id="home-featured-cta-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.343 8h11.314m0 0-4.984 4.984M13.657 8 8.673 3.016"></path></svg>
      </span>
      <span class="pill-cta-text" id="home-featured-cta-text">メールで企画を提案する</span>
      <span class="pill-cta-dots" id="home-featured-cta-dots"><span class="pill-cta-dot"></span></span>
    </div>
  </a>
</div>`;

if (oldCtaRegex.test(html)) {
  html = html.replace(oldCtaRegex, newCtaGroup);
  console.log('Successfully replaced #home-featured-cta with dual button group');
} else {
  console.warn('Could not find #home-featured-cta to replace');
}

// 3. Compact #home-goal and add Next Page CTA button
const oldGoalRegex = /<div id="home-goal" class="section">[\s\S]*?<div id="home-goal-texts">[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const newGoalContent = `<div id="home-goal" class="section"> <div id="home-goal-context"> <div id="home-goal-context-inner"> <div id="home-goal-title">運営のかかわり方・スタンス（Operating Guidelines）</div> <div id="home-goal-texts"> <div class="home-goal-texts-paragraph">AIueoは企画を持つ人と参加したい人が出会う「呼びかけの場」です。企画・金銭の当事者ではなく、自由な行動と自己責任を基本としています。</div> </div> <div class="home-goal-cta-wrap"> <a id="home-goal-details-btn" class="pill-cta-btn pill-cta-white" href="./guidelines.html" aria-label="詳細な運営規約・スタンスを見る"> <div class="pill-cta-container"> <span class="pill-cta-arrow"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.343 8h11.314m0 0-4.984 4.984M13.657 8 8.673 3.016"></path></svg> </span> <span class="pill-cta-text">詳細な運営規約・スタンスを見る</span> <span class="pill-cta-dots"><span class="pill-cta-dot"></span></span> </div> </a> </div> </div> </div>`;

if (oldGoalRegex.test(html)) {
  html = html.replace(oldGoalRegex, newGoalContent);
  console.log('Successfully compacted #home-goal and added details button');
} else {
  console.warn('Could not find #home-goal to compact');
}

fs.writeFileSync(indexPath, html, 'utf8');
console.log('Successfully updated index.html');
