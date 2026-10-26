import fs from 'fs';

const cssSnippet = `
<style id="compact-members-styles">
/* Compact Member Cards Specification */
.members-grid {
  gap: 20px !important;
  max-width: 1100px !important;
  align-items: stretch !important;
}

.member-card {
  border-radius: 18px !important;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.member-card:hover {
  transform: translateY(-4px) !important;
  border-color: rgba(255, 255, 255, 0.28) !important;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.5) !important;
}

.member-card-inner {
  padding: clamp(18px, 2.2vw, 24px) !important;
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  box-sizing: border-box !important;
}

.member-card-header {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  margin-bottom: 14px !important;
}

.member-card-meta {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
}

.member-card-num {
  font-size: 1.05rem !important;
  font-weight: 800 !important;
  color: rgba(255, 255, 255, 0.3) !important;
}

.member-card-role-badge {
  font-size: 0.65rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.12em !important;
  padding: 3px 8px !important;
  border-radius: 4px !important;
}

/* 58px High-Res Portrait Avatar */
.member-avatar {
  width: 58px !important;
  height: 58px !important;
  border-radius: 50% !important;
  overflow: hidden !important;
  border: 2px solid rgba(255, 255, 255, 0.28) !important;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45) !important;
  flex-shrink: 0 !important;
  background: #000000 !important;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.member-card:hover .member-avatar {
  transform: scale(1.06) !important;
  border-color: rgba(255, 255, 255, 0.65) !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.7) !important;
}

.member-avatar-img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
  filter: grayscale(100%) contrast(1.05) !important;
  transition: filter 0.3s ease !important;
}

.member-card:hover .member-avatar-img {
  filter: grayscale(0%) contrast(1.05) !important;
}

.member-card-body {
  display: flex !important;
  flex-direction: column !important;
  gap: 5px !important;
  flex-grow: 1 !important;
}

.member-card-name {
  font-size: clamp(1.35rem, 1.7vw, 1.7rem) !important;
  font-weight: 800 !important;
  letter-spacing: -0.02em !important;
  color: #ffffff !important;
  margin: 0 0 2px 0 !important;
  line-height: 1.2 !important;
}

.member-card-role-title {
  font-size: 0.92rem !important;
  font-weight: 600 !important;
  line-height: 1.3 !important;
}

.member-card-sub {
  font-size: 0.78rem !important;
  color: rgba(255, 255, 255, 0.5) !important;
  margin-bottom: 4px !important;
}

.member-card-catch {
  font-size: 0.92rem !important;
  font-weight: 600 !important;
  line-height: 1.45 !important;
  color: #ffffff !important;
  border-left: 2.5px solid #00f0ff !important;
  padding-left: 10px !important;
  margin: 4px 0 6px 0 !important;
}

.member-card-desc {
  font-size: 0.82rem !important;
  line-height: 1.55 !important;
  color: rgba(255, 255, 255, 0.72) !important;
  margin: 4px 0 10px 0 !important;
}

.member-card-tags {
  display: flex !important;
  flex-wrap: wrap !important;
  gap: 6px !important;
  margin-top: auto !important;
  padding-top: 6px !important;
}

.member-card-tags span {
  font-size: 0.7rem !important;
  font-weight: 500 !important;
  letter-spacing: 0.04em !important;
  color: rgba(255, 255, 255, 0.52) !important;
  padding: 2.5px 7.5px !important;
  background: rgba(255, 255, 255, 0.05) !important;
  border-radius: 4px !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

/* Specific Role Colors */
.member-card[data-id="kosehira"] .member-card-role-title { color: #00f0ff !important; }
.member-card[data-id="kosehira"] .member-card-catch { border-left-color: #00f0ff !important; }

.member-card[data-id="ito"] .member-card-role-title { color: #00f0ff !important; }
.member-card[data-id="ito"] .member-card-catch { border-left-color: #ff007a !important; }

.member-card[data-id="sakai"] .member-card-role-title { color: #00f0ff !important; }
.member-card[data-id="sakai"] .member-card-catch { border-left-color: #00ff88 !important; }

.member-card[data-id="okamoto"] .member-card-role-title { color: #00f0ff !important; }
.member-card[data-id="okamoto"] .member-card-catch { border-left-color: #ffaa00 !important; }

.member-card[data-id="yamaki"] .member-card-role-title { color: #00f0ff !important; }
.member-card[data-id="yamaki"] .member-card-catch { border-left-color: #ff2d87 !important; }

.glow-rose {
  background: radial-gradient(circle, #ff2d87 0%, #a01a7d 70%, transparent 100%) !important;
}
</style>
`;

