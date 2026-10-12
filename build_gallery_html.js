import fs from 'node:fs';

const artifactDir = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\2e80ee98-e28f-4bf0-bf90-c8e381874417';

function getB64(filename) {
  const buf = fs.readFileSync(filename);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

const b64Alphabet = getB64('test_alphabet_colorful.png');
const b64Sphere = getB64('screenshot_test_sphere.png');
const b64Box = getB64('screenshot_test_box.png');
const b64Torus = getB64('screenshot_test_torus.png');

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
          <span>🎨</span> 3Dテストレンダリング結果
        </h2>
        <p class="text-xs text-[var(--muted-foreground)]">タブをクリックして各形状を切り替え表示できます</p>
      </div>
      <span class="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium border border-emerald-500/20">実機テスト済</span>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1.5 mb-2.5 overflow-x-auto pb-1 text-xs">
      <button onclick="switchTab('alphabet')" id="btn-alphabet" class="tab-btn px-2.5 py-1 rounded-md font-semibold bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xs transition-all">
        ✨ A, I, u, e, o (カラフル)
      </button>
      <button onclick="switchTab('sphere')" id="btn-sphere" class="tab-btn px-2.5 py-1 rounded-md font-medium bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-all">
        ⚪ 球体
      </button>
      <button onclick="switchTab('box')" id="btn-box" class="tab-btn px-2.5 py-1 rounded-md font-medium bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-all">
        ⬛ キューブ
      </button>
      <button onclick="switchTab('torus')" id="btn-torus" class="tab-btn px-2.5 py-1 rounded-md font-medium bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-all">
        🍩 リング
      </button>
    </div>

    <!-- Image Display -->
    <div class="relative rounded-lg overflow-hidden border border-[var(--border)] bg-black/40 aspect-[16/10]">
      <img id="main-img" src="${b64Alphabet}" alt="3D Test Rendering" class="w-full h-full object-cover transition-opacity duration-200">
      <div id="img-caption" class="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded bg-black/75 backdrop-blur-md text-[11px] text-white/90 flex justify-between items-center">
        <span><b>ご要望:</b> カラフルな3Dアルファベット (A, I, u, e, o)</span>
        <span class="text-white/60">60 FPS 物理シミュレーション</span>
      </div>
    </div>
  </div>

  <script>
    const images = {
      alphabet: {
        src: "${b64Alphabet}",
        caption: "<b>ご要望:</b> カラフルな3Dアルファベット (A, I, u, e, o)"
      },
      sphere: {
        src: "${b64Sphere}",
        caption: "<b>球体 (Sphere):</b> 滑らかな光沢と屈折ガラス"
      },
      box: {
        src: "${b64Box}",
        caption: "<b>キューブ (Box):</b> エッジの効いたモダンな回転ブロック"
      },
      torus: {
        src: "${b64Torus}",
        caption: "<b>トーラス (Torus):</b> 中央が抜けた浮遊リング"
      }
    };

    function switchTab(key) {
      const img = document.getElementById('main-img');
      const caption = document.getElementById('img-caption');
      
      img.style.opacity = '0.4';
      setTimeout(() => {
        img.src = images[key].src;
        caption.innerHTML = '<span>' + images[key].caption + '</span><span class=\"text-white/60\">60 FPS 物理シミュレーション</span>';
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
console.log('Successfully created renderings_gallery.html in artifact directory!');
