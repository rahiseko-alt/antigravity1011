import fs from 'fs';

const SVG_ICONS = {
  x: `<svg class="member-sns-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/></svg>`,
  github: `<svg class="member-sns-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
  note: `<svg class="member-sns-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M0 .279c4.623 0 10.953-.235 15.498-.117 6.099.156 8.39 2.813 8.468 9.374.077 3.71 0 14.335 0 14.335h-6.598c0-9.296.04-10.83 0-13.759-.078-2.578-.814-3.807-2.795-4.041-2.097-.235-7.975-.04-7.975-.04v17.84H0Z"/></svg>`,
  web: `<svg class="member-sns-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  mail: `<svg class="member-sns-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  facebook: `<svg class="member-sns-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg>`
};

const newCss = `<style id="compact-members-styles">
/* Photo-Dominant Modern Member Cards */
#page-container #home-members.section {
  background: #080c14 !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  position: relative !important;
  z-index: 10 !important;
  overflow: visible !important;
}

#home-members .members-header-title {
  color: #ffffff !important;
}

#home-members .members-header-desc {
  color: rgba(255, 255, 255, 0.75) !important;
}

.members-grid {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: clamp(18px, 2.2vw, 24px) !important;
  max-width: 1100px !important;
  margin: 0 auto !important;
  align-items: stretch !important;
}

@media (max-width: 820px) {
  .members-grid {
    grid-template-columns: 1fr !important;
    gap: 18px !important;
  }
}

.member-card {
  position: relative !important;
  background: rgba(10, 14, 24, 0.88) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 20px !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.35s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.member-card:hover {
  transform: translateY(-5px) !important;
  border-color: rgba(255, 255, 255, 0.28) !important;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.65) !important;
}

/* Individual Member Accent Variables */
.member-card[data-id="kosehira"] {
  --accent-color: #00f0ff;
  --accent-border: rgba(0, 240, 255, 0.45);
  --accent-glow: rgba(0, 240, 255, 0.35);
}
.member-card[data-id="ito"] {
  --accent-color: #ff007a;
  --accent-border: rgba(255, 0, 122, 0.45);
  --accent-glow: rgba(255, 0, 122, 0.35);
}
.member-card[data-id="sakai"] {
  --accent-color: #00ff88;
  --accent-border: rgba(0, 255, 136, 0.45);
  --accent-glow: rgba(0, 255, 136, 0.35);
}
.member-card[data-id="okamoto"] {
  --accent-color: #ffaa00;
  --accent-border: rgba(255, 170, 0, 0.45);
  --accent-glow: rgba(255, 170, 0, 0.35);
}
.member-card[data-id="yamaki"] {
  --accent-color: #ff2d87;
  --accent-border: rgba(255, 45, 135, 0.45);
  --accent-glow: rgba(255, 45, 135, 0.35);
}

.member-card-inner {
  padding: clamp(16px, 1.8vw, 20px) !important;
  display: flex !important;
  flex-direction: column !important;
  height: 100% !important;
  box-sizing: border-box !important;
  position: relative !important;
  z-index: 2 !important;
}

/* Photo Hero Frame */
.member-photo-frame {
  position: relative !important;
  width: 100% !important;
  height: clamp(210px, 22vw, 260px) !important;
  border-radius: 14px !important;
  overflow: hidden !important;
  background: #050810 !important;
  margin-bottom: 14px !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.member-photo-img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  object-position: center 20% !important;
  display: block !important;
  filter: grayscale(20%) contrast(1.04) !important;
  transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
              filter 0.45s ease !important;
}

.member-card:hover .member-photo-img {
  transform: scale(1.05) !important;
  filter: grayscale(0%) contrast(1.06) !important;
}

.member-photo-overlay {
  position: absolute !important;
  inset: 0 !important;
  background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 45%, rgba(10,14,24,0.75) 100%) !important;
  pointer-events: none !important;
}

.member-photo-badges {
  position: absolute !important;
  top: 12px !important;
  left: 12px !important;
  right: 12px !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  pointer-events: none !important;
  z-index: 3 !important;
}

.member-num-badge {
  font-family: IBMPlexMono, monospace !important;
  font-size: 0.85rem !important;
  font-weight: 800 !important;
  color: #ffffff !important;
  background: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  padding: 3px 9px !important;
  border-radius: 6px !important;
  border: 1px solid rgba(255, 255, 255, 0.16) !important;
}

.member-role-badge {
  font-family: IBMPlexMono, monospace !important;
  font-size: 0.68rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.12em !important;
  color: var(--accent-color) !important;
  background: rgba(0, 0, 0, 0.65) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  padding: 3px 10px !important;
  border-radius: 6px !important;
  border: 1px solid var(--accent-border) !important;
}

/* Card Body */
.member-card-body {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  flex-grow: 1 !important;
}

.member-card-title-row {
  display: flex !important;
  justify-content: space-between !important;
  align-items: baseline !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  margin-bottom: 2px !important;
}

.member-card-name {
  font-family: Aeonik, sans-serif !important;
  font-size: clamp(1.3rem, 1.6vw, 1.65rem) !important;
  font-weight: 700 !important;
  letter-spacing: -0.02em !important;
  color: #ffffff !important;
  margin: 0 !important;
  line-height: 1.2 !important;
}

.member-card-role-title {
  font-size: 0.9rem !important;
  font-weight: 600 !important;
  color: var(--accent-color) !important;
}

.member-card-sub {
  font-size: 0.78rem !important;
  color: rgba(255, 255, 255, 0.5) !important;
  margin-bottom: 6px !important;
}

.member-card-desc {
  font-size: 0.84rem !important;
  line-height: 1.55 !important;
  color: rgba(255, 255, 255, 0.76) !important;
  margin: 0 0 12px 0 !important;
}

/* Bottom Bar: SNS Icon Buttons & Tags */
.member-card-footer {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  flex-wrap: wrap !important;
  gap: 10px !important;
  margin-top: auto !important;
  padding-top: 10px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.member-sns-group {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.sns-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 8px !important;
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  text-decoration: none !important;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              background 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              color 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.sns-btn:hover {
  transform: translateY(-2px) !important;
  background: rgba(255, 255, 255, 0.14) !important;
  border-color: var(--accent-color) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px var(--accent-glow) !important;
}

.sns-btn svg {
  width: 15px !important;
  height: 15px !important;
  display: block !important;
}

.member-card-tags-mini {
  display: flex !important;
  gap: 5px !important;
}

.member-card-tags-mini span {
  font-size: 0.66rem !important;
  font-weight: 500 !important;
  letter-spacing: 0.03em !important;
  color: rgba(255, 255, 255, 0.42) !important;
  padding: 2px 6px !important;
  background: rgba(255, 255, 255, 0.04) !important;
  border-radius: 4px !important;
  border: 1px solid rgba(255, 255, 255, 0.06) !important;
}

/* Glow Backgrounds */
.glow-cyan { background: radial-gradient(circle, #00f0ff 0%, #1a2ffb 70%, transparent 100%) !important; }
.glow-magenta { background: radial-gradient(circle, #ff007a 0%, #8832f7 70%, transparent 100%) !important; }
.glow-emerald { background: radial-gradient(circle, #00ff88 0%, #00f0ff 70%, transparent 100%) !important; }
.glow-amber { background: radial-gradient(circle, #ffaa00 0%, #ff4c41 70%, transparent 100%) !important; }
.glow-rose { background: radial-gradient(circle, #ff2d87 0%, #a01a7d 70%, transparent 100%) !important; }
</style>`;

