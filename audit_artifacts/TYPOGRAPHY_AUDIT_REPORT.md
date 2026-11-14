# Full-Page Visual & Typography Audit Report
**Workspace**: `c:\Users\user\Documents\antigravity\intelligent-babbage`  
**Target**: `http://localhost:3000` (Vite Dev Server)  
**Devices Audited**:
- **Desktop Viewport**: 1920 × 1080 (1x DPR)
- **Mobile Viewport**: 390 × 844 (iPhone 14 standard, 2x DPR)

---

## Executive Summary of Findings

| Section | Key Identified Issues | Severity | Recommended Fix |
| :--- | :--- | :--- | :--- |
| **Section 1: Hero** (`#home-hero`) | Desktop 3-line wrap imbalance (`grid-column: 4/span 5`, 48px). Mobile breaks Japanese word 「どうですか」 awkwardly (`ど` / `うですか？」`). | **Medium** | Desktop: Adjust `font-size: 2.1vw` or widen grid to `span 7`. Mobile: `font-size: 5.2vw` + semantic break. |
| **Section 2: Reel** (`#home-reel`) | Desktop title at `10vw` (192px) **overflows screen by >760px**; Line 2 cut off at "実". Mobile title at `20vw` (78px) breaks into **6 fragmented lines** (e.g. stranded `る。` & `で。`), occupying 468px height. | **CRITICAL** | Desktop: Reduce `#home-reel-title` to `6.5vw`. Mobile: Reduce to `10.5vw` (~41px) so Line 1 is 1 line, Line 2 is 2 lines. |
| **Section 3: Featured** (`#home-featured`) | Desktop title "Active Initiatives & Players" cut off to "Active Initiat•". Card 2 title ("AIアート展覧会を重要文化財で開催する") overflows by 308px at `3vw` (57.6px), clipping "催する". Mobile clips Card 2 title after "重要文化財". | **CRITICAL** | Title wrapper: `font-size: 6.5vw` (desktop). Card title (`.project-item-line-2`): change from `3vw` to `clamp(1.5rem, 2.2vw, 2.8rem)` (~42px max). Mobile: `5.2vw`. |
| **Section 4: Goal** (`#home-goal`) | **Black text on black canvas (`rgb(0,0,0)`)** renders Context Title & Paragraphs completely invisible. Title font size (153.6px) is gargantuan (460px height). Tunnel title is clean. | **CRITICAL** | Force `#home-goal-context { color: #fff !important; }`. Reduce desktop title from `8vw` to `4.5vw`, body font to `1.15rem` (`line-height: 1.8`). Mobile title: `8.5vw`. |
| **Section 5: End Section** (`#end-section`) | Legacy English underline decorations (`#end-section-title-*-decoration`) **slice right across the middle of Japanese characters**. Mobile title at `19.5vw` (76px) blows off screen edge, clipping "込む・参加する". Subtitle breaks `け / ど`. | **CRITICAL** | Remove/hide decoration slices (`display: none !important`). Desktop title: reduce from `10vw` to `5.5vw`. Mobile: reduce from `19.5vw` to `9.5vw` (~37px). Subtitle: `width: 100%`. |
| **Section 6: Footer** (`#footer-section`) | Desktop: Address description wraps and pushes email down, getting horizontally sliced by `overflow: hidden`. Copyright is sliced. Mobile: 2 columns collide directly (`草AI同盟...` smashes into `Twitter / X`); emails truncated on right. | **HIGH** | Desktop: Reduce address/links from `24px` to `16px-18px`, newsletter line from `64.8px` to `3.5vw` (48px). Mobile: Single-column stack (`span 6`) for address & socials; newsletter: `7.5vw`. |

---

## Section-by-Section In-Depth Analysis

### 1. Section 1: `#home-hero`
- **DOM Selector**: `#home-hero-title`
- **Text**: `「今度何かやりましょう」を、<br>「こういうのやるので、一緒にどうですか？」に変える。`
- **Measured Metrics**:
  - **Desktop (1920x1080)**:
    - `fontSize`: `48px` (`2.5vw`)
    - `lineHeight`: `52.8px` (`1.1`)
    - `width`: `697.6px` (`grid-column: 4 / span 5`)
    - *Observation*: 26 characters in line 2 cannot fit in 698px at 48px width (~1248px required). It wraps automatically after 「一緒に」, creating 3 unbalanced lines.
  - **Mobile (390x844)**:
    - `fontSize`: `23.4px` (`6vw`)
    - `lineHeight`: `25.74px`
    - `width`: `360px`
    - *Observation*: Line 2 wraps mid-word at `ど` (`「こういうのやるので、一緒にど` + `うですか？」に変える。`).
