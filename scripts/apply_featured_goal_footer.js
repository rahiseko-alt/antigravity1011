const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. #home-featured-title and disclaimer
const oldFeaturedTitleTop = '<div id="home-featured-title-top"> <div id="home-featured-title-wrapper"> <h4 id="home-featured-title">Featured Work</h4> </div> <div id="home-featured-disclaimer">A selection of immersive digital experiences created for ambitious brands and forward thinking teams.</div> </div>';
const newFeaturedTitleTop = '<div id="home-featured-title-top"> <div id="home-featured-title-wrapper"> <h4 id="home-featured-title">Active Initiatives & Players</h4> </div> <div id="home-featured-disclaimer">「こういうのやります」進行中の企画と、一緒に動く草AI同盟のプレイヤーたち。誰かの企画に乗っかるもよし、自分の「やりたい」を立ち上げるもよし。</div> </div>';

if (!html.includes(oldFeaturedTitleTop)) {
  throw new Error('Cannot find oldFeaturedTitleTop');
}
html = html.replace(oldFeaturedTitleTop, newFeaturedTitleTop);

// 2. The 10 project cards in .project-list
const oldProjectListStart = '<div class="project-list">';
const oldProjectListEnd = '</div> <a id="home-featured-cta"';

const pStart = html.indexOf(oldProjectListStart);
const pEnd = html.indexOf(oldProjectListEnd);

if (pStart === -1 || pEnd === -1) {
  throw new Error('Cannot find .project-list boundaries');
}

const newCardsHtml = [
  // Card 1: [Event] AI小技 発表会
  `<a class="project-item project-type-website" href="/projects/oryzo_ai" data-id="oryzo_ai" data-color-bg="#1a1411" data-color-text="#ffedd7" data-color-shadow="0.9"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1">11/11 20:00 • リモート開催 • 視聴申込不要 • 金銭なし</div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">AI小技 発表会</div> </div> </div> </a>`,

  // Card 2: [Event] AIアート展覧会を重要文化財で開催する
  `<a class="project-item project-type-website" href="/projects/atlas_motion" data-id="atlas_motion" data-color-bg="#181818" data-color-text="#FFFDE0" data-color-shadow="0.95"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1">2027年1月頃 • 名古屋市市政資料館 • メンバー割り勘</div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">AIアート展覧会を重要文化財で開催する</div> </div> </div> </a>`,

  // Card 3: [Member] 小齊平 恒平
  `<a class="project-item project-type-website" href="/projects/devin_ai" data-id="devin_ai" data-color-bg="#121414" data-color-text="#ffffff" data-color-shadow="0.9"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1">代表 / AI活動家 • play with AI • 専門学校講師</div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">小齊平 恒平</div> </div> </div> </a>`,

  // Card 4: [Member] 伊藤 良二
  `<a class="project-item project-type-website" href="/projects/of_the_oak" data-id="of_the_oak" data-color-bg="#111a13" data-color-text="#d9f3de" data-color-shadow="0.9"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1">プロデューサー • Craft Line Works代表 • 業務効率化</div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">伊藤 良二</div> </div> </div> </a>`,

  // Card 5: [Member] 堺 彬
  `<a class="project-item project-type-website" href="/projects/everswap" data-id="everswap" data-color-bg="#E3E3F8" data-color-text="#000" data-color-shadow="0.95"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1">株式会社SakAI Nexus 代表取締役 • AI導入支援 • 開発</div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">堺 彬</div> </div> </div> </a>`,

  // Card 6: [Activity] SNS運用の自動化
  `<a class="project-item project-type-website" href="/projects/porsche_dream_machine" data-id="porsche_dream_machine" data-color-bg="#EFD5D3" data-color-text="#000000" data-color-shadow="0.95"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1">#AI #DEVELOPMENT • 生成から分析までワンストップ</div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">SNS運用の自動化</div> </div> </div> </a>`,

  // Card 7: [Activity] 自社特化型 AIチャットボット
  `<a class="project-item project-type-website" href="/projects/synthetic_human" data-id="synthetic_human" data-color-bg="#9d8aff" data-color-text="#ffffff" data-color-shadow="0.95"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1">#AI #LLM • 定型の問い合わせを自動処理</div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">自社特化型 AIチャットボット</div> </div> </div> </a>`,

  // Card 8: [Activity] 音声カルテ作成アプリ
  `<a class="project-item project-type-website" href="/projects/spatial_fusion" data-id="spatial_fusion" data-color-bg="#D6C8ED" data-color-text="#000000" data-color-shadow="0.95"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1">#AI #PROTOTYPE • ペット業界向け</div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">音声カルテ作成アプリ</div> </div> </div> </a>`,

  // Card 9: [Activity] 書類業務の半自動化アプリ
  `<a class="project-item project-type-website" href="/projects/spaace" data-id="spaace" data-color-bg="#010a16" data-color-text="#ffece2" data-color-shadow="0.85"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1">#AI #LOCAL • 飲食業向け</div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">書類業務の半自動化アプリ</div> </div> </div> </a>`,

  // Card 10: [Member] 岡本 ジュンイチ
  `<a class="project-item project-type-website" href="/projects/ddd_2024" data-id="ddd_2024" data-color-bg="#261c46" data-color-text="#ffffff" data-color-shadow="0.95"> <div class="project-item-main"> <div class="project-item-image"></div> </div> <div class="project-item-footer"> <div class="project-item-line-1">顧問 / SNSマーケター • メディアプロデューサー</div> <div class="project-item-line-2"> <div class="project-item-line-2-icon"></div> <div class="project-item-line-2-inner">岡本 ジュンイチ</div> </div> </div> </a>`
].join('');

