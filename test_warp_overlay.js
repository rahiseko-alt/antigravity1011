const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Let's create an isolated test page to inspect the Warp effect directly
  await page.setContent(`
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #000; overflow: hidden; }
    #warp-canvas { position: fixed; inset: 0; width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <canvas id="warp-canvas"></canvas>
  <script>
    const canvas = document.getElementById('warp-canvas');
    const ctx = canvas.getContext('2d');
    let width, height, cx, cy;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
      cx = width / 2;
      cy = height / 2;
    }
    window.addEventListener('resize', resize);
    resize();

    // 3D Starfield particles
    const COUNT = 450;
    const stars = [];
    for (let i = 0; i < COUNT; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 3,
        y: (Math.random() - 0.5) * height * 3,
        z: Math.random() * 1500 + 50,
        origZ: Math.random() * 1500 + 50,
        speedFactor: 0.7 + Math.random() * 0.6,
        size: 0.8 + Math.random() * 1.5,
        hue: Math.random() < 0.6 ? 190 + Math.random() * 30 : (Math.random() < 0.5 ? 260 + Math.random() * 40 : 0) // cyan, violet, white
      });
    }

    // Shockwave warp rings
    const rings = [
      { z: 1200, radius: 100 },
      { z: 800, radius: 180 },
      { z: 400, radius: 260 }
    ];

    // Initial black fill
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    let startTime = null;
    const DURATION = 1800; // 1.8 seconds

    function frame(now) {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / DURATION);

      // Speed curve: starts accelerating, peaks at 0.5 - 0.8, then exit flash
      let speed;
      if (progress < 0.3) {
        speed = 10 + Math.pow(progress / 0.3, 3) * 70;
      } else if (progress < 0.75) {
        speed = 80 + Math.sin((progress - 0.3) / 0.45 * Math.PI) * 40;
      } else {
        speed = 120 * (1.0 - (progress - 0.75) / 0.25);
      }

      // Background fade & streak persistence
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';

      // Render star streaks
      const fov = 400;
      for (let i = 0; i < COUNT; i++) {
        const s = stars[i];
        s.z -= speed * s.speedFactor;
        if (s.z <= 10) {
          s.z = 1500;
          s.x = (Math.random() - 0.5) * width * 3;
          s.y = (Math.random() - 0.5) * height * 3;
        }

        const k = fov / s.z;
        const px = cx + s.x * k;
        const py = cy + s.y * k;

        // Tail position
        const tailZ = s.z + speed * 1.8;
        const tk = fov / tailZ;
        const tx = cx + s.x * tk;
        const ty = cy + s.y * tk;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const alpha = Math.min(1.0, (1500 - s.z) / 400);
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(px, py);

          let strokeColor;
          if (s.hue === 0) {
            strokeColor = \`rgba(255, 255, 255, \${alpha})\`;
          } else {
            strokeColor = \`hsla(\${s.hue}, 100%, 75%, \${alpha})\`;
          }
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = Math.max(1, s.size * k * 1.5);
          ctx.stroke();
        }
      }

      // Expanding warp rings
      for (let r of rings) {
        r.z -= speed * 1.2;
        if (r.z <= 20) r.z = 1400;
        const rk = fov / r.z;
        const radX = (width * 0.25 + r.radius) * rk;
        const radY = (height * 0.25 + r.radius) * rk;
        const rAlpha = Math.sin((r.z / 1400) * Math.PI) * 0.35 * Math.min(1.0, progress * 2);

        if (radX > 0 && rAlpha > 0) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, radX, radY, 0, 0, Math.PI * 2);
          ctx.strokeStyle = \`rgba(0, 240, 255, \${rAlpha})\`;
          ctx.lineWidth = Math.max(1, 4 * rk);
          ctx.stroke();
        }
      }

      // Center Singularity / Flare
      const flareSize = (width * 0.15) * (0.5 + (speed / 120) * 1.2);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, flareSize);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.2, 'rgba(0, 240, 255, 0.6)');
      grad.addColorStop(0.5, 'rgba(120, 60, 255, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 20, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, flareSize, 0, Math.PI * 2);
      ctx.fill();

      // Exit Flash (around progress 0.75 -> 0.9)
      if (progress >= 0.72) {
        const flashProgress = (progress - 0.72) / 0.28;
        let flashAlpha;
        if (flashProgress < 0.3) {
          flashAlpha = (flashProgress / 0.3) * 0.85;
        } else {
          flashAlpha = (1.0 - (flashProgress - 0.3) / 0.7) * 0.85;
        }
        ctx.fillStyle = \`rgba(255, 255, 255, \${flashAlpha})\`;
        ctx.fillRect(0, 0, width, height);
      }

      // Overall dissolve (fade out near end)
      if (progress >= 0.85) {
        const fade = (progress - 0.85) / 0.15;
        canvas.style.opacity = (1.0 - fade).toFixed(3);
      }

      if (progress < 1.0) {
        requestAnimationFrame(frame);
      } else {
        canvas.style.display = 'none';
        window.__warpDone = true;
      }
    }
    requestAnimationFrame(frame);
  </script>
</body>
</html>
  `);

  console.log('Rendering warp test sequence...');
  // Capture frames at different milestones:
  await new Promise(r => setTimeout(r, 200));
  await page.screenshot({ path: 'test_warp_frame_1_ignite.png' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'test_warp_frame_2_warp_speed.png' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'test_warp_frame_3_exit_flare.png' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'test_warp_frame_4_done.png' });

  await browser.close();
  console.log('Done test_warp_overlay!');
})();