- **Screenshot References**:
  - Desktop: `audit_artifacts/desktop_01_hero.png`
  - Mobile: `audit_artifacts/mobile_01_hero.png`

---

### 2. Section 2: `#home-reel`
- **DOM Selectors**: `#home-reel-title`, `#home-reel-title-line-1`, `#home-reel-title-line-2`, `#home-reel-desc`
- **Measured Metrics**:
  - **Desktop (1920x1080)**:
    - `#home-reel-title`: `fontSize: 192px` (`10vw`), `lineHeight: 192px`, `letterSpacing: -3.84px`.
    - `#home-reel-title-line-2`: `やりたいことを、実行まで。` (14 characters at 192px = 2688px). Full width exceeds viewport (1920px). Cut off at "実".
    - `#home-reel-desc`: `fontSize: 28.8px` (`1em`), `lineHeight: 40.32px`. 148 characters. Starts at `top: 932px`, pushing below the fold.
  - **Mobile (390x844)**:
    - `#home-reel-title`: `fontSize: 78px` (`20vw`), `lineHeight: 78px`.
    - Line 1 wraps to 2 lines: `場をつく` / `る。`
    - Line 2 wraps to 4 lines: `やりたい` / `ことを、` / `実行ま` / `で。`
    - Total title height: `468px` (55% of total screen height).
    - `#home-reel-desc`: `fontSize: 16px`, `lineHeight: 22.4px`, starts at `top: 608px`.
- **Screenshot References**:
  - Desktop: `audit_artifacts/desktop_02_reel.png`
  - Mobile: `audit_artifacts/mobile_02_reel.png`

---

### 3. Section 3: `#home-featured`
- **DOM Selectors**: `#home-featured-title`, `#home-featured-disclaimer`, `.project-item-line-1`, `.project-item-line-2`
- **Measured Metrics**:
  - **Desktop (1920x1080)**:
    - `#home-featured-title`: `fontSize: 153.6px` (`8vw`), `letterSpacing: -3.07px`. Container width limits title, clipping "Active Initiatives & Players" to "Active Initiat•".
    - `#home-featured-disclaimer`: `fontSize: 17.28px` (`0.9vw`), `lineHeight: 24.19px`. Vertical clipping at bottom line.
    - Card 2 (`atlas_motion`):
      - Line 1: `2027年1月頃 • 名古屋市市政資料館 • メンバー割り勘` (`fontSize: 17.28px`).
      - Line 2: `AIアート展覧会を重要文化財で開催する` (`fontSize: 57.6px` / `3vw`). Card width is 844.8px. 20 chars at 57.6px require ~1152px. `isOverflowingX: true` (overflow: 308px). "催する" is cut off.
    - Other Cards (1, 3-10): Titles with ≤10 characters fit, but any title ≥12 characters clips.
  - **Mobile (390x844)**:
    - `#home-featured-title`: `fontSize: 58.5px` (`15vw`). Wraps to 3 lines cleanly.
    - Card 2 Line 2: `AIアート展覧会を重要文化財` clipped off after "重要文化財".
- **Screenshot References**:
  - Desktop: `audit_artifacts/desktop_03_featured_top.png`, `desktop_03_featured_cards_1_4.png`, `desktop_03_featured_cards_5_8.png`, `desktop_03_featured_cards_9_10.png`
  - Mobile: `audit_artifacts/mobile_03_featured_top.png`, `mobile_03_featured_cards.png`

---

