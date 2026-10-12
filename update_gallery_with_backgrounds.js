import fs from 'node:fs';

const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\2e80ee98-e28f-4bf0-bf90-c8e381874417';

function getB64(filename) {
  const buf = fs.readFileSync(filename);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const b64PureWhite = getB64('bg_test_pure_white.png');
const b64WarmOffwhite = getB64('bg_test_warm_offwhite.png');
const b64CoolStudio = getB64('bg_test_cool_studio.png');
const b64SoftPastel = getB64('bg_test_soft_pastel.png');

const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-2">
  <div class="bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-xl p-3 shadow-sm max-w-xl mx-auto">
    <div class="flex items-center justify-between mb-2">
      <div>
        <h2 class="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
          <span>🎨</span> 3D文字 × 背景カラー検証ギャラリー
        </h2>
        <p class="text-xs text-[var(--muted-foreground)]">タブをクリックして背景色の比較ができます</p>
      </div>
      <span class="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium border border-blue-500/20">提案プレビュー</span>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1.5 mb-2.5 overflow-x-auto pb-1 text-xs">
      <button onclick="switchTab('white')" id="btn-white" class="tab-btn px-2.5 py-1 rounded-md font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs transition-all">
        ⚪ 純白 (Pure White)
      </button>
      <button onclick="switchTab('warm')" id="btn-warm" class="tab-btn px-2.5 py-1 rounded-md font-medium bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-all">
        🏷️ 生成り (Warm Cream)
      </button>
      <button onclick="switchTab('cool')" id="btn-cool" class="tab-btn px-2.5 py-1 rounded-md font-medium bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-all">
        📸 スタジオグレー (Cool Studio)
      </button>
      <button onclick="switchTab('pastel')" id="btn-pastel" class="tab-btn px-2.5 py-1 rounded-md font-medium bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-all">
        🌸 パステル (Soft Pastel)
      </button>
    </div>

    <!-- Image Display -->
    <div class="relative rounded-lg overflow-hidden border border-[var(--border)] bg-slate-100 aspect-[16/10]">
      <img id="main-img" src="${b64PureWhite}" alt="Background Test Rendering" class="w-full h-full object-cover transition-opacity duration-200">
      <div id="img-caption" class="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded bg-black/75 backdrop-blur-md text-[11px] text-white/90 flex justify-between items-center">
        <span><b>ご指定: 純白 (#ffffff)</b> — 最も明るく、文字色のコントラストが最大</span>
        <span class="text-white/60">実機テスト済</span>
      </div>
    </div>
  </div>

  <script>
    const images = {
      white: {
        src: "${b64PureWhite}",
        caption: "<b>ご指定: 純白 (#ffffff)</b> — 最も明るく、カラフルな文字色が最もクリアに際立ちます。"
      },
      warm: {
        src: "${b64WarmOffwhite}",
        caption: "<b>おすすめ①: 生成り・オフホワイト (#f5f2eb)</b> — 眩しさを抑えた高級デザイン誌のような上品なトーン。"
      },
      cool: {
        src: "${b64CoolStudio}",
        caption: "<b>おすすめ②: クールスタジオグレー (#e5e9f0)</b> — Appleの撮影スタジオ風。中央から外側への微細な陰影で立体感が強調。"
      },
      pastel: {
        src: "${b64SoftPastel}",
        caption: "<b>おすすめ③: ソフトラベンダー (#f3e8ff)</b> — ポップな3Dトイブロックの世界観を引き立てる華やかな淡色。"
      }
    };

    function switchTab(key) {
      const img = document.getElementById('main-img');
      const caption = document.getElementById('img-caption');
      
      img.style.opacity = '0.3';
      setTimeout(() => {
        img.src = images[key].src;
        caption.innerHTML = '<span>' + images[key].caption + '</span><span class=\"text-white/60\">実機テスト済</span>';
        img.style.opacity = '1';
      }, 100);

      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = 'tab-btn px-2.5 py-1 rounded-md font-medium bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-all';
      });
      const activeBtn = document.getElementById('btn-' + key);
      activeBtn.className = 'tab-btn px-2.5 py-1 rounded-md font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs transition-all';
    }
  </script>
</body>
</html>`;

fs.writeFileSync(`${artifactDir}\\renderings_gallery.html`, htmlContent, 'utf8');
console.log('Updated renderings_gallery.html with background variations!');