const newMembersHtml = `<div class="members-grid">
    <!-- Card 01: 小齊平 恒平 -->
    <div class="member-card" data-id="kosehira">
      <div class="member-card-glow glow-cyan"></div>
      <div class="member-card-inner">
        <div class="member-photo-frame">
          <img src="./assets/images/aiueo/member-kosehira.jpg" alt="小齊平 恒平" class="member-photo-img" loading="lazy">
          <div class="member-photo-overlay"></div>
          <div class="member-photo-badges">
            <span class="member-num-badge">01</span>
            <span class="member-role-badge">REPRESENTATIVE</span>
          </div>
        </div>
        <div class="member-card-body">
          <div class="member-card-title-row">
            <h4 class="member-card-name">小齊平 恒平</h4>
            <span class="member-card-role-title">代表 / AI活動家</span>
          </div>
          <div class="member-card-sub">play with AI • 専門学校講師</div>
          <p class="member-card-desc">「今度何かやりましょう」を「こういうのやるので、一緒にどうですか？」に変える。草AI同盟の創設者。理論より実践、対等に実験できる場づくりを牽引。</p>
          <div class="member-card-footer">
            <div class="member-sns-group">
              <a class="sns-btn" href="https://twitter.com/kosehirakouhei" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">${SVG_ICONS.x}</a>
              <a class="sns-btn" href="https://github.com/rahiseko-alt" target="_blank" rel="noopener noreferrer" aria-label="GitHub">${SVG_ICONS.github}</a>
              <a class="sns-btn" href="https://kouheikosehira.com" target="_blank" rel="noopener noreferrer" aria-label="Website">${SVG_ICONS.web}</a>
              <a class="sns-btn" href="mailto:info@kouheikosehira.com" aria-label="Email">${SVG_ICONS.mail}</a>
            </div>
            <div class="member-card-tags-mini">
              <span>#LEADERSHIP</span><span>#COMMUNITY</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 02: 伊藤 良二 -->
    <div class="member-card" data-id="ito">
      <div class="member-card-glow glow-magenta"></div>
      <div class="member-card-inner">
        <div class="member-photo-frame">
          <img src="./assets/images/aiueo/member-ito.jpg" alt="伊藤 良二" class="member-photo-img" loading="lazy">
          <div class="member-photo-overlay"></div>
          <div class="member-photo-badges">
            <span class="member-num-badge">02</span>
            <span class="member-role-badge">PRODUCER</span>
          </div>
        </div>
        <div class="member-card-body">
          <div class="member-card-title-row">
            <h4 class="member-card-name">伊藤 良二</h4>
            <span class="member-card-role-title">プロデューサー</span>
          </div>
          <div class="member-card-sub">Craft Line Works代表 • 業務効率化</div>
          <p class="member-card-desc">ビジネス現場のリアルな課題をAIと仕組みで最短解決する伴走者。企画の立ち上げから持続可能な社会実装までを一気通貫でプロデュース。</p>
          <div class="member-card-footer">
            <div class="member-sns-group">
              <a class="sns-btn" href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">${SVG_ICONS.x}</a>
              <a class="sns-btn" href="https://note.com" target="_blank" rel="noopener noreferrer" aria-label="Note">${SVG_ICONS.note}</a>
              <a class="sns-btn" href="mailto:info@kouheikosehira.com" aria-label="Email">${SVG_ICONS.mail}</a>
            </div>
            <div class="member-card-tags-mini">
              <span>#PRODUCE</span><span>#BUSINESS</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 03: 堺 彬 -->
    <div class="member-card" data-id="sakai">
      <div class="member-card-glow glow-emerald"></div>
      <div class="member-card-inner">
        <div class="member-photo-frame">
          <img src="./assets/images/aiueo/member-sakai.jpg" alt="堺 彬" class="member-photo-img" loading="lazy">
          <div class="member-photo-overlay"></div>
          <div class="member-photo-badges">
            <span class="member-num-badge">03</span>
            <span class="member-role-badge">TECH LEAD</span>
          </div>
        </div>
        <div class="member-card-body">
          <div class="member-card-title-row">
            <h4 class="member-card-name">堺 彬</h4>
            <span class="member-card-role-title">開発 / AI導入支援</span>
          </div>
          <div class="member-card-sub">株式会社SakAI Nexus 代表取締役</div>
          <p class="member-card-desc">先端LLMと最新アーキテクチャで「動くもの」を最速で具現化するエンジニアリングの要。生成AIアプリの高速プロトタイプから企業導入までを推進。</p>
          <div class="member-card-footer">
            <div class="member-sns-group">
              <a class="sns-btn" href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">${SVG_ICONS.github}</a>
              <a class="sns-btn" href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">${SVG_ICONS.x}</a>
              <a class="sns-btn" href="mailto:info@kouheikosehira.com" aria-label="Email">${SVG_ICONS.mail}</a>
            </div>
            <div class="member-card-tags-mini">
              <span>#TECH</span><span>#LLM</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 04: 岡本 ジュンイチ -->
    <div class="member-card" data-id="okamoto">
      <div class="member-card-glow glow-amber"></div>
      <div class="member-card-inner">
        <div class="member-photo-frame">
          <img src="./assets/images/aiueo/member-okamoto.jpg" alt="岡本 ジュンイチ" class="member-photo-img" loading="lazy">
          <div class="member-photo-overlay"></div>
          <div class="member-photo-badges">
            <span class="member-num-badge">04</span>
            <span class="member-role-badge">ADVISOR</span>
          </div>
        </div>
        <div class="member-card-body">
          <div class="member-card-title-row">
            <h4 class="member-card-name">岡本 ジュンイチ</h4>
            <span class="member-card-role-title">顧問 / メディアプロデューサー</span>
          </div>
          <div class="member-card-sub">SNSマーケター • メディア戦略</div>
          <p class="member-card-desc">熱量を最大化し、共感と連鎖を生み出すストーリーテラー。発信力とメディアディレクションで草AI同盟のビジョンを広く社会へ届ける。</p>
          <div class="member-card-footer">
            <div class="member-sns-group">
              <a class="sns-btn" href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">${SVG_ICONS.x}</a>
              <a class="sns-btn" href="https://note.com" target="_blank" rel="noopener noreferrer" aria-label="Note">${SVG_ICONS.note}</a>
              <a class="sns-btn" href="mailto:info@kouheikosehira.com" aria-label="Email">${SVG_ICONS.mail}</a>
            </div>
            <div class="member-card-tags-mini">
              <span>#MEDIA</span><span>#SNS</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Card 05: 八巻 早紀 -->
    <div class="member-card" data-id="yamaki">
      <div class="member-card-glow glow-rose"></div>
      <div class="member-card-inner">
        <div class="member-photo-frame">
          <img src="./assets/images/aiueo/member-yamaki.jpg" alt="八巻 早紀" class="member-photo-img" loading="lazy">
          <div class="member-photo-overlay"></div>
          <div class="member-photo-badges">
            <span class="member-num-badge">05</span>
            <span class="member-role-badge">COMMUNITY</span>
          </div>
        </div>
        <div class="member-card-body">
          <div class="member-card-title-row">
            <h4 class="member-card-name">八巻 早紀</h4>
            <span class="member-card-role-title">AIコミュニティ運営 / 編集者</span>
          </div>
          <div class="member-card-sub">発信・集客導線 • 商品づくり</div>
          <p class="member-card-desc">想いを形にする導線をつくるコミュニティ運営者。発信・集客・商品づくりとAI活用をわかりやすく整理し、最初の一歩に伴走。</p>
          <div class="member-card-footer">
            <div class="member-sns-group">
              <a class="sns-btn" href="https://www.facebook.com/profile.php?id=100029230621734" target="_blank" rel="noopener noreferrer" aria-label="Facebook">${SVG_ICONS.facebook}</a>
              <a class="sns-btn" href="https://note.com" target="_blank" rel="noopener noreferrer" aria-label="Note">${SVG_ICONS.note}</a>
              <a class="sns-btn" href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">${SVG_ICONS.x}</a>
              <a class="sns-btn" href="mailto:info@kouheikosehira.com" aria-label="Email">${SVG_ICONS.mail}</a>
            </div>
            <div class="member-card-tags-mini">
              <span>#COMMUNITY</span><span>#CONTENT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

// Update index.html
let html = fs.readFileSync('index.html', 'utf8');

// Replace style tag
const styleRegex = /<style id="compact-members-styles">[\s\S]*?<\/style>/;
if (styleRegex.test(html)) {
  html = html.replace(styleRegex, newCss.trim());
  console.log('Successfully replaced <style id="compact-members-styles">');
} else {
  console.error('Could not find style tag in index.html');
}

// Replace members-grid
const gridRegex = /<div class="members-grid">[\s\S]*?<\/div>(\s*<\/div>\s*<div id="home-goal")/m;
if (gridRegex.test(html)) {
  html = html.replace(gridRegex, (match, suffix) => {
    return newMembersHtml.trim() + suffix;
  });
  console.log('Successfully replaced members-grid');
} else {
  console.error('Could not find members-grid in index.html');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('Updated index.html successfully!');
