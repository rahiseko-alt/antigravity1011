const fs = require('fs');

console.log('[1/3] Updating index.html to remove horizontal scroll on members...');
let html = fs.readFileSync('index.html', 'utf8');

// Find members section
const membersStartMarker = '<div id="home-members"';
const goalStartMarker = '<div id="home-goal"';

const startIdx = html.indexOf(membersStartMarker);
const goalIdx = html.indexOf(goalStartMarker);

if (startIdx === -1 || goalIdx === -1) {
  console.error('Markers not found in index.html!', { startIdx, goalIdx });
  process.exit(1);
}

const newMembersSection = `<div id="home-members" class="section">
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
          <div class="member-card-sub">SNSマーケター • メディア戦略</div>
          <p class="member-card-catch">熱量を最大化し、共感と連鎖を生み出すストーリーテラー。</p>
          <p class="member-card-desc">発信力とメディアディレクションで企画の価値を広く世の中に届けるストラテジスト。草AI同盟のビジョンや活動を世の中に浸透させ、共創の輪を広げる。</p>
          <div class="member-card-tags">
            <span>#MEDIA</span><span>#MARKETING</span><span>#SNS</span><span>#STRATEGY</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div> `;

html = html.substring(0, startIdx) + newMembersSection + html.substring(goalIdx);

// Remove the inline horizontal scroll script
const scriptStartMarker = '<script>\n(function() {\n  function updateMembersHorizontalScroll()';
const scriptStartIdx = html.indexOf(scriptStartMarker);
if (scriptStartIdx !== -1) {
  const scriptEndMarker = '</script>';
  const scriptEndIdx = html.indexOf(scriptEndMarker, scriptStartIdx);
  if (scriptEndIdx !== -1) {
    html = html.substring(0, scriptStartIdx) + html.substring(scriptEndIdx + scriptEndMarker.length);
    console.log('Removed inline horizontal scroll script from index.html');
  }
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Successfully updated index.html!');

console.log('[2/3] Updating _astro/about.CNa9RfUh.css for vertical members layout...');
let css = fs.readFileSync('_astro/about.CNa9RfUh.css', 'utf8');

// Replace #home-members css
const cssCustomMarker = '/* ==========================================================================\n   HOME MEMBERS SECTION - FULL PAGE HORIZONTAL SCROLL';
const cssMarkerIdx = css.indexOf(cssCustomMarker);

const verticalMembersCss = `/* ==========================================================================
   HOME MEMBERS SECTION - CLEAN VERTICAL GRID (NO HORIZONTAL PINNING)
   ========================================================================== */
#home-members {
  position: relative;
  width: 100%;
  padding: clamp(60px, 8vw, 120px) var(--base-padding-x) !important;
  margin: 0 !important;
  box-sizing: border-box;
  background: #060709;
  color: #fff;
  z-index: 10;
}

.members-header {
  max-width: 1200px;
  margin: 0 auto clamp(30px, 4vw, 60px);
}

.members-header-brand {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.members-header-badge {
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  font-weight: 700;
  color: #00f0ff;
  text-transform: uppercase;
}

.members-header-title {
  font-size: clamp(1.8rem, 3.2vw, 2.8rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #fff;
  margin: 0;
  line-height: 1.2;
}

.members-header-desc {
  font-size: clamp(0.95rem, 1.1vw, 1.2rem);
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.6;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: clamp(20px, 2.5vw, 36px);
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .members-grid {
    grid-template-columns: 1fr;
  }
}

.member-card {
  position: relative;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  overflow: hidden;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease, box-shadow 0.35s ease;
}

.member-card:hover {
  transform: translateY(-6px);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

.member-card-glow {
  position: absolute;
  top: -40%;
  right: -30%;
  width: 250px;
  height: 250px;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.15;
  pointer-events: none;
  transition: opacity 0.35s ease;
}

.member-card:hover .member-card-glow {
  opacity: 0.3;
}

.glow-cyan { background: radial-gradient(circle, #00f0ff, transparent 70%); }
.glow-magenta { background: radial-gradient(circle, #ff007a, transparent 70%); }
.glow-emerald { background: radial-gradient(circle, #00ff88, transparent 70%); }
.glow-amber { background: radial-gradient(circle, #ffaa00, transparent 70%); }

.member-card-inner {
  position: relative;
  z-index: 2;
  padding: clamp(24px, 3vw, 36px);
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  box-sizing: border-box;
}

.member-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-card-num {
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  font-size: 1.2rem;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.3);
}

.member-card-role-badge {
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
}

.member-emblem-mini {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  font-size: 1.2rem;
  font-weight: 900;
  color: #fff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

.orb-cyan { background: linear-gradient(135deg, #00f0ff, #1a2ffb); }
.orb-magenta { background: linear-gradient(135deg, #ff007a, #8832f7); }
.orb-emerald { background: linear-gradient(135deg, #00ff88, #0088ff); }
.orb-amber { background: linear-gradient(135deg, #ffaa00, #ff4c41); }

.member-card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-card-name {
  font-size: clamp(1.6rem, 2.2vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #fff;
  margin: 0;
  line-height: 1.2;
}

.member-card-role-title {
  font-size: 1rem;
  font-weight: 600;
  color: #00f0ff;
}

.member-card-sub {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
}

.member-card-catch {
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.5;
  color: #ffffff;
  border-left: 3px solid #00f0ff;
  padding-left: 12px;
  margin: 6px 0;
}

.member-card-desc {
  font-size: 0.9rem;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.7);
  margin: 6px 0 12px;
}

.member-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
}

.member-card-tags span {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.5);
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
}
`;

if (cssMarkerIdx !== -1) {
  css = css.substring(0, cssMarkerIdx) + verticalMembersCss;
} else {
  css += '\n' + verticalMembersCss;
}

fs.writeFileSync('_astro/about.CNa9RfUh.css', css, 'utf8');
console.log('Successfully updated _astro/about.CNa9RfUh.css!');

console.log('[3/3] Done updating members section!');
