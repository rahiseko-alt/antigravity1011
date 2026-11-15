/**
 * ASCII Split-Flap, Diagonal Wave & Pointer Ripple Engine
 * Ported directly from amazing-bell/combined/program.js (ertdfgcvb / play.core)
 * Adapted for zero-reflow, zero-idle-CPU execution alongside WebGL & SplitType.
 */

// Exact half-width glyph table (for preloader / English UI / hover)
const GLYPH_TABLE =
  " .,·-•─~+:;=*π’“”┐┌┘└┼├┤┴┬│╗╔╝╚╬╠╣╩╦║░▒▓█▄▀▌▐■!?&#$@aàäbcdefghijklmnoòöpqrstuüvwxyzßABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%()".split(
    ""
  );

// Clean mechanical ASCII split-flap table (no random CJK/Katakana mojibake)
const ASCII_FLAP_TABLE =
  ".:-=+*#%@/\\[]{}<>~^_0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

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

function getGlyphIndex(ch, asciiOnly) {
  const table = asciiOnly ? ASCII_FLAP_TABLE : GLYPH_TABLE;
  const idx = table.indexOf(ch);
  if (idx >= 0) return idx;
  return 1 + (ch.charCodeAt(0) % (table.length - 1));
}

function resolveElementAccentColor(el, fallback = "#38bdf8") {
  if (!el || typeof window === "undefined") return fallback;
  const card = el.closest ? el.closest(".member-card") : null;
  const target = card || el;
  const raw = getComputedStyle(target).getPropertyValue("--accent-color").trim();
  return raw || fallback;
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
        asciiFlap: true,
        steps: 5,
        stagger: 1,
        accentColor: btn.classList.contains("pill-cta-white")
          ? "#0044ff"
          : "#e0f2fe",
      });
      if (inst) this.instances.push(inst);
    });

    // 2. Members section typography & cards (crisp ASCII split-flap with CJK safety)
    const memberSelectors = [
      { sel: ".members-header-badge", stagger: 1, steps: 5, ripple: true, accent: "#38bdf8", hoverOnCard: false },
      { sel: ".members-header-title", stagger: 1, steps: 5, ripple: false, accent: "#60a5fa", hoverOnCard: false },
      { sel: ".member-card-name", stagger: 1, steps: 5, ripple: true, accent: "#38bdf8", hoverOnCard: true },
      { sel: ".member-card-role-title", stagger: 1, steps: 5, ripple: false, accent: "#38bdf8", hoverOnCard: true },
    ];

    memberSelectors.forEach(({ sel, stagger, steps, ripple, accent, hoverOnCard }) => {
      document.querySelectorAll(sel).forEach((el) => {
        const card = hoverOnCard ? el.closest(".member-card") : null;
        const resolvedAccent = resolveElementAccentColor(el, accent);
        const inst = this.attach(el, {
          revealOnIntersect: true,
          triggerOnHoverTarget: card || undefined,
          hoverCooldownMs: 650,
          asciiFlap: true,
          ripple,
          steps,
          stagger,
          accentColor: resolvedAccent,
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

    // 6. Dual IntersectionObserver + Scroll-Viewport Check for Lusion transform scrolling
    const checkViewportReveals = () => {
      const vh = window.innerHeight || 900;
      const now = performance.now();
      for (const inst of this.instances) {
        if (!inst.revealOnIntersect) continue;
        const rect = inst.el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        const inView = rect.top < vh * 0.92 && rect.bottom > vh * 0.08;
        if (inView) {
          if (!inst.hasRevealed && now - inst.lastRevealTime > 900) {
            inst.hasRevealed = true;
            inst.lastRevealTime = now;
            this.trigger(inst);
          }
        } else if (rect.bottom < -60 || rect.top > vh + 60) {
          inst.hasRevealed = false;
        }
      }
    };

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const now = performance.now();
          for (const entry of entries) {
            const inst = entry.target.__splitFlapInst;
            if (!inst) continue;
            if (entry.isIntersecting) {
              if (!inst.hasRevealed && now - inst.lastRevealTime > 900) {
                inst.hasRevealed = true;
                inst.lastRevealTime = now;
                this.trigger(inst);
              }
            } else {
              const vh = window.innerHeight || 900;
              if (entry.boundingClientRect.bottom < -40 || entry.boundingClientRect.top > vh + 40) {
                inst.hasRevealed = false;
              }
            }
          }
        },
        { threshold: 0.05 }
      );
      for (const inst of this.instances) {
        if (inst.revealOnIntersect) {
          observer.observe(inst.el);
        }
      }
    }

    let scrollCheckFrames = 0;
    let scrollCheckRaf = null;
    const scheduleViewportCheck = (frames = 24) => {
      scrollCheckFrames = Math.max(scrollCheckFrames, frames);
      if (scrollCheckRaf !== null) return;
      const tick = () => {
        checkViewportReveals();
        scrollCheckFrames--;
        if (scrollCheckFrames > 0) {
          scrollCheckRaf = requestAnimationFrame(tick);
        } else {
          scrollCheckRaf = null;
        }
      };
      scrollCheckRaf = requestAnimationFrame(tick);
    };

    window.addEventListener("wheel", () => scheduleViewportCheck(28), { passive: true });
    window.addEventListener("touchmove", () => scheduleViewportCheck(28), { passive: true });
    window.addEventListener("scroll", () => scheduleViewportCheck(16), { passive: true });
    window.addEventListener("click", () => scheduleViewportCheck(40), { passive: true });

    const pageContainer = document.getElementById("page-container");
    if (pageContainer && "MutationObserver" in window) {
      const scrollObs = new MutationObserver(() => {
        scheduleViewportCheck(4);
      });
      scrollObs.observe(pageContainer, { attributes: true, attributeFilter: ["style"] });
    }

    // Initial check once preloader clears / page settles
    setTimeout(() => checkViewportReveals(), 180);

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
      span.style.verticalAlign = "baseline";
      span.style.overflow = "hidden";
      span.style.whiteSpace = "nowrap";
      span.style.transition = "color 120ms ease";
      frag.appendChild(span);

      const cjk = isCJK(ch);
      const asciiOnly = options.asciiFlap !== false || cjk;
      const table = asciiOnly ? ASCII_FLAP_TABLE : GLYPH_TABLE;
      const targetIdx = getGlyphIndex(ch, asciiOnly);

      cells.push({
        span,
        targetChar: ch,
        cjk,
        asciiOnly,
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

    const inst = {
      el,
      cells,
      steps: options.steps || 6,
      stagger: options.stagger || 1,
      ripple: !!options.ripple,
      revealOnIntersect: !!options.revealOnIntersect,
      accentColor: options.accentColor || "#38bdf8",
      hoverCooldownMs: options.hoverCooldownMs || 0,
      hasRevealed: false,
      lastRevealTime: 0,
      lastHoverTime: 0,
      isFlapping: false,
      lastRippleTime: 0,
    };

    el.__splitFlapInst = inst;

    if (options.triggerOnHoverTarget) {
      options.triggerOnHoverTarget.addEventListener("mouseenter", () => {
        const now = performance.now();
        if (inst.hoverCooldownMs && now - inst.lastHoverTime < inst.hoverCooldownMs) {
          return;
        }
        inst.lastHoverTime = now;
        this.trigger(inst);
      });
    }

    return inst;
  }

  trigger(inst) {
    if (!inst || !inst.cells.length) return;
    const widths = inst.cells.map((c) =>
      c.span.style.width ? 0 : c.span.getBoundingClientRect().width
    );
    for (let i = 0; i < inst.cells.length; i++) {
      const c = inst.cells[i];
      const w = widths[i];
      if (w > 0) {
        const px = `${w.toFixed(2)}px`;
        c.span.style.width = px;
        c.span.style.minWidth = px;
      }
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
        if (rect.width > 0) {
          const px = `${rect.width.toFixed(2)}px`;
          c.span.style.width = px;
          c.span.style.minWidth = px;
        }
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
        this.lastStepTime = now;
        this.frame++;
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
            c.span.style.fontFamily = "";
            c.flashFrames = 3;
            c.span.style.color = inst.accentColor;
            c.span.style.textShadow = `0 0 8px color-mix(in srgb, ${inst.accentColor} 45%, transparent)`;
          } else {
            c.span.style.fontFamily = "'IBMPlexMono', ui-monospace, monospace";
            c.span.textContent = c.table[c.lt];
            c.span.style.color = inst.accentColor;
          }
          stillActive = true;
        } else if (c.flashFrames > 0) {
          c.flashFrames--;
          if (c.flashFrames === 0) {
            c.span.style.color = "";
            c.span.style.textShadow = "";
            c.span.style.fontFamily = "";
            c.span.style.width = "";
            c.span.style.minWidth = "";
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
        for (const c of this.cells) {
          const el = c.wrapper || c.primary;
          if (el) el.style.minWidth = "";
        }
        this.restoreCanonicalChars();
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
          this.bindCells();
        }, 180);
      },
      { passive: true }
    );

    // Trigger diagonal wave when #end-section enters viewport + periodic tiroir shuffle
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
        { threshold: 0.12 }
      );
      obs.observe(this.section);
    }

    // Hovering #end-section-title triggers a crisp diagonal wave across the title
    const titleBox = document.getElementById("end-section-title");
    if (titleBox) {
      titleBox.addEventListener("mouseenter", () => {
        this.ensureCellsConnected();
        this.triggerTitleWave();
      });
    }

    // Hovering ASCII footer email or [^ TOP] triggers localized ASCII flap wave
    const footerControls = document.querySelectorAll(
      "#end-ascii-footer-mail, #end-ascii-top-btn"
    );
    footerControls.forEach((ctrl) => {
      ctrl.addEventListener("mouseenter", () => {
        this.ensureCellsConnected();
        this.triggerElementWave(ctrl);
      });
    });
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

    // 2. Title ("企画を提案する / 企画に参加する / AIueoに参加する")
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

    // 3. Integrated ASCII Footer (.af-footer-ascii)
    const footerLines = document.querySelectorAll(
      "#end-ascii-footer .af-footer-ascii"
    );
    footerLines.forEach((el, idx) => {
      this.wrapElementChars(el, 5 + idx, 0, "footer", el);
    });

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
    const table = cjk ? ASCII_FLAP_TABLE : GLYPH_TABLE;
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

  wrapElementChars(containerEl, row, startCol, kind, ownerEl = null) {
    if (!containerEl) return startCol;
    const owner = ownerEl || containerEl;
    const existingSpans = containerEl.querySelectorAll(".af-end-ch");
    if (existingSpans.length > 0) {
      let col = startCol;
      existingSpans.forEach((span) => {
        const ch =
          span.getAttribute("data-orig-ch") || span.textContent || "";
        if (!ch.trim()) return;
        const cjk = isCJK(ch);
        const table = cjk ? ASCII_FLAP_TABLE : GLYPH_TABLE;
        const targetIdx = getGlyphIndex(ch, cjk);
        this.cells.push({
          kind,
          ownerEl: owner,
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
      const table = cjk ? ASCII_FLAP_TABLE : GLYPH_TABLE;
      const targetIdx = getGlyphIndex(ch, cjk);

      this.cells.push({
        kind,
        ownerEl: owner,
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
      const colDelay =
        c.kind === "footer"
          ? Math.min(Math.floor(c.col / 3), 10)
          : Math.floor(c.col / 2);
      const rowDelay = c.kind === "footer" ? 6 + (c.row - 5) : c.row * 3;
      const waveDelay = colDelay + rowDelay + 2;
      const steps = c.kind === "footer" ? 6 + (c.col % 4) : 8 + (c.col % 5);
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

  triggerElementWave(targetEl) {
    if (!targetEl) return;
    this.ensureCellsConnected();
    let any = false;
    for (const c of this.cells) {
      if (c.ownerEl !== targetEl) continue;
      const waveDelay = Math.floor(c.col / 3);
      const steps = 5 + (c.col % 3);
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
    const isLightBg =
      typeof window.__asciiDarkFactor === "number" &&
      window.__asciiDarkFactor <= 0.52;
    const primaryFlash = isLightBg ? "#0284c7" : "#00f0ff";
    const altFlash = isLightBg ? "#0f172a" : "#ffffff";
    const bootColor = isLightBg
      ? "rgba(2, 132, 199, 0.72)"
      : "rgba(0, 240, 255, 0.55)";
    const bootShadow = isLightBg ? "none" : "0 0 8px rgba(0, 240, 255, 0.35)";
    const flashShadow = isLightBg ? "none" : "0 0 14px rgba(0, 240, 255, 0.85)";

    for (const c of this.cells) {
      // Phase 1: Diagonal wave countdown (display pre-wave ASCII symbol)
      if (c.it > 1) {
        c.it--;
        const bootCh = WAVE_BOOT_GLYPHS[(c.col + c.it) % WAVE_BOOT_GLYPHS.length];
        this.setCellText(c, bootCh);
        this.setCellStyle(c, bootColor, bootShadow);
        stillActive = true;
        continue;
      }

      // Phase 2: Mechanical split-flap cycling through GLYPH_TABLE / ASCII_FLAP_TABLE
      if (c.stepsLeft > 0) {
        c.it = 1;
        c.lt = (c.lt + 1) % c.table.length;
        c.stepsLeft--;

        if (c.stepsLeft === 0) {
          c.it = 0;
          this.setCellText(c, c.targetChar);
          c.flashFrames = 3;
          this.setCellStyle(c, primaryFlash, flashShadow);
        } else {
          this.setCellText(c, c.table[c.lt]);
          // program.js lines 572-574: even/odd frame high-contrast sparkle ("きらーん")
          const hiColor = frame % 2 === 0 ? primaryFlash : altFlash;
          const hiShadow = isLightBg
            ? "none"
            : frame % 2 === 0
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
