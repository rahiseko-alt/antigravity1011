const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const tests = [];

function assert(condition, message) {
  tests.push({ passed: !!condition, message });
  if (!condition) {
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

// 1. #home-featured-title
assert(
  html.includes('<h4 id="home-featured-title">Active Initiatives & Players</h4>'),
  '#home-featured-title matches'
);

// 2. #home-featured-disclaimer
assert(
  html.includes('<div id="home-featured-disclaimer">「こういうのやります」進行中の企画と、一緒に動く草AI同盟のプレイヤーたち。誰かの企画に乗っかるもよし、自分の「やりたい」を立ち上げるもよし。</div>'),
  '#home-featured-disclaimer matches'
);

// 3. Project cards
const pListMatch = html.match(/<div class="project-list">(.*?)<\/div>\s*<a id="home-featured-cta"/s);
assert(!!pListMatch, '.project-list found');

if (pListMatch) {
  const cards = [...pListMatch[1].matchAll(/<a class="project-item[^"]*"[^>]*>.*?<\/a>/gs)].map(m => m[0]);
  assert(cards.length === 10, `Found exactly 10 project cards (found ${cards.length})`);

  const expectedCards = [
    { title: 'AI小技 発表会', line1: '11/11 20:00 • リモート開催 • 視聴申込不要 • 金銭なし' },
    { title: 'AIアート展覧会を重要文化財で開催する', line1: '2027年1月頃 • 名古屋市市政資料館 • メンバー割り勘' },
    { title: '小齊平 恒平', line1: '代表 / AI活動家 • play with AI • 専門学校講師' },
    { title: '伊藤 良二', line1: 'プロデューサー • Craft Line Works代表 • 業務効率化' },
    { title: '堺 彬', line1: '株式会社SakAI Nexus 代表取締役 • AI導入支援 • 開発' },
    { title: 'SNS運用の自動化', line1: '#AI #DEVELOPMENT • 生成から分析までワンストップ' },
    { title: '自社特化型 AIチャットボット', line1: '#AI #LLM • 定型の問い合わせを自動処理' },
    { title: '音声カルテ作成アプリ', line1: '#AI #PROTOTYPE • ペット業界向け' },
    { title: '書類業務の半自動化アプリ', line1: '#AI #LOCAL • 飲食業向け' },
    { title: '岡本 ジュンイチ', line1: '顧問 / SNSマーケター • メディアプロデューサー' }
  ];

  expectedCards.forEach((exp, idx) => {
    if (cards[idx]) {
      const hasTitle = cards[idx].includes(exp.title);
      const hasLine1 = cards[idx].includes(exp.line1);
      assert(hasTitle && hasLine1, `Card ${idx + 1}: contains "${exp.title}" and line1 details`);
    } else {
      assert(false, `Card ${idx + 1} missing`);
    }
  });
}

// 4. #home-featured-cta
assert(
  html.includes('<span id="home-featured-cta-text">企画を提案する / 参加する →</span>'),
  '#home-featured-cta-text matches'
);

// 5. #home-goal-title
assert(
  html.includes('<div id="home-goal-title">運営のかかわり方・スタンス（Operating Guidelines）</div>'),
  '#home-goal-title matches'
);

// 6. #home-goal-texts
assert(
  html.includes('<div class="home-goal-texts-paragraph">AIueoは、やりたいことを持つ人と参加したい人が出会う「呼びかけの場」です。企画・参加・金銭の当事者ではありません。主催者と参加者が、それぞれの責任で自由に行動し、場を乱さず楽しむことを基本とします。</div>'),
  '#home-goal-texts paragraph 1 matches'
);
assert(
  html.includes('<div class="home-goal-texts-paragraph">参加だけなら会員登録は一切不要。企画を立てる人だけが会員登録（Googleログイン）を行います。利用料・会費・参加費などの金銭は預かりません。分からない場合は、すべて割り勘から始めることを推奨しています。</div>'),
  '#home-goal-texts paragraph 2 matches'
);

// 7. Tunnel lines
assert(
  html.includes('<div class="home-goal-tunnel-title-line">場をつくる。</div>') &&
  html.includes('<div class="home-goal-tunnel-title-line">場を乱さない。</div>') &&
  html.includes('<div class="home-goal-tunnel-title-line">まずは1つの草活動から。</div>'),
  '#home-goal-tunnel-title 3 lines match'
);

// 8. #end-section
assert(
  html.includes('<div id="end-section-subtitle-text">「こういうのやるんですけど、一緒にどうですか？」</div>'),
  '#end-section-subtitle-text matches'
);
assert(
  html.includes('<div id="end-section-title-link">Join / Propose <br> 企画を持ち込む・参加する</div>'),
  '#end-section-title-link matches'
);

// 9. #footer-section
assert(
  html.includes('<div class="footer-address-line">AI League AIueo</div>') &&
  html.includes('<div class="footer-address-line">Tokyo, Japan & Online</div>') &&
  html.includes('<div class="footer-address-line">草AI同盟（草野球のように集まりAIを遊ぶ）</div>') &&
  html.includes('<div class="footer-address-line">info@kouheikosehira.com</div>'),
  'footer address matches'
);

assert(
  html.includes('https://github.com/rahiseko-alt/AIueo-LP') &&
  html.includes('https://github.com/rahiseko-alt') &&
  html.includes('https://twitter.com/kosehirakouhei'),
  'footer socials match'
);

assert(
  html.includes('<a id="footer-enquires-link" href="mailto:info@kouheikosehira.com">info@kouheikosehira.com</a>') &&
  html.includes('<a id="footer-business-link" href="mailto:info@kouheikosehira.com">info@kouheikosehira.com</a>'),
  'footer enquires and business emails match'
);

assert(
  html.includes('<span class="footer-newsletter-line">AIueoの最新企画通知</span>') &&
  html.includes('<span class="footer-newsletter-line">を受け取る</span>'),
  'footer newsletter lines match'
);

assert(
  html.includes('<div id="footer-bottom-copyright">© 2026 AI League AIueo. Activities & Experiment First.</div>'),
  'footer copyright matches'
);

assert(
  html.includes('<div id="footer-bottom-tagline">Grassroots AI Alliance with ❤️</div>'),
  'footer tagline matches'
);

const allPassed = tests.every(t => t.passed);
console.log(`\nVerification finished: ${tests.filter(t => t.passed).length} / ${tests.length} passed.`);
if (!allPassed) {
  process.exit(1);
}