html = html.substring(0, pStart + oldProjectListStart.length) + ' ' + newCardsHtml + ' ' + html.substring(pEnd);

// 3. #home-featured-cta
const oldFeaturedCta = `<a id="home-featured-cta" href="/projects" target="_blank"> <span id="home-featured-cta-dot"></span> <span id="home-featured-cta-text">See all projects</span> <span id="home-featured-cta-arrow"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.343 8h11.314m0 0L8.673 3.016M13.657 8l-4.984 4.984"></path></svg> </span> </a>`;
const newFeaturedCta = `<a id="home-featured-cta" href="mailto:info@kouheikosehira.com" target="_blank"> <span id="home-featured-cta-dot"></span> <span id="home-featured-cta-text">企画を提案する / 参加する →</span> <span id="home-featured-cta-arrow"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.343 8h11.314m0 0L8.673 3.016M13.657 8l-4.984 4.984"></path></svg> </span> </a>`;

if (!html.includes(oldFeaturedCta)) {
  throw new Error('Cannot find oldFeaturedCta');
}
html = html.replace(oldFeaturedCta, newFeaturedCta);

// 4. #home-goal section
const oldGoalContext = `<div id="home-goal-title">Where Creative Ideas Become Immersive Experiences</div> <div id="home-goal-texts"> <div class="home-goal-texts-paragraph">We do not chase trends or produce work that looks like everyone else. We focus on creating visually distinctive digital experiences that reflect your brand, engage your audience, and make people remember what they saw.</div> <div class="home-goal-texts-paragraph">Our process blends creative direction, 3D craft, and interactive development to build tailored digital journeys that feel original, polished, and built for impact.</div> </div>`;
const newGoalContext = `<div id="home-goal-title">運営のかかわり方・スタンス（Operating Guidelines）</div> <div id="home-goal-texts"> <div class="home-goal-texts-paragraph">AIueoは、やりたいことを持つ人と参加したい人が出会う「呼びかけの場」です。企画・参加・金銭の当事者ではありません。主催者と参加者が、それぞれの責任で自由に行動し、場を乱さず楽しむことを基本とします。</div> <div class="home-goal-texts-paragraph">参加だけなら会員登録は一切不要。企画を立てる人だけが会員登録（Googleログイン）を行います。利用料・会費・参加費などの金銭は預かりません。分からない場合は、すべて割り勘から始めることを推奨しています。</div> </div>`;

if (!html.includes(oldGoalContext)) {
  throw new Error('Cannot find oldGoalContext');
}
html = html.replace(oldGoalContext, newGoalContext);

// 3D Tunnel in-text lines
const oldTunnelTitle = `<div id="home-goal-tunnel-title"> <div class="home-goal-tunnel-title-line">Step into a new world</div> <div class="home-goal-tunnel-title-line">and let your</div> <div class="home-goal-tunnel-title-line">imagination run wild</div> </div>`;
const newTunnelTitle = `<div id="home-goal-tunnel-title"> <div class="home-goal-tunnel-title-line">場をつくる。</div> <div class="home-goal-tunnel-title-line">場を乱さない。</div> <div class="home-goal-tunnel-title-line">まずは1つの草活動から。</div> </div>`;

