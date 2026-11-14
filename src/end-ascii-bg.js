/**
 * End Section ASCII Noise & Word Bitmap Background
 * Ported from play.core / program.js (value noise + 3-letter split-flap texture
 * + checkerboard glyph ramps + pointer activity color palette),
 * rendered onto a single high-performance Canvas for 60fps mobile & desktop harmony.
 */

const GLYPH_W = 8;
const GLYPH_H = 11;
const WORD_LEN = 3;
const CHARSET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const glyphs = {};
function buildGlyphs() {
  const cv = document.createElement("canvas");
  cv.width = GLYPH_W;
  cv.height = GLYPH_H;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  cx.font = `700 ${GLYPH_H}px "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace`;
  cx.textBaseline = "top";
  for (const ch of CHARSET) {
    cx.clearRect(0, 0, GLYPH_W, GLYPH_H);
    if (ch !== " ") cx.fillText(ch, 0, 0);
    const d = cx.getImageData(0, 0, GLYPH_W, GLYPH_H).data;
    const bits = new Float32Array(GLYPH_W * GLYPH_H);
    for (let i = 0; i < bits.length; i++) {
      bits[i] = d[i * 4 + 3] > 90 ? 1 : 0;
    }
    glyphs[ch] = bits;
  }
}

const TEX_W = GLYPH_W * WORD_LEN;
const TEX_H = GLYPH_H;
const texture = new Float32Array(TEX_W * TEX_H);

function stampWord(word) {
  texture.fill(0);
  for (let i = 0; i < WORD_LEN; i++) {
    const g = glyphs[word[i]] || glyphs[" "];
    for (let y = 0; y < GLYPH_H; y++) {
      for (let x = 0; x < GLYPH_W; x++) {
        texture[x + i * GLYPH_W + y * TEX_W] = g[x + y * GLYPH_W];
      }
    }
  }
}

function texGet(x, y) {
  return x < 0 || y < 0 || x >= TEX_W || y >= TEX_H
    ? 0
    : texture[x + y * TEX_W];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}

function texSample(u, v) {
  const fx = u * TEX_W - 0.5;
  const fy = v * TEX_H - 0.5;
  const ax = Math.floor(fx);
  const ay = Math.floor(fy);
  const tx = fx - ax;
  const ty = fy - ay;
  const top = lerp(texGet(ax, ay), texGet(ax + 1, ay), tx);
  const bot = lerp(texGet(ax, ay + 1), texGet(ax + 1, ay + 1), tx);
  return lerp(top, bot, ty);
}

// Value noise (permutation table)
const PERM = new Uint8Array(512);
const GRAD = new Float32Array(256);
{
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
  for (let i = 0; i < 256; i++) GRAD[i] = Math.random();
}

