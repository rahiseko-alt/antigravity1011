const fs = require('fs');

// 1. Process index.html
let html = fs.readFileSync('index.html', 'utf8');

const membersStartMarker = '<div id="home-members" class="section">';
const membersEndMarker = '<div id="home-goal" class="section">';

const startIdx = html.indexOf(membersStartMarker);
const endIdx = html.indexOf(membersEndMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Markers not found in index.html!', { startIdx, endIdx });
  process.exit(1);
}

const newMembersHtml = `<div id="home-members" class="section">
  <div class="members-header">
    <div class="members-header-brand">
      <span class="members-header-badge">AIueo CORE PLAYERS</span>
      <h3 class="members-header-title">AIueoを動かすプレイヤーたち</h3>
    </div>
    <div class="members-header-desc">「こういうのやるので、一緒にどうですか？」を形にするコアメンバー。</div>
  </div>

  <div class="members-grid">
    <!-- Card 1: 小齊平 恒平 -->
    <div class="member-card" data-id="kosehira">
      <div class="member-card-glow glow-cyan"></div>
      <div class="member-card-inner">
        <div class="member-card-header">
          <div class="member-card-meta">
            <span class="member-card-num">01</span>
            <span class="member-card-role-badge">REPRESENTATIVE</span>
          </div>
          <div class="member-emblem-mini orb-cyan">
            <span>K</span>
          </div>
        </div>
        <div class="member-card-body">
          <h4 class="member-card-name">小齊平 恒平</h4>
          <div class="member-card-role-title">代表 / AI活動家</div>
          <div class="member-card-sub">play with AI • 専門学校講師</div>
          <p class="member-card-catch">「今度何かやりましょう」を「こういうのやるので、一緒にどうですか？」に変える。</p>
          <p class="member-card-desc">草AI同盟の創設者。理論よりまずやってみる実践ファーストを貫き、AIの面白さと熱狂を広げる活動家。有志の実験とコラボレーションの火付け役として全体を牽引する。</p>
        </div>
        <div class="member-card-footer">
          <div class="member-card-tags">
            <span>#AI</span><span>#COMMUNITY</span><span>#ACTION</span><span>#LEADERSHIP</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 2: 伊藤 良二 -->
    <div class="member-card" data-id="ito">
      <div class="member-card-glow glow-magenta"></div>
      <div class="member-card-inner">
        <div class="member-card-header">
          <div class="member-card-meta">
            <span class="member-card-num">02</span>
            <span class="member-card-role-badge">PRODUCER</span>
          </div>
          <div class="member-emblem-mini orb-magenta">
            <span>I</span>
          </div>
        </div>
        <div class="member-card-body">
          <h4 class="member-card-name">伊藤 良二</h4>
          <div class="member-card-role-title">プロデューサー</div>
          <div class="member-card-sub">Craft Line Works代表 • 業務効率化</div>
          <p class="member-card-catch">ビジネス現場のリアルな課題をAIと仕組みで最短解決する。</p>
          <p class="member-card-desc">現場視点に根ざした業務改革とプロジェクトマネジメントのスペシャリスト。企画の立ち上げから社会実装・持続可能な仕組みづくりまでを一気通貫でプロデュースする伴走者。</p>
        </div>
        <div class="member-card-footer">
          <div class="member-card-tags">
            <span>#PRODUCE</span><span>#BUSINESS</span><span>#EFFICIENCY</span><span>#IMPLEMENT</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 3: 堺 彬 -->
    <div class="member-card" data-id="sakai">
      <div class="member-card-glow glow-emerald"></div>
      <div class="member-card-inner">
        <div class="member-card-header">
          <div class="member-card-meta">
            <span class="member-card-num">03</span>
            <span class="member-card-role-badge">TECH LEAD</span>
          </div>
          <div class="member-emblem-mini orb-emerald">
            <span>S</span>
          </div>
        </div>
        <div class="member-card-body">
          <h4 class="member-card-name">堺 彬</h4>
          <div class="member-card-role-title">開発・AI導入支援</div>
          <div class="member-card-sub">株式会社SakAI Nexus 代表取締役</div>
          <p class="member-card-catch">先端LLMと最新アーキテクチャで「動くもの」を最速で具現化。</p>
          <p class="member-card-desc">生成AI PoC開発から企業向けAI導入・システム実装までを手掛けるテックリード。確かな技術力と柔軟なエンジニアリングで、構想を即座に動くプロダクトへと昇華させる。</p>
        </div>
        <div class="member-card-footer">
          <div class="member-card-tags">
            <span>#TECH</span><span>#DEVELOPMENT</span><span>#LLM</span><span>#ARCHITECTURE</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 4: 岡本 ジュンイチ -->
    <div class="member-card" data-id="okamoto">
      <div class="member-card-glow glow-amber"></div>
      <div class="member-card-inner">
        <div class="member-card-header">
          <div class="member-card-meta">
            <span class="member-card-num">04</span>
            <span class="member-card-role-badge">ADVISOR</span>
          </div>
          <div class="member-emblem-mini orb-amber">
            <span>O</span>
          </div>
        </div>
        <div class="member-card-body">
          <h4 class="member-card-name">岡本 ジュンイチ</h4>
          <div class="member-card-role-title">顧問 / メディアプロデューサー</div>
          <div class="member-card-sub">SNSマーケター • メディア戦略ディレクター</div>
          <p class="member-card-catch">熱狂の現場を世の中に届け、波を起こすメディア戦略家。</p>
          <p class="member-card-desc">SNSマーケティングとメディアディレクションのプロフェッショナル。草活動の熱量や活動の魅力を最適な文脈と言葉で世の中に拡散し、新たな仲間を巻き込む触媒を果たす。</p>
        </div>
        <div class="member-card-footer">
          <div class="member-card-tags">
            <span>#MEDIA</span><span>#MARKETING</span><span>#SNS</span><span>#STRATEGY</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> `;