if (!html.includes(oldTunnelTitle)) {
  throw new Error('Cannot find oldTunnelTitle');
}
html = html.replace(oldTunnelTitle, newTunnelTitle);

// 5. #end-section
const oldEndSubtitle = `<div id="end-section-subtitle-text">Is Your Big Idea Ready to Go Wild?</div>`;
const newEndSubtitle = `<div id="end-section-subtitle-text">「こういうのやるんですけど、一緒にどうですか？」</div>`;

if (!html.includes(oldEndSubtitle)) {
  throw new Error('Cannot find oldEndSubtitle');
}
html = html.replace(oldEndSubtitle, newEndSubtitle);

const oldEndTitleLink = `<div id="end-section-title-link">Let's work <br> together!</div>`;
const newEndTitleLink = `<div id="end-section-title-link">Join / Propose <br> 企画を持ち込む・参加する</div>`;

if (!html.includes(oldEndTitleLink)) {
  throw new Error('Cannot find oldEndTitleLink');
}
html = html.replace(oldEndTitleLink, newEndTitleLink);

// 6. #footer-section
// Address
const oldFooterAddress = `<a id="footer-contact-address" href="https://goo.gl/maps/x9evc1NxZocjrM947" target="_blank"> <div class="footer-address-line">Suite 2</div> <div class="footer-address-line">9 Marsh Street</div> <div class="footer-address-line">Bristol, BS1 4AA</div> <div class="footer-address-line">United Kingdom</div> </a>`;
const newFooterAddress = `<a id="footer-contact-address" href="mailto:info@kouheikosehira.com" target="_blank"> <div class="footer-address-line">AI League AIueo</div> <div class="footer-address-line">Tokyo, Japan & Online</div> <div class="footer-address-line">草AI同盟（草野球のように集まりAIを遊ぶ）</div> <div class="footer-address-line">info@kouheikosehira.com</div> </a>`;

if (!html.includes(oldFooterAddress)) {
  throw new Error('Cannot find oldFooterAddress');
}
html = html.replace(oldFooterAddress, newFooterAddress);

// Socials
const oldFooterSocials = `<div id="footer-contact-socials"> <a class="footer-socials-line" href="https://twitter.com/lusionltd/" target="_blank"> <svg class="footer-socials-line-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#000" fill-rule="evenodd" d="M6.948 18.113a.75.75 0 0 1-1.06-1.06l9.885-9.886H8.65a.75.75 0 1 1 0-1.5h9.682v9.682a.75.75 0 0 1-1.5 0v-7.12l-9.884 9.884Z" clip-rule="evenodd"></path></svg> <span class="footer-socials-text">Twitter / X</span> </a> <a class="footer-socials-line" href="https://www.instagram.com/lusionltd/" target="_blank"> <svg class="footer-socials-line-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#000" fill-rule="evenodd" d="M6.948 18.113a.75.75 0 0 1-1.06-1.06l9.885-9.886H8.65a.75.75 0 1 1 0-1.5h9.682v9.682a.75.75 0 0 1-1.5 0v-7.12l-9.884 9.884Z" clip-rule="evenodd"></path></svg> <span class="footer-socials-text">Instagram</span> </a> <a class="footer-socials-line" href="https://www.linkedin.com/company/lusionltd/" target="_blank"> <svg class="footer-socials-line-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#000" fill-rule="evenodd" d="M6.948 18.113a.75.75 0 0 1-1.06-1.06l9.885-9.886H8.65a.75.75 0 1 1 0-1.5h9.682v9.682a.75.75 0 0 1-1.5 0v-7.12l-9.884 9.884Z" clip-rule="evenodd"></path></svg> <span class="footer-socials-text">Linkedin</span> </a> </div>`;
const newFooterSocials = `<div id="footer-contact-socials"> <a class="footer-socials-line" href="https://github.com/rahiseko-alt/AIueo-LP" target="_blank"> <svg class="footer-socials-line-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#000" fill-rule="evenodd" d="M6.948 18.113a.75.75 0 0 1-1.06-1.06l9.885-9.886H8.65a.75.75 0 1 1 0-1.5h9.682v9.682a.75.75 0 0 1-1.5 0v-7.12l-9.884 9.884Z" clip-rule="evenodd"></path></svg> <span class="footer-socials-text">GitHub (AIueo-LP)</span> </a> <a class="footer-socials-line" href="https://github.com/rahiseko-alt" target="_blank"> <svg class="footer-socials-line-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#000" fill-rule="evenodd" d="M6.948 18.113a.75.75 0 0 1-1.06-1.06l9.885-9.886H8.65a.75.75 0 1 1 0-1.5h9.682v9.682a.75.75 0 0 1-1.5 0v-7.12l-9.884 9.884Z" clip-rule="evenodd"></path></svg> <span class="footer-socials-text">Captain GitHub</span> </a> <a class="footer-socials-line" href="https://twitter.com/kosehirakouhei" target="_blank"> <svg class="footer-socials-line-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#000" fill-rule="evenodd" d="M6.948 18.113a.75.75 0 0 1-1.06-1.06l9.885-9.886H8.65a.75.75 0 1 1 0-1.5h9.682v9.682a.75.75 0 0 1-1.5 0v-7.12l-9.884 9.884Z" clip-rule="evenodd"></path></svg> <span class="footer-socials-text">Twitter / X</span> </a> </div>`;

