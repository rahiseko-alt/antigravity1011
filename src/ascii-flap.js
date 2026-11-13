/**
 * ASCII Split-Flap & Pointer Ripple Engine
 * Ported from play.core / program.js ASCII typography mechanics,
 * adapted for zero-reflow, zero-idle-CPU execution alongside WebGL.
 */

// Half-width glyph table (spaces -> punctuation -> shades -> symbols -> alphanumerics)
const GLYPH_TABLE =
  " .,·-•~+:;=*░▒▓█!?&#$@ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");

// Full-width (2-cell) CJK glyph table to prevent horizontal jitter on Japanese text
const CJK_GLYPH_TABLE =
  "　・：；〜ー＋＝＊＃＠アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン".split(
    ""
  );

function isCJK(ch) {
  if (!ch) return false;
  const code = ch.codePointAt(0);
  return (
    (code >= 0x3000 && code <= 0x9fff) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xff01 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6)
  );
}

function getGlyphIndex(ch, cjk) {
  const table = cjk ? CJK_GLYPH_TABLE : GLYPH_TABLE;
  const idx = table.indexOf(ch);
  if (idx >= 0) return idx;
  return 1 + (ch.charCodeAt(0) % (table.length - 1));
}

class SplitFlapManager {
  constructor() {
    this.instances = [];
    this.activeSet = new Set();
    this.rafId = null;
    this.lastStepTime = 0;
    this.stepIntervalMs = 26; // Crisp mechanical flap cadence
    this.lastPointer = { x: 0, y: 0, time: 0 };
    this.reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  init() {
    if (this.reducedMotion) return;

    // 1. Pill CTA buttons (hover-triggered split-flap)
    document.querySelectorAll(".pill-cta-btn").forEach((btn) => {
      const textEl = btn.querySelector(".pill-cta-text");
      if (!textEl) return;
      const inst = this.attach(textEl, {
        triggerOnHoverTarget: btn,
        ripple: false,
        steps: 5,
        stagger: 1,
        accentColor: btn.classList.contains("pill-cta-white")
          ? "#0044ff"
          : "#e0f2fe",
      });
      if (inst) this.instances.push(inst);
    });

    // 2. Members section typography (scroll-reveal + pointer ripple)
    const memberSelectors = [
      { sel: ".members-header-badge", stagger: 1, steps: 8, ripple: true, accent: "#38bdf8" },
      { sel: ".members-header-title", stagger: 1, steps: 6, ripple: true, accent: "#38bdf8" },
      { sel: ".member-card-name", stagger: 2, steps: 7, ripple: true, accent: "#38bdf8" },
      { sel: ".member-card-role-title", stagger: 1, steps: 5, ripple: true, accent: "#93c5fd" },
    ];

    memberSelectors.forEach(({ sel, stagger, steps, ripple, accent }) => {
      document.querySelectorAll(sel).forEach((el) => {
        const inst = this.attach(el, {
          revealOnIntersect: true,
          ripple,
          steps,
          stagger,
          accentColor: accent,
        });
        if (inst) this.instances.push(inst);
      });
    });

    // 3. Footer social links & tagline (hover-triggered)
    document.querySelectorAll(".footer-socials-line").forEach((link) => {
      const textEl = link.querySelector(".footer-socials-text");
      if (!textEl) return;
      const inst = this.attach(textEl, {
        triggerOnHoverTarget: link,
        ripple: false,
        steps: 6,
        stagger: 1,
        accentColor: "#0055ff",
      });
      if (inst) this.instances.push(inst);
    });

    const tagline = document.querySelector("#footer-bottom-tagline");
    if (tagline) {
      const inst = this.attach(tagline, {
        revealOnIntersect: true,
        ripple: true,
        steps: 6,
        stagger: 1,
        accentColor: "#7dd3fc",
      });
      if (inst) this.instances.push(inst);
    }

    // 4. Preloader label instant mechanical flap
    const preLabel = document.querySelector("#preloader-loading-label");
    if (preLabel) {
      const inst = this.attach(preLabel, {
        revealOnIntersect: false,
        ripple: false,
        steps: 8,
        stagger: 1,
        accentColor: "#ffffff",
      });
      if (inst) {
        this.instances.push(inst);
        this.trigger(inst);
      }
    }

    // Setup IntersectionObserver for scroll-in reveal
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const inst = entry.target.__splitFlapInst;
              if (inst && !inst.hasRevealed) {
                inst.hasRevealed = true;
                this.trigger(inst);
              }
            }
          }
        },
        { threshold: 0.25 }
      );
      for (const inst of this.instances) {
        if (inst.revealOnIntersect) {
          observer.observe(inst.el);
        }
      }
    }

    // Global pointer listener for ripple (lightweight, only checks hovered instance)
    window.addEventListener("pointermove", this.onPointerMove.bind(this), {
      passive: true,
    });
  }

  attach(el, options = {}) {
    if (!el || el.__splitFlapAttached) return null;
    const rawText = el.textContent;
    if (!rawText || !rawText.trim()) return null;

    el.__splitFlapAttached = true;

    const chars = Array.from(rawText.trim());
    const frag = document.createDocumentFragment();
    const cells = [];

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === " " || ch === "\n" || ch === "\t") {
        frag.appendChild(document.createTextNode(ch));
        continue;
      }
      const span = document.createElement("span");
      span.className = "af-ch";
      span.textContent = ch;
      span.style.display = "inline-block";
      span.style.textAlign = "center";
      span.style.transition = "color 120ms ease";
      frag.appendChild(span);

      const cjk = isCJK(ch);
      const table = cjk ? CJK_GLYPH_TABLE : GLYPH_TABLE;
      const targetIdx = getGlyphIndex(ch, cjk);

      cells.push({
        span,
        targetChar: ch,
        cjk,
        table,
        targetIdx,
        delay: 0,
        stepsLeft: 0,
        lt: targetIdx,
        flashFrames: 0,
        index: cells.length,
      });
    }

    el.textContent = "";
    el.appendChild(frag);

    // Measure character widths once to guarantee zero layout reflow during flapping
    requestAnimationFrame(() => {
      for (const c of cells) {
        const w = c.span.getBoundingClientRect().width;
        if (w > 0) {
          c.span.style.minWidth = `${w.toFixed(2)}px`;
        }
      }
    });

    const inst = {
      el,
      cells,
      steps: options.steps || 6,
      stagger: options.stagger || 1,
      ripple: !!options.ripple,
      revealOnIntersect: !!options.revealOnIntersect,
      accentColor: options.accentColor || "#38bdf8",
      hasRevealed: false,
      isFlapping: false,
      lastRippleTime: 0,
    };

    el.__splitFlapInst = inst;

    if (options.triggerOnHoverTarget) {
      options.triggerOnHoverTarget.addEventListener("mouseenter", () => {
        this.trigger(inst);
      });
    }

    return inst;
  }

  trigger(inst) {
    if (!inst || !inst.cells.length) return;
    for (let i = 0; i < inst.cells.length; i++) {
      const c = inst.cells[i];
      c.delay = Math.floor(i * 0.5 * inst.stagger);
      c.stepsLeft = inst.steps;
      c.lt =
        (c.targetIdx - inst.steps + c.table.length * 4) % c.table.length;
      c.flashFrames = 0;
    }
    inst.isFlapping = true;
    this.activeSet.add(inst);
    this.ensureLoop();
  }

  onPointerMove(ev) {
    const now = performance.now();
    const dx = ev.clientX - this.lastPointer.x;
    const dy = ev.clientY - this.lastPointer.y;
    const speed = Math.hypot(dx, dy);
    this.lastPointer = { x: ev.clientX, y: ev.clientY, time: now };

    if (speed < 1.5) return;

    const target = ev.target;
    if (!target || typeof target.closest !== "function") return;

    // Check if pointer is over a ripple-enabled element or one of its spans
    let el = target.classList?.contains("af-ch") ? target.parentElement : target;
    const inst = el && el.__splitFlapInst;
    if (!inst || !inst.ripple) return;

    // Throttle per-element ripple slightly for smoothness
    if (now - inst.lastRippleTime < 40) return;
    inst.lastRippleTime = now;

    // Radius scales gently with pointer speed (inspired by program.js)
    const radius = Math.min(24 + speed * 0.8, 72);
    let triggeredAny = false;

    for (const c of inst.cells) {
      if (c.stepsLeft > 0 || c.delay > 0) continue;
      const rect = c.span.getBoundingClientRect();
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);

      if (dist <= radius) {
        const steps = 4;
        c.delay = 0;
        c.stepsLeft = steps;
        c.lt = (c.targetIdx - steps + c.table.length * 4) % c.table.length;
        c.flashFrames = 0;
        triggeredAny = true;
      }
    }

    if (triggeredAny) {
      inst.isFlapping = true;
      this.activeSet.add(inst);
      this.ensureLoop();
    }
  }

  ensureLoop() {
    if (this.rafId !== null) return;
    this.lastStepTime = performance.now();
    const loop = (now) => {
      if (this.activeSet.size === 0) {
        this.rafId = null;
        return;
      }
      if (now - this.lastStepTime >= this.stepIntervalMs) {
        this.lastStepTime = now;
        this.stepAll();
      }
      if (this.activeSet.size > 0) {
        this.rafId = requestAnimationFrame(loop);
      } else {
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stepAll() {
    for (const inst of this.activeSet) {
      let stillActive = false;

      for (const c of inst.cells) {
        if (c.delay > 0) {
          c.delay--;
          stillActive = true;
          continue;
        }

        if (c.stepsLeft > 0) {
          c.lt = (c.lt + 1) % c.table.length;
          c.stepsLeft--;
          if (c.stepsLeft === 0) {
            c.span.textContent = c.targetChar;
            // Sparkle highlight ("きらーん") on landing
            c.flashFrames = 3;
            c.span.style.color = inst.accentColor;
            c.span.style.textShadow = `0 0 8px ${inst.accentColor}66`;
          } else {
            c.span.textContent = c.table[c.lt];
            c.span.style.color = inst.accentColor;
          }
          stillActive = true;
        } else if (c.flashFrames > 0) {
          c.flashFrames--;
          if (c.flashFrames === 0) {
            c.span.style.color = "";
            c.span.style.textShadow = "";
          } else {
            stillActive = true;
          }
        }
      }

      if (!stillActive) {
        inst.isFlapping = false;
        this.activeSet.delete(inst);
      }
    }
  }
}

function bootSplitFlap() {
  const manager = new SplitFlapManager();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => manager.init());
  } else {
    manager.init();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootSplitFlap);
} else {
  bootSplitFlap();
}