function smoother(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function noise2(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const X = ((xi % 256) + 256) % 256;
  const Y = ((yi % 256) + 256) % 256;
  const X1 = (X + 1) & 255;
  const Y1 = (Y + 1) & 255;
  const v00 = GRAD[PERM[PERM[X] + Y]];
  const v10 = GRAD[PERM[PERM[X1] + Y]];
  const v01 = GRAD[PERM[PERM[X] + Y1]];
  const v11 = GRAD[PERM[PERM[X1] + Y1]];
  const u = smoother(xf);
  const v = smoother(yf);
  return lerp(lerp(v00, v10, u), lerp(v01, v11, u), v);
}

function hexRGB(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function lerpRGB(c1, c2, t) {
  const r = Math.round(lerp(c1[0], c2[0], t));
  const g = Math.round(lerp(c1[1], c2[1], t));
  const b = Math.round(lerp(c1[2], c2[2], t));
  return `rgb(${r},${g},${b})`;
}

// AIueo-harmonized cyber palette on pure black (#000000)
const BASE_LO = hexRGB("#1e293b"); // Slate subtle
const BASE_HI = hexRGB("#64748b"); // Cool silver-slate
const PALETTE = [
  "#00f0ff", // Cyan
  "#3b82f6", // Electric blue
  "#8b5cf6", // Neon violet
  "#06b6d4", // Teal
  "#38bdf8", // Sky
  "#e2e8f0", // Crisp white-slate
].map(hexRGB);

const RAMP_A = " .·•-+=:;*░▒▓ABC0123!".split("");
const RAMP_B = " ·-•~+:*░▒XYZaiu".split("");

const WORDS = [
  "AIU",
  "UEO",
  "LAB",
  "ART",
  "DEV",
  "RUN",
  "TRY",
  "NEW",
  "FUN",
  "MIX",
  "BOT",
  "NET",
];

class EndAsciiBackground {
  constructor(section, canvas) {
    this.section = section;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.isVisible = false;
    this.rafId = null;
    this.frame = 0;
    this.startTime = performance.now();

    this.cols = 0;
    this.rows = 0;
    this.cellW = 11;
    this.cellH = 18;
    this.cells = [];
    this.scale = 1.0;

    this.wordIdx = 0;
    this.curLetter = [0, 0, 0];
    this.targetLetter = [0, 0, 0];
    this.letterWait = [0, 0, 0];

    this.cursor = { x: -999, y: -999, px: -999, py: -999 };
    this.radiusSq = 0;
    this.activity = 0.25;
    this.palA = PALETTE[0];
    this.palB = PALETTE[1];
  }

  init() {
    buildGlyphs();
    stampWord("AIU");
    this.resize();

    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(this.section);
    } else {
      window.addEventListener("resize", () => this.resize());
    }

    const onMove = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      this.cursor.x = (clientX - rect.left) / this.cellW;
      this.cursor.y = (clientY - rect.top) / this.cellH;
    };

    window.addEventListener(
      "pointermove",
      (e) => {
        if (this.isVisible) onMove(e.clientX, e.clientY);
      },
      { passive: true }
    );
    window.addEventListener(
      "touchmove",
      (e) => {
        if (this.isVisible && e.touches && e.touches[0]) {
          onMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            this.isVisible = entry.isIntersecting;
            if (this.isVisible) {
              this.startLoop();
            } else {
              this.stopLoop();
            }
          }
        },
        { threshold: 0.01 }
      );
      io.observe(this.section);
    } else {
      this.isVisible = true;
      this.startLoop();
    }
  }

  resize() {
    const rect = this.section.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width || window.innerWidth));
    const h = Math.max(320, Math.floor(rect.height || window.innerHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Responsive grid cell size
    this.cellW = w < 640 ? 10 : 12;
    this.cellH = w < 640 ? 16 : 19;
    this.cols = Math.ceil(w / this.cellW);
    this.rows = Math.ceil(h / this.cellH);
    this.viewW = w;
    this.viewH = h;

    const total = this.cols * this.rows;
    this.cells = new Array(total);
    for (let i = 0; i < total; i++) {
      this.cells[i] = { src: 0, v: 0 };
    }
  }

  updateWord() {
    if (this.frame % 240 === 0) {
      const w = WORDS[this.wordIdx % WORDS.length];
      this.wordIdx++;
      for (let i = 0; i < WORD_LEN; i++) {
        const idx = CHARSET.indexOf(w[i]);
        this.targetLetter[i] = idx >= 0 ? idx : 0;
        this.letterWait[i] = 5 * i;
      }
    }
    if (this.frame % 2 === 1) {
      for (let i = 0; i < WORD_LEN; i++) {
        if (this.letterWait[i] > 0) this.letterWait[i]--;
        else if (this.curLetter[i] !== this.targetLetter[i]) {
          this.curLetter[i] = (this.curLetter[i] + 1) % CHARSET.length;
        }
      }
      stampWord(this.curLetter.map((n) => CHARSET[n]).join(""));
    }
  }

  startLoop() {
    if (this.rafId !== null) return;
    const tick = (now) => {
      if (!this.isVisible) {
        this.rafId = null;
        return;
      }
      this.render(now);
      this.frame++;
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  stopLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  render(now) {
    const { cols, rows, cellW, cellH, ctx, viewW, viewH } = this;
    if (!cols || !rows) return;

    this.updateWord();

    // Pointer dynamics
    const dxp = this.cursor.x - this.cursor.px;
    const dyp = this.cursor.y - this.cursor.py;
    const speed =
      this.cursor.px < -100 || this.cursor.x < -100 ? 0 : Math.hypot(dxp, dyp);
    this.cursor.px = this.cursor.x;
    this.cursor.py = this.cursor.y;

    this.radiusSq = Math.min(this.radiusSq * 0.78 + 0.55 * speed, 32);
    if (speed > 0.15) {
      this.activity = Math.min(this.activity + 0.015, 1);
    }
    if (this.activity < 0.25) {
      this.palA = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      do {
        this.palB = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      } while (this.palB === this.palA);
    }

    const t0 = clamp((this.activity - 0.2) / 0.65, 0, 1);
    const fMix = smoother(t0);
    const colorHi = lerpRGB(BASE_HI, this.palA, fMix);
    const colorLo = lerpRGB(BASE_LO, this.palB, fMix);
    this.activity = Math.max(this.activity - 0.004, 0.15);

    const targetScale = cols < 70 ? 1.2 : 0.85;
    this.scale += 0.02 * (targetScale - this.scale);
    const aspect = cellW / cellH;
    const texAspect = TEX_W / TEX_H / aspect;
    let l, u;
    if (texAspect < cols / rows) {
      l = 1 / rows / texAspect / this.scale;
      u = 1 / rows / this.scale;
    } else {
      l = 1 / cols / this.scale;
      u = (1 / cols) * texAspect / this.scale;
    }

    const elapsed = now - this.startTime;
    const f = 0.00045 * elapsed;
    const s = 1.2 + ((Math.cos(f) + 1) / 2) * (0.5 - 1.2);

    ctx.clearRect(0, 0, viewW, viewH);
    ctx.font = `600 ${Math.floor(cellH * 0.72)}px "IBM Plex Mono", ui-monospace, Menlo, Consolas, monospace`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    for (let y = 0; y < rows; y++) {
      const py = y * cellH + cellH * 0.5;
      for (let x = 0; x < cols; x++) {
        const c = l * (x - 0.5 * cols) + 0.5;
        const h = u * (y - 0.5 * rows) + 0.5;
        const d = c + 0.5 * (noise2(c * s + f, h * s) - 0.5);
        const p = h + 1.8 * (noise2(c * s, h * s + f) - 0.5);

        const idx = x + y * cols;
        const cell = this.cells[idx];
        const sampled = Math.max(
          texSample(d, p),
          texGet(Math.floor(d * TEX_W), Math.floor(p * TEX_H))
        );

        // Ambient wave + cursor ripple excitation
        const dx = (x - this.cursor.x) * aspect;
        const dy = y - this.cursor.y;
        const distSq = dx * dx + dy * dy;
        let energy = Math.max(sampled, cell.v);
        if (distSq < this.radiusSq) {
          energy = Math.max(energy, 0.99);
        }
        cell.v = 0.94 * energy;

        // Subtle ambient noise floor so the entire black space feels alive with ASCII
        const ambient = noise2(x * 0.14 + f * 2.2, y * 0.14 - f * 1.6) * 0.42;
        const val = clamp(Math.max(energy, ambient), 0, 1);

        if (val < 0.06) continue;

        const ramp = (x + y) % 2 === 0 ? RAMP_B : RAMP_A;
        const ch = ramp[Math.floor(val * (ramp.length - 1))];
        if (ch === " ") continue;

        ctx.fillStyle = val >= 0.78 ? colorHi : colorLo;
        ctx.globalAlpha = val >= 0.78 ? 0.85 : 0.42 + val * 0.4;
        ctx.fillText(ch, x * cellW + cellW * 0.5, py);
      }
    }

    // Soft radial vignette in the center to keep foreground "Join / Propose" typography razor-sharp
    ctx.globalAlpha = 1;
    const grad = ctx.createRadialGradient(
      viewW * 0.5,
      viewH * 0.46,
      Math.min(viewW, viewH) * 0.08,
      viewW * 0.5,
      viewH * 0.46,
      Math.max(viewW, viewH) * 0.52
    );
    grad.addColorStop(0, "rgba(0, 0, 0, 0.72)");
    grad.addColorStop(0.55, "rgba(0, 0, 0, 0.35)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, viewW, viewH);
  }
}

function bootEndAscii() {
  const section = document.getElementById("end-section");
  const canvas = document.getElementById("end-ascii-bg");
  if (!section || !canvas) return;
  const bg = new EndAsciiBackground(section, canvas);
  bg.init();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootEndAscii);
} else {
  bootEndAscii();
}
