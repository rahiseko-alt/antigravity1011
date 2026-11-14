/**
 * ASCII Split-Flap, Diagonal Wave & Pointer Ripple Engine
 * Ported directly from amazing-bell/combined/program.js (ertdfgcvb / play.core)
 * Adapted for zero-reflow, zero-idle-CPU execution alongside WebGL & SplitType.
 */

// Exact half-width glyph table from amazing-bell/combined/program.js
// (ordered: space -> punctuation -> box-drawing -> shades -> symbols -> letters -> digits)
const GLYPH_TABLE =
  " .,·-•─~+:;=*π’“”┐┌┘└┼├┤┴┬│╗╔╝╚╬╠╣╩╦║░▒▓█▄▀▌▐■!?&#$@aàäbcdefghijklmnoòöpqrstuüvwxyzßABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%()".split(
    ""
  );

// Exact full-width (2-cell) CJK glyph table from amazing-bell/combined/program.js
// Guaranteed 2-cell width so Japanese text never jitters horizontally
const CJK_GLYPH_TABLE = (
  "　！？”＃＄％＆＊＋＝・：；〜ー" +
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン" +
  "ガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ" +
  "東京文字電脳波動光星音"
)
  .replace("”", "＂")
  .split("");

// ASCII pre-wave matrix symbols (box-drawing & density shades from program.js)
const WAVE_BOOT_GLYPHS = "·•─~+:;=*┐┌┘└┼├┤┴┬│░▒▓█▄▀■".split("");

