const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. New CSS for flagship
const newStyles = `<style id="flagship-art-exhibition-styles">
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
  top: 16px;
  left: 16px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(12, 14, 18, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.flagship-badge-dot {
  width: 6px;
  height: 6px;
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
  gap: 8px !important;
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

/* PC Desktop: Full-Width Cinema Span (Left-to-Right Panoramic) */
@media (min-width: 813px) {
  .project-item.project-item-flagship {
    grid-column: 1 / -1 !important;
    width: 100% !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }
  .project-item-flagship .flagship-main {
    padding-top: 42% !important;
  }
  .project-item-flagship .project-item-line-1 {
    font-size: clamp(0.85rem, 0.9vw, 1.05rem) !important;
    margin: 1.4em 0 0.5em !important;
  }
  .project-item-flagship .project-item-line-2 {
    font-size: clamp(1.3rem, 1.8vw, 2.2rem) !important;
    height: 1.4em !important;
    line-height: 1.3 !important;
  }
  /* Card 2 starts the 2-column grid row below the flagship banner with even margin matching row 3 */
  .project-item:nth-child(2) {
    margin-top: 5em !important;
  }
}

@media (min-width: 813px) and (min-aspect-ratio: 21/9) {
  .project-item-flagship .flagship-main {
    padding-top: 38% !important;
  }
  .project-item:nth-child(2) {
    margin-top: 10em !important;
  }
}

/* Mobile & Tablet */
@media (max-width: 812px) {
  .project-item.project-item-flagship {
    grid-column: span 6 / span 6 !important;
    width: 100% !important;
    margin-top: 0 !important;
  }
  .project-item-flagship .flagship-main {
    padding-top: 65% !important;
  }
  .project-item:nth-child(2) {
    margin-top: 2em !important;
  }
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

// Replace existing style
const styleRegex = /<style id="flagship-art-exhibition-styles">[\s\S]*?<\/style>/;
if (!styleRegex.test(html)) {
  console.error("Style tag not found!");
  process.exit(1);
}
html = html.replace(styleRegex, newStyles);

// 2. Swap Card 1 and Card 2 in project-list
const cardOryzo = `<a class="project-item project-type-website" href="/projects/oryzo_ai" data-id="oryzo_ai" data-color-bg="#1a1411" data-color-text="#ffedd7" data-color-shadow="0.9"> <div class="project-item-main"> <div class="project-item-image" style="background-image: url('./assets/images/events/event_koeda.jpg'); background-size: cover; background-position: center;"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1">11/11 20:00 • リモート開催 • 視聴申込不要 • 金銭なし</div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">AI小技 発表会</div> </div> </div> </a>`;

const cardAtlas = `<a class="project-item project-type-website project-item-flagship" href="/projects/atlas_motion" data-id="atlas_motion" data-color-bg="#181818" data-color-text="#FFFDE0" data-color-shadow="0.95"> <div class="project-item-main flagship-main"> <div class="project-item-image flagship-image" style="background-image: url('./assets/images/events/event_ai_art.jpg'); background-size: cover; background-position: center;"></div> <div class="flagship-badge"><span class="flagship-badge-dot"></span><span class="flagship-badge-tag">重要文化財企画</span><span class="flagship-badge-divider">/</span><span class="flagship-badge-sub">SPECIAL PROJECT</span></div> </div> <div class="project-item-footer"> <div class="project-item-line-1 flagship-line-1"><span class="flagship-meta-date">2027年1月頃</span> <span class="flagship-meta-sep">•</span> <span class="flagship-meta-venue">国の重要文化財【名古屋市市政資料館】</span> <span class="flagship-meta-sep">•</span> <span class="flagship-meta-status">出展者・運営募集中</span></div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">AIアート展覧会を重要文化財で開催する</div> </div> </div> </a>`;

const targetOrder = cardOryzo + cardAtlas;
const newOrder = cardAtlas + cardOryzo;

if (!html.includes(targetOrder)) {
  console.error("targetOrder not found in html!");
  process.exit(1);
}

html = html.replace(targetOrder, newOrder);

fs.writeFileSync(indexPath, html, 'utf8');
console.log('index.html updated successfully with Card 1 (flagship full-width) and Card 2 (oryzo_ai)!');
