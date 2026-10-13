const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('[BROWSER ERROR]', msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
    console.log('[PAGE ERROR]', err.toString());
  });

  console.log('Navigating to http://localhost:3000 ...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Record preloader progress between 85 and 100
  const zoomSamples = [];
  let t90 = null;
  let t100 = null;

  const startTime = Date.now();
  let blackTunnelShot = false;
  let whiteTunnelShot = false;
  let heroLandingShot = false;

  const warpStates = [];

  while (Date.now() - startTime < 12000) {
    const state = await page.evaluate(() => {
      const p = window.__preloader;
      const props = window.__properties || (typeof properties !== 'undefined' ? properties : null);
      const gt = typeof goalTunnels !== 'undefined' ? goalTunnels : null;
      const hb = typeof homeBalloons !== 'undefined' ? homeBalloons : null;
      const efx = typeof goalTunnelEfx !== 'undefined' ? goalTunnelEfx : null;

      let digitsText = '';
      const digits = document.querySelectorAll('.preloader-percent-digit');
      digits.forEach(d => {
        const num = d.querySelector('.preloader-percent-digit-num');
        if (num) digitsText += num.innerText;
      });

      return {
        preloaderActive: p ? p.isActive : false,
        easedPercent: p ? p.easedPercent : null,
        zoomProgress: p ? p.zoomProgress : null,
        digitsText,
        isIntroWarp: props ? props.isIntroWarp : false,
        hasStarted: props ? props.hasStarted : false,
        bloomAmount: props ? props.bloomAmount : null,
        bloomSaturation: props ? props.bloomSaturation : null,
        cameraDollyZoomFovOffset: props ? props.cameraDollyZoomFovOffset : null,
        bgColorHex: props ? props.bgColorHex : null,
        gtActive: gt ? gt.isActive : false,
        gtBlackTunnelActive: gt ? gt.isBlackTunnelActive : false,
        gtWhiteTunnelActive: gt ? gt.isWhiteTunnelActive : false,
        gtBlackRatio: gt ? gt.blackTunnelRatio : null,
        gtWhiteRatio: gt ? gt.whiteTunnelRatio : null,
        efxActive: efx ? efx.isActive : false,
        efxPosZ: efx && efx.offsetPostion ? efx.offsetPostion.z : null,
        efxRotZ: efx && efx.offsetRotation ? efx.offsetRotation.z : null,
        hbActive: hb ? hb.isActive : false,
        scrollActive: typeof scrollManager !== 'undefined' ? scrollManager.isActive : false
      };
    });

    const now = Date.now();

    if (state.easedPercent != null) {
      if (state.easedPercent >= 88 && state.easedPercent <= 100) {
        zoomSamples.push({ time: now - startTime, easedPercent: state.easedPercent, digits: state.digitsText, zoomProgress: state.zoomProgress });
      }
      if (state.easedPercent >= 90 && t90 === null) {
        t90 = now;
      }
      if (state.easedPercent >= 99.9 && t100 === null) {
        t100 = now;
        await page.screenshot({ path: 'verify_fix_1_zoom_100.png' });
        console.log('Captured verify_fix_1_zoom_100.png at 100% countdown');
      }
    }

    if (state.isIntroWarp) {
      warpStates.push({ time: now - startTime, ...state });

      // Capture black tunnel frame
      if (state.gtBlackTunnelActive && !blackTunnelShot && state.gtBlackRatio > 0.3) {
        blackTunnelShot = true;
        await page.screenshot({ path: 'verify_fix_2_black_tunnel.png' });
        console.log('Captured verify_fix_2_black_tunnel.png with DollyZoomOffset:', state.cameraDollyZoomFovOffset, 'Bloom:', state.bloomAmount);
      }

      // Capture white tunnel frame
      if (state.gtWhiteTunnelActive && !whiteTunnelShot && state.gtWhiteRatio > 0.2) {
        whiteTunnelShot = true;
        await page.screenshot({ path: 'verify_fix_3_white_tunnel_burst.png' });
        console.log('Captured verify_fix_3_white_tunnel_burst.png with DollyZoomOffset:', state.cameraDollyZoomFovOffset, 'Bloom:', state.bloomAmount);
      }
    }

    // Capture hero landing
    if (state.hasStarted && !state.isIntroWarp && state.hbActive && !heroLandingShot) {
      heroLandingShot = true;
      await new Promise(r => setTimeout(r, 600)); // wait for hero settling
      await page.screenshot({ path: 'verify_fix_4_hero_landing.png' });
      console.log('Captured verify_fix_4_hero_landing.png with HomeBalloons active and scroll unlocked:', state.scrollActive);
      break;
    }

    await new Promise(r => setTimeout(r, 30));
  }

  const duration90to100 = (t90 && t100) ? (t100 - t90) / 1000 : null;
  console.log('Duration from 90 to 100:', duration90to100 ? `${duration90to100.toFixed(2)}s` : 'N/A');

  const report = {
    duration90to100Seconds: duration90to100,
    zoomSamplesCount: zoomSamples.length,
    zoomSamplesPreview: zoomSamples.slice(0, 15),
    warpStatesCount: warpStates.length,
    blackTunnelSamples: warpStates.filter(s => s.gtBlackTunnelActive).map(s => ({
      time: s.time,
      blackRatio: s.gtBlackRatio,
      dollyOffset: s.cameraDollyZoomFovOffset,
      bloomAmount: s.bloomAmount,
      bloomSaturation: s.bloomSaturation,
      efxPosZ: s.efxPosZ,
      efxRotZ: s.efxRotZ
    })).slice(0, 8),
    whiteTunnelSamples: warpStates.filter(s => s.gtWhiteTunnelActive).map(s => ({
      time: s.time,
      whiteRatio: s.gtWhiteRatio,
      dollyOffset: s.cameraDollyZoomFovOffset,
      bloomAmount: s.bloomAmount,
      bloomSaturation: s.bloomSaturation,
      efxPosZ: s.efxPosZ,
      efxRotZ: s.efxRotZ
    })).slice(0, 8),
    consoleErrors
  };

  fs.writeFileSync('exact_warp_fixes_verification_report.json', JSON.stringify(report, null, 2), 'utf8');
  console.log('Saved exact_warp_fixes_verification_report.json');

  await browser.close();
})();