### 4. Section 4: `#home-goal`
- **DOM Selectors**: `#home-goal-title`, `.home-goal-texts-paragraph`, `#home-goal-tunnel-title`
- **Measured Metrics**:
  - **Desktop (1920x1080)**:
    - `#home-goal-title`: `fontSize: 153.6px` (`8vw`), `color: rgb(0, 0, 0)`.
    - **Visibility Failure**: The 3D canvas is black (GoalTunnels stage), but `html` has `is-white-bg`, causing `#home-goal` to compute `color: rgb(0, 0, 0)`. **Black text on pure black canvas renders it unreadable.**
    - `#home-goal-title` height is `460.78px`, dominating the screen.
    - `.home-goal-texts-paragraph`: `fontSize: 28.8px`, `color: rgb(0, 0, 0)` (invisible).
    - `#home-goal-tunnel-title`: `fontSize: 115.2px` (`6vw`), `color: rgb(255, 255, 255)` (centered and visually crisp).
  - **Mobile (390x844)**:
    - `#home-goal-title`: `fontSize: 62.4px` (`16vw`), `color: rgb(0, 0, 0)` (invisible on black canvas).
    - `.home-goal-texts-paragraph`: `fontSize: 15.75px`, `color: rgb(0, 0, 0)` (invisible).
- **Screenshot References**:
  - Desktop: `audit_artifacts/desktop_04_goal_context.png`, `desktop_04_goal_tunnel.png`
  - Mobile: `audit_artifacts/mobile_04_goal_context.png`

---

### 5. Section 5: `#end-section`
- **DOM Selectors**: `#end-section-subtitle-text`, `#end-section-title`, `#end-section-title-link`
- **Measured Metrics**:
  - **Desktop (1920x1080)**:
    - `#end-section-title`: `--font-size: 10vw` (`192px`), `lineHeight: 192px`.
    - **Decoration Line Artifact**: `#end-section-title-top-decoration` (`top: 0.85em`), `bottom-left-decoration`, and `bottom-right-decoration` were hardcoded for the 1-line English word "Let's talk". They sit right in the middle of "Join / Propose" and Japanese characters, slicing them horizontally.
  - **Mobile (390x844)**:
    - `#end-section-subtitle-text`: `width: 55%` (214px), causing `け` and `ど` to break.
    - `#end-section-title`: `--font-size: 19.5vw` (`76.05px`).
    - "企画を持ち込む・参加する" overflows screen width (`390px`): only "企画を持ち" is visible, "込む・参加する" is truncated.
- **Screenshot References**:
  - Desktop: `audit_artifacts/desktop_05_end_section.png`
  - Mobile: `audit_artifacts/mobile_05_end_section.png`

---

### 6. Section 6: `#footer-section`
- **DOM Selectors**: `#footer-contact-address`, `.footer-socials-line`, `#footer-newsletter-header`, `.footer-newsletter-line`, `#footer-bottom-copyright`
- **Measured Metrics**:
  - **Desktop (1920x1080)**:
    - `#footer-contact-address`: `fontSize: 24px`, `lineHeight: 33.6px`. Multi-line Japanese text (`草AI同盟（草野球のように集まりAIを遊ぶ）`) causes height overflow, pushing the bottom email line into `overflow: hidden` where it is sliced off.
    - `#footer-bottom-copyright`: `scrollHeight: 44px` vs `clientHeight: 22px`. Text is sliced horizontally at the baseline.
    - `.footer-newsletter-line`: `fontSize: 64.8px`, `lineHeight: 74.52px`.
  - **Mobile (390x844)**:
    - **Column Collision**: Left address column (`width: 200px`) and right socials column (`left: 202px`) smash together.
    - Long address line `草AI同盟（草野球のように...` collides directly into `Twitter / X`.
    - Both enquiry and business email addresses clip horizontally at screen right.
- **Screenshot References**:
  - Desktop: `audit_artifacts/desktop_06_footer_section.png`
  - Mobile: `audit_artifacts/mobile_06_footer_section.png`

---

## Recommended Exact CSS Rules