const newMembersGridHtml = `  <div class="members-grid">
    <!-- Card 01: 小齊平 恒平 -->
    <div class="member-card" data-id="kosehira">
      <div class="member-card-glow glow-cyan"></div>
      <div class="member-card-inner">
        <div class="member-card-header">
          <div class="member-card-meta">
            <span class="member-card-num">01</span>
            <span class="member-card-role-badge">REPRESENTATIVE</span>
          </div>
          <div class="member-avatar">
            <img src="./assets/images/aiueo/member-kosehira.jpg" alt="小齊平 恒平" class="member-avatar-img">
          </div>
        </div>
        <div class="member-card-body">
          <h4 class="member-card-name">小齊平 恒平</h4>
          <div class="member-card-role-title">代表 / AI活動家</div>
          <div class="member-card-sub">play with AI • 専門学校講師</div>
          <p class="member-card-catch">「今度何かやりましょう」を「こういうのやるので、一緒にどうですか？」に変える。</p>
          <p class="member-card-desc">草AI同盟の創設者。理論より実践、名刺交換より1つの草活動を重んじる。教育機関や企業でのAI導入を手掛けつつ、AIueoでは参加者同士が気軽に対等に実験できる場づくりを牽引。</p>
          <div class="member-card-tags">
            <span>#LEADERSHIP</span><span>#COMMUNITY</span><span>#AI_ACTIVIST</span><span>#EDUCATION</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 02: 伊藤 良二 -->
    <div class="member-card" data-id="ito">
      <div class="member-card-glow glow-magenta"></div>
      <div class="member-card-inner">
        <div class="member-card-header">
          <div class="member-card-meta">
            <span class="member-card-num">02</span>
            <span class="member-card-role-badge">PRODUCER</span>
          </div>
          <div class="member-avatar">
            <img src="./assets/images/aiueo/member-ito.jpg" alt="伊藤 良二" class="member-avatar-img">
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

    <!-- Card 03: 堺 彬 -->
    <div class="member-card" data-id="sakai">
      <div class="member-card-glow glow-emerald"></div>
      <div class="member-card-inner">
        <div class="member-card-header">
          <div class="member-card-meta">
            <span class="member-card-num">03</span>
            <span class="member-card-role-badge">TECH LEAD</span>
          </div>
          <div class="member-avatar">
            <img src="./assets/images/aiueo/member-sakai.jpg" alt="堺 彬" class="member-avatar-img">
          </div>
        </div>
        <div class="member-card-body">
          <h4 class="member-card-name">堺 彬</h4>
          <div class="member-card-role-title">開発 / AI導入支援</div>
          <div class="member-card-sub">株式会社SakAI Nexus 代表取締役</div>
          <p class="member-card-catch">先端LLMと最新アーキテクチャで「動くもの」を最速で具現化。</p>
          <p class="member-card-desc">アイデアを動くプロトタイプへ昇華させるエンジニアリングの要。生成AIを組み込んだWebアプリ・自動化ツールの高速開発から、企業向けAI導入・システム構築までを牽引。</p>
          <div class="member-card-tags">
            <span>#TECH</span><span>#DEVELOPMENT</span><span>#LLM</span><span>#ARCHITECTURE</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 04: 岡本 ジュンイチ -->
    <div class="member-card" data-id="okamoto">
      <div class="member-card-glow glow-amber"></div>
      <div class="member-card-inner">
        <div class="member-card-header">
          <div class="member-card-meta">
            <span class="member-card-num">04</span>
            <span class="member-card-role-badge">ADVISOR</span>
          </div>
          <div class="member-avatar">
            <img src="./assets/images/aiueo/member-okamoto.jpg" alt="岡本 ジュンイチ" class="member-avatar-img">
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

    <!-- Card 05: 八巻 早紀 -->
    <div class="member-card" data-id="yamaki">
      <div class="member-card-glow glow-rose"></div>
      <div class="member-card-inner">
        <div class="member-card-header">
          <div class="member-card-meta">
            <span class="member-card-num">05</span>
            <span class="member-card-role-badge">COMMUNITY</span>
          </div>
          <div class="member-avatar">
            <img src="./assets/images/aiueo/member-yamaki.jpg" alt="八巻 早紀" class="member-avatar-img">
          </div>
        </div>
        <div class="member-card-body">
          <h4 class="member-card-name">八巻 早紀</h4>
          <div class="member-card-role-title">AIコミュニティ運営 / 編集者</div>
          <div class="member-card-sub">発信・集客導線 • 商品づくり</div>
          <p class="member-card-catch">AIを使う、使わない両方の手段で、想いを形にする導線をつくる。</p>
          <p class="member-card-desc">個人がネットを活用して自分の商品やサービスを届けるための発信、集客、導線づくり、AI活用をサポート。初心者にもわかりやすく整理し、実践への第一歩を伴走するコミュニティ運営者。</p>
          <div class="member-card-tags">
            <span>#COMMUNITY</span><span>#CONTENT</span><span>#MARKETING</span><span>#SUPPORT</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;

let html = fs.readFileSync('index.html', 'utf8');

// Insert CSS
if (html.includes('id="compact-members-styles"')) {
  html = html.replace(/<style id="compact-members-styles">[\s\S]*?<\/style>/, cssSnippet.trim());
} else {
  html = html.replace('</head>', cssSnippet + '\n</head>');
}

// Replace members-grid HTML
const gridRegex = /<div class="members-grid">[\s\S]*?<\/div>\s*<\/div>\s*<div id="home-goal"/;
if (gridRegex.test(html)) {
  html = html.replace(gridRegex, newMembersGridHtml + '\n</div> <div id="home-goal"');
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('Successfully updated index.html with compact member cards and 5th card!');
} else {
  console.error('Failed to find members-grid in index.html');
}
