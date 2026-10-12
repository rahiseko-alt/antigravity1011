/**
 * Opening Warp Overlay (Plan A)
 * Cinematic hyperspace warp zone transition from Preloader (100%) into #home-hero scene.
 */
(function() {
  let isWarping = false;
  let hasTriggered = false;
  let animId = null;

  function initWarp() {
    let canvas = document.getElementById('warp-overlay');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'warp-overlay';
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:250;pointer-events:none;display:none;opacity:1;';
      const preloader = document.getElementById('preloader');
      if (preloader && preloader.parentNode) {
        preloader.parentNode.insertBefore(canvas, preloader);
      } else {
        document.body.appendChild(canvas);
      }
    }

    const ctx = canvas.getContext('2d');
    let width = 0, height = 0, cx = 0, cy = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = Math.floor(window.innerWidth * dpr);
      height = canvas.height = Math.floor(window.innerHeight * dpr);
      cx = width / 2;
      cy = height / 2;
    }
    window.addEventListener('resize', resize);
    resize();

    // 3D Particles for Hyperspace Starfield
    const STAR_COUNT = 550;
    const stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 3000,
        z: Math.random() * 1600 + 40,
        origZ: Math.random() * 1600 + 40,
        speedFactor: 0.75 + Math.random() * 0.7,
        size: 0.7 + Math.random() * 1.6,
        hue: Math.random() < 0.65 ? 190 + Math.random() * 25 : (Math.random() < 0.6 ? 265 + Math.random() * 35 : 0) // Cyan, Neon Violet, Bright White
      });
    }

    // Hyperspace shockwave rings
    const rings = [
      { z: 1400, radius: 120 },
      { z: 1050, radius: 180 },
      { z: 700, radius: 240 },
      { z: 350, radius: 320 }
    ];

    function preventScroll(e) {
      if (isWarping) {
        e.preventDefault();
        e.stopPropagation();
      }
    }

    function triggerWarp() {
      if (hasTriggered) return;
      hasTriggered = true;
      isWarping = true;

      // Lock scroll briefly during warp transition
      window.addEventListener('wheel', preventScroll, { passive: false });
      window.addEventListener('touchmove', preventScroll, { passive: false });
      if (window.scrollManager) {
        window.scrollManager.targetY = 0;
        window.scrollManager.scrollY = 0;
      }

      // Hide preloader digits smoothly
      const digits = document.getElementById('preloader-percent-digits');
      if (digits) {
        digits.style.transition = 'opacity 0.25s ease-out';
        digits.style.opacity = '0';
      }

      resize();
      canvas.style.display = 'block';
      canvas.style.opacity = '1';
      canvas.style.pointerEvents = 'none';

      // Pre-fill solid pitch black space
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      let startTime = null;
      const DURATION = 1800; // 1.8 seconds of cinematic warp

      function loop(now) {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(1.0, elapsed / DURATION);

        // Exponential acceleration curve -> max warp cruise -> deceleration
        let speed;
        if (progress < 0.3) {
          speed = 8 + Math.pow(progress / 0.3, 3) * 85;
        } else if (progress < 0.75) {
          speed = 95 + Math.sin((progress - 0.3) / 0.45 * Math.PI) * 45;
        } else {
          speed = 140 * Math.max(0, 1.0 - (progress - 0.75) / 0.25);
        }

        // Space trail persistence
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'lighter';

        const fov = 420;

        // Render Hyperspace Star Streaks
        for (let i = 0; i < STAR_COUNT; i++) {
          const s = stars[i];
          s.z -= speed * s.speedFactor;
          if (s.z <= 10) {
            s.z = 1600;
            s.x = (Math.random() - 0.5) * 3000;
            s.y = (Math.random() - 0.5) * 3000;
          }

          const k = fov / s.z;
          const px = cx + s.x * k;
          const py = cy + s.y * k;

          // Tail based on velocity
          const tailZ = s.z + speed * 2.2;
          const tk = fov / tailZ;
          const tx = cx + s.x * tk;
          const ty = cy + s.y * tk;

          if (px >= -50 && px <= width + 50 && py >= -50 && py <= height + 50) {
            const alpha = Math.min(1.0, (1600 - s.z) / 450);
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(px, py);

            let strokeColor;
            if (s.hue === 0) {
              strokeColor = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
            } else {
              strokeColor = `hsla(${s.hue}, 100%, 75%, ${alpha.toFixed(3)})`;
            }
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = Math.max(1, s.size * k * 1.8);
            ctx.stroke();
          }
        }

        // Expanding Hyperspace Shockwave Rings
        for (let r of rings) {
          r.z -= speed * 1.4;
          if (r.z <= 15) r.z = 1400;
          const rk = fov / r.z;
          const radX = (width * 0.28 + r.radius) * rk;
          const radY = (height * 0.28 + r.radius) * rk;
          const rAlpha = Math.sin((r.z / 1400) * Math.PI) * 0.45 * Math.min(1.0, progress * 2.5);

          if (radX > 0 && rAlpha > 0) {
            ctx.beginPath();
            ctx.ellipse(cx, cy, radX, radY, 0, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 240, 255, ${rAlpha.toFixed(3)})`;
            ctx.lineWidth = Math.max(1.5, 4.5 * rk);
            ctx.stroke();
          }
        }

        // Center Vanishing Point Flare / Singularity
        const flareScale = 0.5 + (speed / 140) * 1.2;
        const flareSize = Math.min(width, height) * 0.3 * flareScale;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, flareSize);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        grad.addColorStop(0.2, 'rgba(0, 245, 255, 0.7)');
        grad.addColorStop(0.5, 'rgba(125, 65, 255, 0.3)');
        grad.addColorStop(1, 'rgba(0, 0, 20, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, flareSize, 0, Math.PI * 2);
        ctx.fill();

        // Exit Emergence Flash (smooth peak around progress 0.72 - 0.88)
        if (progress >= 0.70 && progress <= 0.90) {
          const flashProgress = (progress - 0.70) / 0.20;
          const flashAlpha = Math.sin(flashProgress * Math.PI) * 0.82;
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha.toFixed(3)})`;
          ctx.fillRect(0, 0, width, height);
        }

        // Smooth dissolve into the Hero scene
        if (progress >= 0.80) {
          const dissolve = (progress - 0.80) / 0.20;
          canvas.style.opacity = Math.max(0, 1.0 - dissolve).toFixed(3);
        }

        // Keep virtual scroll locked at 0 during warp
        if (window.scrollManager) {
          window.scrollManager.targetY = 0;
          window.scrollManager.scrollY = 0;
        }

        if (progress < 1.0) {
          animId = requestAnimationFrame(loop);
        } else {
          // Warp sequence finished cleanly!
          isWarping = false;
          canvas.style.display = 'none';
          canvas.style.opacity = '0';
          window.removeEventListener('wheel', preventScroll);
          window.removeEventListener('touchmove', preventScroll);
          
          // Ensure Hero scene is fully clean and responsive
          const preloaderEl = document.getElementById('preloader');
          if (preloaderEl) preloaderEl.style.display = 'none';

          window.dispatchEvent(new CustomEvent('warp:completed'));
          console.log('[OpeningWarp] Warp sequence complete -> Hero unveiled successfully!');
        }
      }

      animId = requestAnimationFrame(loop);
    }

    // Expose global trigger
    window.__startOpeningWarp = triggerWarp;

    // Detect preloader 100% or start state automatically
    function checkState() {
      if (hasTriggered) return;
      const p = window.__properties;
      if (p && p.hasStarted) {
        triggerWarp();
        return;
      }
      // Check preloader digits
      const digits = document.getElementById('preloader-percent-digits');
      if (digits) {
        const text = digits.innerText.replace(/\s+/g, '');
        if (text === '100') {
          triggerWarp();
          return;
        }
      }
      requestAnimationFrame(checkState);
    }
    requestAnimationFrame(checkState);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWarp);
  } else {
    initWarp();
  }
})();