if (!html.includes(oldFooterSocials)) {
  throw new Error('Cannot find oldFooterSocials');
}
html = html.replace(oldFooterSocials, newFooterSocials);

// Enquiries & Business
const oldFooterEnquires = `<div id="footer-contact-enquires"> <div id="footer-enquires-header">General enquires</div> <a id="footer-enquires-link" href="mailto:hello@lusion.co">hello@lusion.co</a> </div> <div id="footer-contact-business"> <div id="footer-business-header">New business</div> <a id="footer-business-link" href="mailto:business@lusion.co">business@lusion.co</a> </div>`;
const newFooterEnquires = `<div id="footer-contact-enquires"> <div id="footer-enquires-header">General enquires</div> <a id="footer-enquires-link" href="mailto:info@kouheikosehira.com">info@kouheikosehira.com</a> </div> <div id="footer-contact-business"> <div id="footer-business-header">New business</div> <a id="footer-business-link" href="mailto:info@kouheikosehira.com">info@kouheikosehira.com</a> </div>`;

if (!html.includes(oldFooterEnquires)) {
  throw new Error('Cannot find oldFooterEnquires');
}
html = html.replace(oldFooterEnquires, newFooterEnquires);

// Newsletter
const oldFooterNewsletter = `<div id="footer-newsletter-header"> <span class="footer-newsletter-line">Subscribe to</span> <span class="footer-newsletter-line">our newsletter</span> </div>`;
const newFooterNewsletter = `<div id="footer-newsletter-header"> <span class="footer-newsletter-line">AIueoの最新企画通知</span> <span class="footer-newsletter-line">を受け取る</span> </div>`;

if (!html.includes(oldFooterNewsletter)) {
  throw new Error('Cannot find oldFooterNewsletter');
}
html = html.replace(oldFooterNewsletter, newFooterNewsletter);

// Copyright & Tagline & Labs
const oldFooterBottom = `<div id="footer-bottom"> <div id="footer-bottom-copyright">©2026 LUSION Creative Studio</div> <a id="footer-bottom-labs" href="https://labs.lusion.co" target="_blank"> R&D: labs.lusion.co</a> <div id="footer-bottom-tagline">Built by Lusion with ❤️</div>`;
const newFooterBottom = `<div id="footer-bottom"> <div id="footer-bottom-copyright">© 2026 AI League AIueo. Activities & Experiment First.</div> <a id="footer-bottom-labs" href="https://github.com/rahiseko-alt/AIueo-LP" target="_blank"> GitHub: AIueo-LP</a> <div id="footer-bottom-tagline">Grassroots AI Alliance with ❤️</div>`;

if (!html.includes(oldFooterBottom)) {
  throw new Error('Cannot find oldFooterBottom');
}
html = html.replace(oldFooterBottom, newFooterBottom);

fs.writeFileSync('index.html', html, 'utf8');
console.log('SUCCESS: Applied Featured, Goal, End CTA, and Footer content to index.html');