function isCJK(ch) {
  if (!ch) return false;
  const code = ch.codePointAt(0);
  return (
    (code >= 0x3000 && code <= 0x9fff) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xff01 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    (code >= 0x20000 && code <= 0x2fa1f)
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
    this.stepIntervalMs = 28; // Crisp mechanical flap cadence
    this.frame = 0;
    this.lastPointer = { x: 0, y: 0, time: 0 };
    this.endEngine = null;
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

    // 5. End Section (#end-section) Full program.js ASCII Text Engine
    this.endEngine = new EndSectionAsciiEngine(this);
    this.endEngine.init();

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

    // Global pointer listener for ripple
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

    if (this.endEngine) {
      this.endEngine.onPointerMove(ev, speed, now);
    }

    if (speed < 1.5) return;

    const target = ev.target;
    if (!target || typeof target.closest !== "function") return;

    let el = target.classList?.contains("af-ch") ? target.parentElement : target;
    const inst = el && el.__splitFlapInst;
    if (!inst || !inst.ripple) return;

    if (now - inst.lastRippleTime < 40) return;
    inst.lastRippleTime = now;

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
      const elapsed = now - this.lastStepTime;
      if (elapsed >= this.stepIntervalMs) {
        const stepsToRun = Math.max(
          1,
          Math.min(5, Math.floor(elapsed / this.stepIntervalMs))
        );
        this.lastStepTime = now;
        for (let s = 0; s < stepsToRun; s++) {
          this.frame++;
          this.stepAll();
          if (this.activeSet.size === 0) break;
        }
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
      if (inst.isEndSectionEngine) {
        const active = inst.step(this.frame);
        if (!active) {
          this.activeSet.delete(inst);
        }
        continue;
      }

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

/**
 * EndSectionAsciiEngine
 * Applies amazing-bell/combined/program.js foreground ASCII mechanics to #end-section:
 * 1. Diagonal boot wave (flap = Math.floor(x / 3 + 2 * y) + 2)
 * 2. Even/odd frame high-contrast sparkle flash ("きらーん")
 * 3. Pointer-proximity ASCII glyph scramble (distSq < radiusSq)
 * 4. Periodic "tiroir" shuffle on random character clusters
 * 5. Full compatibility with Lusion EndSection SplitType (.char-wrapper & .word)
 */
class EndSectionAsciiEngine {
  constructor(manager) {
    this.manager = manager;
    this.isEndSectionEngine = true;
    this.section = null;
    this.subtitleEl = null;
    this.titleEl = null;
    this.cells = [];
    this.isVisible = false;
    this.hasBootedWave = false;
    this.lastRippleTime = 0;
    this.tiroirTimer = null;
    this.resizeTimer = null;
    this.isBinding = false;
  }

  init() {
    this.section = document.getElementById("end-section");
    this.subtitleEl = document.getElementById("end-section-subtitle-text");
    this.titleEl = document.getElementById("end-section-title-link");
    if (!this.section || !this.subtitleEl || !this.titleEl) return;

    this.bindCells();

    // Watch for EndSection._splitText() recreating .char-wrapper / .word after preloader finishes
    if ("MutationObserver" in window) {
      const mutObs = new MutationObserver(() => {
        if (this.isBinding) return;
        const needsRebind =
          this.cells.length === 0 ||
          this.cells.some(
            (c) =>
              (c.primary && !c.primary.isConnected) ||
              (c.wrapper && !c.wrapper.isConnected)
          ) ||
          (this.titleEl.querySelectorAll(".char-wrapper").length > 0 &&
            !this.cells.some((c) => c.wrapper && c.wrapper.isConnected));
        if (needsRebind) {
          this.bindCells();
        }
      });
      mutObs.observe(this.titleEl, { childList: true, subtree: true });
      mutObs.observe(this.subtitleEl, { childList: true, subtree: true });
    }

    // Re-bind cleanly after window resize (after EndSection.resize() runs SplitType)
    window.addEventListener(
      "resize",
      () => {
        this.restoreCanonicalChars();
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
          this.bindCells();
        }, 180);
      },
      { passive: true }
    );

    // Trigger diagonal wave when #end-section-content enters viewport + periodic tiroir shuffle
    const targetEl =
      document.getElementById("end-section-content") || this.section;
    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            this.isVisible = entry.isIntersecting;
            if (entry.isIntersecting) {
              this.ensureCellsConnected();
              if (!this.hasBootedWave && this.cells.length > 0) {
                this.hasBootedWave = true;
                this.triggerDiagonalWave();
              }
              this.startTiroirLoop();
            } else {
              this.hasBootedWave = false;
              this.stopTiroirLoop();
            }
          }
        },
        { threshold: 0.25 }
      );
      obs.observe(targetEl);
    }

    // Hovering #end-section-title triggers a crisp diagonal wave across the title
    const titleBox = document.getElementById("end-section-title");
    if (titleBox) {
      titleBox.addEventListener("mouseenter", () => {
        this.ensureCellsConnected();
        this.triggerTitleWave();
      });
    }
  }

  ensureCellsConnected() {
    if (
      this.cells.length === 0 ||
      this.cells.some(
        (c) =>
          (c.primary && !c.primary.isConnected) ||
          (c.wrapper && !c.wrapper.isConnected)
      ) ||
      (this.titleEl &&
        this.titleEl.querySelectorAll(".char-wrapper").length > 0 &&
        !this.cells.some((c) => c.wrapper && c.wrapper.isConnected))
    ) {
      this.bindCells();
    }
  }

  restoreCanonicalChars() {
    for (const c of this.cells) {
      this.setCellText(c, c.targetChar);
      this.clearCellStyle(c);
      c.it = 0;
      c.stepsLeft = 0;
      c.flashFrames = 0;
    }
  }

  bindCells() {
    if (this.isBinding) return;
    this.isBinding = true;
    this.cells = [];

    // 1. Subtitle ("「こういうのやるんですけど、一緒にどうですか？」")
    if (this.subtitleEl) {
      const words = this.subtitleEl.querySelectorAll(".word");
      let col = 0;
      if (words.length > 0) {
        words.forEach((wordEl) => {
          col = this.wrapElementChars(wordEl, 0, col, "subtitle");
        });
      } else {
        this.wrapElementChars(this.subtitleEl, 0, 0, "subtitle");
      }
    }

    // 2. Title ("Join / Propose" / "企画を持ち込む・参加する")
    if (this.titleEl) {
      const lines = this.titleEl.querySelectorAll(
        ".end-section-title-link-line"
      );
      if (lines.length > 0) {
        lines.forEach((lineEl, lineIdx) => {
          const wrappers = lineEl.querySelectorAll(".char-wrapper");
          wrappers.forEach((wrapper, charIdx) => {
            this.registerTitleWrapper(wrapper, lineIdx + 1, charIdx);
          });
        });
      } else {
        const wrappers = this.titleEl.querySelectorAll(".char-wrapper");
        if (wrappers.length > 0) {
          wrappers.forEach((wrapper, idx) => {
            this.registerTitleWrapper(
              wrapper,
              1 + Math.floor(idx / 14),
              idx % 14
            );
          });
        }
      }
    }

    this.isBinding = false;

    // Lock character widths to prevent any horizontal layout jitter during ASCII flapping
    requestAnimationFrame(() => {
      for (const c of this.cells) {
        const el = c.wrapper || c.primary;
        if (!el) continue;
        const w = el.getBoundingClientRect().width;
        if (w > 0) {
          el.style.minWidth = `${w.toFixed(2)}px`;
        }
      }
      if (this.isVisible && !this.hasBootedWave && this.cells.length > 0) {
        this.hasBootedWave = true;
        this.triggerDiagonalWave();
      }
    });
  }

  registerTitleWrapper(wrapper, row, col) {
    const children = wrapper.querySelectorAll(".char");
    const primary = children[0];
    const clone = children[1] || null;
    if (!primary) return;

    const orig =
      primary.getAttribute("data-orig-ch") || primary.textContent || "";
    const ch = orig.trim();
    if (!ch) return;

    primary.setAttribute("data-orig-ch", ch);
    if (clone) clone.setAttribute("data-orig-ch", ch);

    const cjk = isCJK(ch);
    const table = cjk ? CJK_GLYPH_TABLE : GLYPH_TABLE;
    const targetIdx = getGlyphIndex(ch, cjk);

    this.cells.push({
      kind: "title",
      wrapper,
      primary,
      clone,
      targetChar: ch,
      cjk,
      table,
      targetIdx,
      row,
      col,
      it: 0,
      stepsLeft: 0,
      lt: targetIdx,
      flashFrames: 0,
    });
  }

  wrapElementChars(containerEl, row, startCol, kind) {
    if (!containerEl) return startCol;
    const existingSpans = containerEl.querySelectorAll(".af-end-ch");
    if (existingSpans.length > 0) {
      let col = startCol;
      existingSpans.forEach((span) => {
        const ch =
          span.getAttribute("data-orig-ch") || span.textContent || "";
        if (!ch.trim()) return;
        const cjk = isCJK(ch);
        const table = cjk ? CJK_GLYPH_TABLE : GLYPH_TABLE;
        const targetIdx = getGlyphIndex(ch, cjk);
        this.cells.push({
          kind,
          wrapper: null,
          primary: span,
          clone: null,
          targetChar: ch,
          cjk,
          table,
          targetIdx,
          row,
          col: col++,
          it: 0,
          stepsLeft: 0,
          lt: targetIdx,
          flashFrames: 0,
        });
      });
      return col;
    }

    const rawText = containerEl.textContent || "";
    if (!rawText.trim()) return startCol;

    const chars = Array.from(rawText);
    const frag = document.createDocumentFragment();
    let col = startCol;

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (ch === " " || ch === "\n" || ch === "\t") {
        frag.appendChild(document.createTextNode(ch));
        continue;
      }
      const span = document.createElement("span");
      span.className = "af-ch af-end-ch";
      span.setAttribute("data-orig-ch", ch);
      span.textContent = ch;
      span.style.display = "inline-block";
      span.style.textAlign = "center";
      frag.appendChild(span);

      const cjk = isCJK(ch);
      const table = cjk ? CJK_GLYPH_TABLE : GLYPH_TABLE;
      const targetIdx = getGlyphIndex(ch, cjk);

      this.cells.push({
        kind,
        wrapper: null,
        primary: span,
        clone: null,
        targetChar: ch,
        cjk,
        table,
        targetIdx,
        row,
        col: col++,
        it: 0,
        stepsLeft: 0,
        lt: targetIdx,
        flashFrames: 0,
      });
    }

    containerEl.textContent = "";
    containerEl.appendChild(frag);
    return col;
  }

  setCellText(c, str) {
    if (c.primary) c.primary.textContent = str;
    if (c.clone) c.clone.textContent = str;
  }

  setCellStyle(c, color, shadow, weight = "") {
    if (c.primary) {
      c.primary.style.color = color;
      c.primary.style.textShadow = shadow;
      if (weight) c.primary.style.fontWeight = weight;
    }
    if (c.clone) {
      c.clone.style.color = color;
      c.clone.style.textShadow = shadow;
      if (weight) c.clone.style.fontWeight = weight;
    }
  }

  clearCellStyle(c) {
    if (c.primary) {
      c.primary.style.color = "";
      c.primary.style.textShadow = "";
      c.primary.style.fontWeight = "";
    }
    if (c.clone) {
      c.clone.style.color = "";
      c.clone.style.textShadow = "";
      c.clone.style.fontWeight = "";
    }
  }

  // program.js initCells(context, true): flap = Math.floor(x / 3 + 2 * y) + 2
  triggerDiagonalWave() {
    this.ensureCellsConnected();
    if (!this.cells.length) return;
    for (const c of this.cells) {
      const waveDelay = Math.floor(c.col / 2 + c.row * 3) + 2;
      const steps = 8 + (c.col % 5);
      c.it = waveDelay;
      c.stepsLeft = steps;
      c.lt = (c.targetIdx - steps + c.table.length * 4) % c.table.length;
      c.flashFrames = 0;
    }
    this.manager.activeSet.add(this);
    this.manager.ensureLoop();
  }

  triggerTitleWave() {
    this.ensureCellsConnected();
    let any = false;
    for (const c of this.cells) {
      if (c.kind !== "title") continue;
      const waveDelay = Math.floor(c.col / 2 + (c.row - 1) * 2) + 1;
      const steps = 6 + (c.col % 3);
      c.it = waveDelay;
      c.stepsLeft = steps;
      c.lt = (c.targetIdx - steps + c.table.length * 4) % c.table.length;
      c.flashFrames = 0;
      any = true;
    }
    if (any) {
      this.manager.activeSet.add(this);
      this.manager.ensureLoop();
    }
  }

  // program.js periodic "tiroir" shuffle (data-flap=1)
  startTiroirLoop() {
    if (this.tiroirTimer) return;
    this.tiroirTimer = setInterval(() => {
      if (!this.isVisible) return;
      this.ensureCellsConnected();
      if (!this.cells.length) return;
      const count = 3 + Math.floor(Math.random() * 4);
      let any = false;
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * this.cells.length);
        const c = this.cells[idx];
        if (!c || c.stepsLeft > 0 || c.it > 0) continue;
        const steps = 5 + (i % 3);
        c.it = 1;
        c.stepsLeft = steps;
        c.lt = (c.targetIdx - steps + c.table.length * 4) % c.table.length;
        c.flashFrames = 0;
        any = true;
      }
      if (any) {
        this.manager.activeSet.add(this);
        this.manager.ensureLoop();
      }
    }, 2400);
  }

  stopTiroirLoop() {
    if (this.tiroirTimer) {
      clearInterval(this.tiroirTimer);
      this.tiroirTimer = null;
    }
  }

  // program.js main() pointer-proximity scramble: distSq < radiusSq
  onPointerMove(ev, speed, now) {
    if (!this.isVisible || !this.cells.length || speed < 1.2) return;
    if (now - this.lastRippleTime < 32) return;
    this.lastRippleTime = now;

    const radius = Math.min(34 + speed * 1.15, 92);
    let any = false;

    for (const c of this.cells) {
      if (c.stepsLeft > 0 || c.it > 1) continue;
      const el = c.wrapper || c.primary;
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const cx = rect.left + rect.width * 0.5;
      const cy = rect.top + rect.height * 0.5;
      const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);

      if (dist <= radius) {
        const steps = 5;
        c.it = 1;
        c.stepsLeft = steps;
        c.lt = (c.targetIdx - steps + c.table.length * 4) % c.table.length;
        c.flashFrames = 0;
        any = true;
      }
    }

    if (any) {
      this.manager.activeSet.add(this);
      this.manager.ensureLoop();
    }
  }

  // program.js setOverlay() state machine
  step(frame) {
    let stillActive = false;

    for (const c of this.cells) {
      // Phase 1: Diagonal wave countdown (display pre-wave ASCII symbol)
      if (c.it > 1) {
        c.it--;
        const bootCh = c.cjk
          ? CJK_GLYPH_TABLE[(c.col + c.it) % 14]
          : WAVE_BOOT_GLYPHS[(c.col + c.it) % WAVE_BOOT_GLYPHS.length];
        this.setCellText(c, bootCh);
        this.setCellStyle(
          c,
          "rgba(0, 240, 255, 0.55)",
          "0 0 8px rgba(0, 240, 255, 0.35)"
        );
        stillActive = true;
        continue;
      }

      // Phase 2: Mechanical split-flap cycling through GLYPH_TABLE / CJK_GLYPH_TABLE
      if (c.stepsLeft > 0) {
        c.it = 1;
        c.lt = (c.lt + 1) % c.table.length;
        c.stepsLeft--;

        if (c.stepsLeft === 0) {
          c.it = 0;
          this.setCellText(c, c.targetChar);
          c.flashFrames = 3;
          this.setCellStyle(
            c,
            "#00f0ff",
            "0 0 14px rgba(0, 240, 255, 0.85)"
          );
        } else {
          this.setCellText(c, c.table[c.lt]);
          // program.js lines 572-574: even/odd frame high-contrast sparkle ("きらーん")
          const hiColor = frame % 2 === 0 ? "#00f0ff" : "#ffffff";
          const hiShadow =
            frame % 2 === 0
              ? "0 0 12px rgba(0, 240, 255, 0.8)"
              : "0 0 10px rgba(255, 255, 255, 0.7)";
          this.setCellStyle(c, hiColor, hiShadow);
        }
        stillActive = true;
      } else if (c.flashFrames > 0) {
        c.flashFrames--;
        if (c.flashFrames === 0) {
          this.clearCellStyle(c);
        } else {
          stillActive = true;
        }
      }
    }

    return stillActive;
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
