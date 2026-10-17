const fs = require('fs');

const file = 'index.html';
let content = fs.readFileSync(file, 'utf8');

// 1. Target card replacement
const flagshipCardRegex = /<a class="project-item project-type-website[^"]*" href="\/projects\/atlas_motion"[\s\S]*?<\/a>/;

const newFlagshipCard = `<a class="project-item project-type-website project-item-flagship" href="/projects/atlas_motion" data-id="atlas_motion" data-color-bg="#181818" data-color-text="#FFFDE0" data-color-shadow="0.95"> <div class="project-item-main flagship-main"> <div class="project-item-image flagship-image" style="background-image: url('./assets/images/events/event_ai_art.jpg'); background-size: cover; background-position: center;"></div> <div class="flagship-badge"><span class="flagship-badge-dot"></span><span class="flagship-badge-tag">重要文化財企画</span><span class="flagship-badge-divider">/</span><span class="flagship-badge-sub">SPECIAL PROJECT</span></div> </div> <div class="project-item-footer"> <div class="project-item-line-1 flagship-line-1"><span class="flagship-meta-date">2027年1月頃</span> <span class="flagship-meta-sep">•</span> <span class="flagship-meta-venue">国の重要文化財【名古屋市市政資料館】</span> <span class="flagship-meta-sep">•</span> <span class="flagship-meta-status">出展者・運営募集中</span></div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">AIアート展覧会を重要文化財で開催する</div> </div> </div> </a>`;

content = content.replace(flagshipCardRegex, newFlagshipCard);

// 2. Refined, prestigious CSS
const styleBlock = `<style id="flagship-art-exhibition-styles">
/* Flagship AI Art Exhibition Special Styling (Chic, High-End & Prestigious) */
.project-item-flagship .flagship-main {
  position: relative !important;
  border-radius: 16px !important;
  border: 1px solid rgba(195, 150, 75, 0.45) !important;
  box-shadow: 0 14px 38px rgba(30, 24, 15, 0.12), 0 2px 10px rgba(195, 150, 75, 0.1) !important;
  animation: flagship-ambient-pulse 5s ease-in-out infinite !important;
  transition: border-color 0.4s ease, box-shadow 0.4s ease, transform 0.4s cubic-bezier(0.25, 1, 0.5, 1) !important;
  overflow: hidden !important;
}

@keyframes flagship-ambient-pulse {
  0%, 100% {
    border-color: rgba(195, 150, 75, 0.38);
    box-shadow: 0 14px 38px rgba(30, 24, 15, 0.12), 0 2px 8px rgba(195, 150, 75, 0.08);
  }
  50% {
    border-color: rgba(215, 172, 95, 0.65);
    box-shadow: 0 16px 42px rgba(30, 24, 15, 0.16), 0 4px 18px rgba(215, 172, 95, 0.18);
  }
}

.project-item-flagship:hover .flagship-main {
  border-color: rgba(215, 172, 95, 0.85) !important;
  box-shadow: 0 20px 48px rgba(30, 24, 15, 0.2), 0 6px 24px rgba(215, 172, 95, 0.25) !important;
}

.project-item-flagship .flagship-main::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(10, 10, 14, 0.06) 0%, rgba(10, 10, 14, 0) 45%, rgba(10, 10, 14, 0.2) 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  z-index: 2;
}

/* Luxury Curator Badge (discreet, frosted black glass pill) */
.flagship-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  border-radius: 9999px;
  background: rgba(12, 14, 18, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.flagship-badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #e5c48b;
  box-shadow: 0 0 6px rgba(229, 196, 139, 0.7);
  flex-shrink: 0;
}

.flagship-badge-tag {
  font-family: 'Aeonik', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: #ece7e1;
  line-height: 1;
}

.flagship-badge-divider {
  color: rgba(255, 255, 255, 0.28);
  font-size: 10px;
  line-height: 1;
  margin: 0 1px;
}

.flagship-badge-sub {
  font-family: 'IBMPlexMono', monospace;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: #d8b77f;
  line-height: 1;
}

/* Footer Meta Line (High contrast, museum prestige on light background) */
.flagship-line-1 {
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  gap: 6px !important;
}

.flagship-meta-date {
  color: rgba(0, 0, 0, 0.58) !important;
  font-weight: 500 !important;
}

.flagship-meta-sep {
  color: rgba(0, 0, 0, 0.22) !important;
}

.flagship-meta-venue {
  color: #93671e !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em !important;
}

.flagship-meta-status {
  color: #8c5f18 !important;
  background: rgba(195, 145, 60, 0.1) !important;
  border: 1px solid rgba(195, 145, 60, 0.3) !important;
  padding: 1px 7px !important;
  border-radius: 4px !important;
  font-weight: 600 !important;
  font-size: 0.84em !important;
  display: inline-block !important;
  letter-spacing: 0.02em !important;
}

@media (max-width: 768px) {
  .flagship-badge {
    top: 10px;
    left: 10px;
    padding: 4px 10px;
    gap: 5px;
  }
  .flagship-badge-tag {
    font-size: 10px;
  }
  .flagship-badge-sub {
    font-size: 9px;
  }
  .flagship-line-1 {
    font-size: clamp(0.72rem, 2.7vw, 0.85rem) !important;
    gap: 4px !important;
  }
}
</style>`;

// Replace existing style block if present
const styleRegex = /<style id="flagship-art-exhibition-styles">[\s\S]*?<\/style>/;
if (styleRegex.test(content)) {
  content = content.replace(styleRegex, styleBlock);
} else {
  content = content.replace('</head>', styleBlock + '\n</head>');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully refined index.html with prestige styling!');