html = html.substring(0, startIdx) + newMembersHtml + html.substring(endIdx);

// Remove the inline script for updateMembersHorizontalScroll
const scriptRegex = /<script>\s*\(function\(\)\s*\{\s*function updateMembersHorizontalScroll[\s\S]*?<\/script>/;
if (!scriptRegex.test(html)) {
  console.warn('Horizontal scroll script pattern not matched!');
} else {
  html = html.replace(scriptRegex, '');
  console.log('Successfully removed updateMembersHorizontalScroll script');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated index.html');

// 2. Process _astro/about.CNa9RfUh.css
let css = fs.readFileSync('_astro/about.CNa9RfUh.css', 'utf8');

const cssStartMarker = '/* ==========================================================================\r\n   Home Members - Full-Page Horizontal Screen Scroll Section (100vw x 100dvh)\r\n   ========================================================================== */';
const cssStartMarkerLf = '/* ==========================================================================\n   Home Members - Full-Page Horizontal Screen Scroll Section (100vw x 100dvh)\n   ========================================================================== */';

let cssStartIdx = css.indexOf(cssStartMarker);
if (cssStartIdx === -1) {
  cssStartIdx = css.indexOf(cssStartMarkerLf);
}

if (cssStartIdx === -1) {
  // Try finding #home-members.section
  cssStartIdx = css.indexOf('#home-members.section {');
}

if (cssStartIdx === -1) {
  console.error('CSS start marker not found!');
  process.exit(1);
}

const newCss = `/* ==========================================================================
   Home Members - Clean Responsive Vertical Section
   ========================================================================== */
#home-members.section {
  display: block !important;
  position: relative !important;
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  padding: clamp(60px, 8vh, 120px) var(--base-padding-x) !important;
  margin: 0 !important;
  background: #040508 !important;
  color: #fff !important;
  box-sizing: border-box !important;
  overflow: visible !important;
}

.members-header {
  position: relative;
  margin-bottom: clamp(2.5rem, 5vh, 4rem);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.members-header-badge {
  font-family: IBMPlexMono, monospace;
  font-size: clamp(0.75rem, 0.85vw, 0.95rem);
  letter-spacing: 0.18em;
  color: #00f0ff;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.members-header-badge::before {
  content: "";
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #00f0ff;
  box-shadow: 0 0 10px #00f0ff, 0 0 20px rgba(0, 240, 255, 0.7);
}

.members-header-title {
  font-family: Aeonik, sans-serif;
  font-size: clamp(2rem, 4.5vw, 4.8rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: #ffffff;
  margin: 0;
}

.members-header-desc {
  font-size: clamp(0.95rem, 1.1vw, 1.2rem);
  color: rgba(255, 255, 255, 0.7);
  max-width: 820px;
  line-height: 1.6;
  margin: 0;
}

/* Members Grid: 2 columns on desktop, 1 on mobile */
.members-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(1.5rem, 2.5vw, 2.5rem);
  width: 100%;
  box-sizing: border-box;
}

/* Member Card */
.member-card {
  position: relative;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  overflow: hidden;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.member-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

/* Subtle corner aura glow */
.member-card-glow {
  position: absolute;
  top: -60px;
  right: -60px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  filter: blur(50px);
  opacity: 0.25;
  pointer-events: none;
  z-index: 1;
  transition: opacity 0.4s ease;
}

.member-card:hover .member-card-glow {
  opacity: 0.45;
}

.glow-cyan { background: radial-gradient(circle, #00f0ff 0%, #1a2ffb 70%, transparent 100%); }
.glow-magenta { background: radial-gradient(circle, #ff007a 0%, #8832f7 70%, transparent 100%); }
.glow-emerald { background: radial-gradient(circle, #00ff88 0%, #00f0ff 70%, transparent 100%); }
.glow-amber { background: radial-gradient(circle, #ffaa00 0%, #ff4c41 70%, transparent 100%); }

.member-card-inner {
  position: relative;
  z-index: 2;
  padding: clamp(1.8rem, 2.5vw, 2.5rem);
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

.member-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.member-card-meta {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.member-card-num {
  font-family: IBMPlexMono, monospace;
  font-size: 1.1rem;
  font-weight: 600;
  color: #00f0ff;
  letter-spacing: 0.1em;
}

.member-card-role-badge {
  font-family: IBMPlexMono, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.85);
  padding: 0.3rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  text-transform: uppercase;
  font-weight: 500;
}

/* Mini Orb Emblem */
.member-emblem-mini {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Aeonik, sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.orb-cyan {
  background: linear-gradient(135deg, rgba(26, 47, 251, 0.8), rgba(0, 240, 255, 0.8));
}
.orb-magenta {
  background: linear-gradient(135deg, rgba(136, 50, 247, 0.8), rgba(255, 0, 122, 0.8));
}
.orb-emerald {
  background: linear-gradient(135deg, rgba(0, 240, 255, 0.8), rgba(0, 255, 136, 0.8));
}
.orb-amber {
  background: linear-gradient(135deg, rgba(255, 76, 65, 0.8), rgba(255, 170, 0, 0.8));
}

.member-card-body {
  flex: 1 1 auto;
}

.member-card-name {
  font-size: clamp(1.8rem, 2.4vw, 2.6rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: #ffffff;
  margin: 0 0 0.35rem 0;
}

.member-card-role-title {
  font-family: IBMPlexMono, monospace;
  font-size: clamp(0.88rem, 1vw, 1.05rem);
  color: #00f0ff;
  margin-bottom: 0.25rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.member-card-sub {
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.25rem;
  line-height: 1.4;
}

.member-card-catch {
  font-size: clamp(1rem, 1.15vw, 1.2rem);
  line-height: 1.5;
  color: #ffffff;
  font-weight: 500;
  margin: 0 0 1rem 0;
  padding-left: 0.9rem;
  border-left: 3px solid #00f0ff;
}

[data-id="ito"] .member-card-catch { border-left-color: #ff007a; }
[data-id="sakai"] .member-card-catch { border-left-color: #00ff88; }
[data-id="okamoto"] .member-card-catch { border-left-color: #ffaa00; }

.member-card-desc {
  font-size: clamp(0.88rem, 0.95vw, 1rem);
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.75);
  margin: 0 0 1.5rem 0;
}

.member-card-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.member-card-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.member-card-tags span {
  font-family: IBMPlexMono, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
}

/* Mobile responsive */
@media (max-width: 812px) {
  #home-members.section {
    padding: 60px 20px !important;
  }
  .members-grid {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
  .member-card-inner {
    padding: 1.5rem 1.2rem;
  }
  .member-card-name {
    font-size: 1.75rem;
  }
  .member-card-catch {
    font-size: 0.98rem;
  }
  .member-card-desc {
    font-size: 0.88rem;
  }
}
`;

css = css.substring(0, cssStartIdx) + newCss;

fs.writeFileSync('_astro/about.CNa9RfUh.css', css, 'utf8');
console.log('Successfully updated _astro/about.CNa9RfUh.css');