```css
/* ==============================================================
   AIueo LP Typography & Layout Overrides
   ============================================================== */

/* --- Section 1: Hero --- */
#home-hero-title {
  font-size: 2.1vw !important; /* was 2.5vw, allows balanced 2-line or clean 3-line wrap */
  line-height: 1.2 !important;
  grid-column: 3 / span 7 !important; /* expands width from 5 cols to 7 cols */
}
@media (max-width: 812px) {
  #home-hero-title {
    font-size: 5.2vw !important; /* was 6vw, prevents breaking 'どうですか' */
    line-height: 1.25 !important;
    grid-column: 1 / span 6 !important;
    word-break: keep-all !important;
    overflow-wrap: anywhere !important;
  }
}

/* --- Section 2: Reel --- */
#home-reel-title {
  font-size: 6.5vw !important; /* was 10vw, prevents 2688px overflow */
  letter-spacing: -0.01em !important;
  line-height: 1.05 !important;
}
#home-reel-desc {
  font-size: clamp(1rem, 1.25vw, 1.35rem) !important; /* was 1em/28.8px */
  line-height: 1.7 !important;
}
@media (max-width: 812px) {
  #home-reel-title {
    font-size: 10.5vw !important; /* was 13.8vw/20vw */
    line-height: 1.15 !important;
    margin-bottom: 0.8em !important;
  }
  #home-reel-desc {
    font-size: 0.95rem !important;
    line-height: 1.75 !important;
  }
}

/* --- Section 3: Featured Initiatives & Players --- */
#home-featured-title-wrapper {
  font-size: 6.2vw !important; /* was 8vw, prevents 'Active Initiat•' clipping */
}
#home-featured-disclaimer {
  line-height: 1.6 !important;
  overflow: visible !important;
}
.project-item-line-2 {
  font-size: clamp(1.4rem, 2.2vw, 2.6rem) !important; /* was 3vw (57.6px) */
  height: 1.3em !important;
  overflow: visible !important;
}
@media (max-width: 812px) {
  #home-featured-title-wrapper {
    font-size: 12vw !important; /* was 15vw */
  }
  .project-item-line-2 {
    font-size: 5.2vw !important; /* was 6.5vw */
    height: auto !important;
  }
}

/* --- Section 4: Goal & Guidelines --- */
#home-goal,
#home-goal-context {
  color: #ffffff !important; /* FIXES CRITICAL BLACK-ON-BLACK INVISIBILITY BUG */
}
#home-goal-title {
  font-size: 4.5vw !important; /* was 8vw (153.6px) */
  line-height: 1.15 !important;
  width: auto !important;
  max-width: 90% !important;
  margin-top: 1.2em !important;
  color: #ffffff !important;
}
#home-goal-texts {
  font-size: clamp(1rem, 1.15vw, 1.25rem) !important;
  line-height: 1.8 !important;
  color: rgba(255, 255, 255, 0.9) !important;
}
@media (max-width: 812px) {
  #home-goal-title {
    font-size: 8.5vw !important; /* was 16vw */
    color: #ffffff !important;
  }
  #home-goal-texts {
    font-size: 0.95rem !important;
    color: rgba(255, 255, 255, 0.9) !important;
  }
}

/* --- Section 5: End Section --- */
#end-section-title-top-decoration,
#end-section-title-bottom-left-decoration,
#end-section-title-bottom-right-decoration {
  display: none !important; /* FIXES CRITICAL SLICING LINES CUTTING THROUGH CHARACTERS */
}
#end-section-title {
  --font-size: 5.5vw !important; /* was 10vw */
  line-height: 1.1 !important;
}
#end-section-subtitle {
  width: auto !important;
  max-width: 90% !important;
}
@media (max-width: 560px) {
  #end-section-title {
    --font-size: 9.5vw !important; /* was 19.5vw (76px) */
    width: 100% !important;
  }
  #end-section-subtitle {
    width: 90% !important; /* was 55% */
  }
}

/* --- Section 6: Footer Section --- */
#footer-contact-address {
  font-size: 16px !important; /* was 24px */
  line-height: 1.6 !important;
}
#footer-contact-address .footer-address-line {
  font-size: 16px !important;
  line-height: 1.6 !important;
}
#footer-enquires-link,
#footer-business-link,
#footer-enquires-header,
#footer-business-header {
  font-size: 16px !important; /* was 24px */
}
.footer-newsletter-line {
  font-size: 3.5vw !important; /* was 64.8px */
  line-height: 1.25 !important;
}
#footer-bottom,
#footer-bottom-copyright {
  overflow: visible !important;
  height: auto !important;
}
@media (max-width: 1000px) {
  #footer-middle-contact {
    display: flex !important;
    flex-direction: column !important;
    gap: 1.5em !important;
  }
  #footer-contact-address,
  #footer-contact-socials {
    grid-column: 1 / span 6 !important; /* STACKS COLUMNS TO PREVENT COLLISION */
    width: 100% !important;
    left: 0 !important;
  }
  .footer-newsletter-line {
    font-size: 7.5vw !important; /* was 47.25px */
  }
}
```
