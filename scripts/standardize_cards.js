const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Replace the CSS rules for line 1 and meta elements
const oldCssBlock = `/* Footer Meta Line (High contrast, museum prestige on light background) */
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
}`;

const newCssBlock = `/* Standardized 3-element Meta Line for all cards: [Date] • [Venue] • [Recruitment Status Chip] */
.project-item-line-1 {
  display: flex !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  gap: 6px 8px !important;
  font-size: clamp(0.75rem, 0.8vw, 0.92rem) !important;
  letter-spacing: 0.02em !important;
  font-weight: 500 !important;
  line-height: 1.5 !important;
  margin: 1.2em 0 0.5em !important;
  text-transform: none !important;
}

.project-meta-date {
  color: rgba(0, 0, 0, 0.58) !important;
  font-weight: 500 !important;
  white-space: nowrap !important;
}

.project-meta-sep {
  color: rgba(0, 0, 0, 0.22) !important;
  font-size: 0.75em !important;
  user-select: none !important;
}

.project-meta-venue {
  color: rgba(0, 0, 0, 0.76) !important;
  font-weight: 500 !important;
  white-space: nowrap !important;
}

.project-meta-status {
  display: inline-flex !important;
  align-items: center !important;
  white-space: nowrap !important;
  font-size: 0.82em !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em !important;
  padding: 1.5px 7px !important;
  border-radius: 4px !important;
  color: #1a1a1a !important;
  background: rgba(0, 0, 0, 0.05) !important;
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  line-height: 1.4 !important;
}

/* Card 1 Flagship Overrides (Cultural Heritage highlight) */
.project-item-flagship .project-meta-venue {
  color: #93671e !important;
  font-weight: 600 !important;
}

.project-item-flagship .project-meta-status {
  color: #8c5f18 !important;
  background: rgba(195, 145, 60, 0.1) !important;
  border: 1px solid rgba(195, 145, 60, 0.3) !important;
}`;

if (!html.includes(oldCssBlock)) {
  console.error("Could not find oldCssBlock in index.html");
  process.exit(1);
}
html = html.replace(oldCssBlock, newCssBlock);

// 2. Also update mobile styles for .project-item-line-1
const oldMobileLine1 = `.flagship-line-1 {
    font-size: clamp(0.72rem, 2.7vw, 0.85rem) !important;
    margin-top: 1.1em !important;
    gap: 5px !important;
  }`;

const newMobileLine1 = `.project-item-line-1 {
    font-size: clamp(0.72rem, 2.7vw, 0.85rem) !important;
    margin-top: 1.1em !important;
    gap: 4px 6px !important;
  }
  .project-meta-status {
    font-size: 0.8em !important;
    padding: 1px 6px !important;
  }`;

if (html.includes(oldMobileLine1)) {
  html = html.replace(oldMobileLine1, newMobileLine1);
}

// 3. Replace the cards in .project-list
const oldListStart = '<div class="project-list">';
const oldListEnd = '</div> <a id="home-featured-cta"';

const pStart = html.indexOf(oldListStart);
const pEnd = html.indexOf(oldListEnd);

if (pStart === -1 || pEnd === -1) {
  console.error("Could not find project-list boundaries");
  process.exit(1);
}

const standardizedCards = [
  // Card 1: AIアート展覧会 (Flagship, badge only on this card)
  `<a class="project-item project-type-website project-item-flagship" href="/projects/atlas_motion" data-id="atlas_motion" data-color-bg="#181818" data-color-text="#FFFDE0" data-color-shadow="0.95"> <div class="flagship-badge-header"><div class="flagship-badge"><span class="flagship-badge-dot"></span><span class="flagship-badge-tag">重要文化財企画</span><span class="flagship-badge-divider">/</span><span class="flagship-badge-sub">SPECIAL PROJECT</span></div></div> <div class="project-item-main flagship-main"> <div class="project-item-image flagship-image" style="background-image: url('./assets/images/events/event_ai_art.jpg'); background-size: cover; background-position: center;"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1"><span class="project-meta-date">2027年1月頃</span> <span class="project-meta-sep">•</span> <span class="project-meta-venue">名古屋市市政資料館（国の重要文化財）</span> <span class="project-meta-sep">•</span> <span class="project-meta-status">出展者・運営メンバー募集中</span></div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">AIアート展覧会を重要文化財で開催する</div> </div> </div> </a>`,

  // Card 2: AI小技 発表会
  `<a class="project-item project-type-website" href="/projects/oryzo_ai" data-id="oryzo_ai" data-color-bg="#1a1411" data-color-text="#ffedd7" data-color-shadow="0.9"> <div class="project-item-main"> <div class="project-item-image" style="background-image: url('./assets/images/events/event_koeda.jpg'); background-size: cover; background-position: center;"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1"><span class="project-meta-date">11/11(水) 20:00</span> <span class="project-meta-sep">•</span> <span class="project-meta-venue">リモート開催</span> <span class="project-meta-sep">•</span> <span class="project-meta-status">参加・視聴自由（申込不要）</span></div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">AI小技 発表会</div> </div> </div> </a>`,

  // Card 3: SNS運用の自動化
  `<a class="project-item project-type-website" href="/projects/porsche_dream_machine" data-id="porsche_dream_machine" data-color-bg="#EFD5D3" data-color-text="#000000" data-color-shadow="0.95"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1"><span class="project-meta-date">随時進行中</span> <span class="project-meta-sep">•</span> <span class="project-meta-venue">オンライン</span> <span class="project-meta-sep">•</span> <span class="project-meta-status">共同開発メンバー募集中</span></div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">SNS運用の自動化</div> </div> </div> </a>`,

  // Card 4: 自社特化型 AIチャットボット
  `<a class="project-item project-type-website" href="/projects/synthetic_human" data-id="synthetic_human" data-color-bg="#9d8aff" data-color-text="#ffffff" data-color-shadow="0.95"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1"><span class="project-meta-date">随時進行中</span> <span class="project-meta-sep">•</span> <span class="project-meta-venue">オンライン</span> <span class="project-meta-sep">•</span> <span class="project-meta-status">実証実験パートナー募集中</span></div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">自社特化型 AIチャットボット</div> </div> </div> </a>`,

  // Card 5: 音声カルテ作成アプリ
  `<a class="project-item project-type-website" href="/projects/spatial_fusion" data-id="spatial_fusion" data-color-bg="#D6C8ED" data-color-text="#000000" data-color-shadow="0.95"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1"><span class="project-meta-date">随時進行中</span> <span class="project-meta-sep">•</span> <span class="project-meta-venue">オンライン</span> <span class="project-meta-sep">•</span> <span class="project-meta-status">フィールドテスター募集中</span></div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">音声カルテ作成アプリ</div> </div> </div> </a>`,

  // Card 6: 書類業務の半自動化アプリ
  `<a class="project-item project-type-website" href="/projects/spaace" data-id="spaace" data-color-bg="#010a16" data-color-text="#ffece2" data-color-shadow="0.85"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1"><span class="project-meta-date">随時進行中</span> <span class="project-meta-sep">•</span> <span class="project-meta-venue">オンライン</span> <span class="project-meta-sep">•</span> <span class="project-meta-status">企画・開発メンバー募集中</span></div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">書類業務の半自動化アプリ</div> </div> </div> </a>`
].join('');

html = html.substring(0, pStart + oldListStart.length) + ' ' + standardizedCards + ' ' + html.substring(pEnd);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated index.html with standardized cards and styles');
