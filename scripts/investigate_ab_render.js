const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\Chrome.exe'.replace('Chrome.exe', 'chrome.exe');
const out = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\cb92c570-076e-4e99-8ce2-9b5a61751c86';

// READ-ONLY investigation: serves a different historical hoisted.js via request interception. No repo files are modified.
const variants = { good_178a34e: '178a34e', cur_HEAD: 'HEAD' };

(async () => {
  for (const [name, rev] of Object.entries(variants)) {
    const js = execSync(`git show ${rev}:_astro/hoisted.CUO_IjfL.js`, { maxBuffer: 1 << 28 });
    const browser = await puppeteer.launch({ executablePath: chromePath, headless: 'new', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.setRequestInterception(true);
    page.on('request', r => {
      if (/\/_astro\/hoisted\.CUO_IjfL\.js/.test(r.url())) r.respond({ status: 200, contentType: 'application/javascript', body: js });
      else r.continue();
    });
    const logs = [];
    page.on('console', m => { const t = m.type(); if (t === 'error' || t === 'warning' || /context|lost|WebGL|Three/i.test(m.text())) logs.push(`[${t}] ${m.text().slice(0, 200)}`); });
    page.on('pageerror', e => logs.push('[pageerror] ' + String(e).slice(0, 300)));
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => logs.push('goto: ' + e.message));
    const t0 = Date.now();
    const snap = async (label) => {
      const st = await page.evaluate(() => {
        const g = window.__goalTunnels, p = window.properties || window.__properties, sm = window.scrollManager;
        const cv = document.querySelector('canvas');
        let ctxLost = null;
        try { const gl = cv && (cv.getContext('webgl2') || cv.getContext('webgl')); ctxLost = gl ? gl.isContextLost() : 'nogl'; } catch (e) { ctxLost = 'err'; }
        return { isIntroWarp: p && p.isIntroWarp, hasStarted: p && p.hasStarted, goalActive: g && g.isActive, blackTunnelActive: g && g.isBlackTunnelActive, bloom: p && p.bloomAmount, scrollPixel: sm && sm.scrollPixel, ctxLost, canvases: document.querySelectorAll('canvas').length };
      }).catch(e => ({ err: e.message }));
      console.log(name, label, JSON.stringify(st));
      await page.screenshot({ path: path.join(out, `inv_${name}_${label}.png`) });
    };
    await new Promise(r => setTimeout(r, 14000));
    await snap('idle14s');
    for (const px of [900, 1800, 3000]) {
      await page.evaluate(p => window.scrollManager && window.scrollManager.scrollToPixel(p, true), px);
      await new Promise(r => setTimeout(r, 1500));
      await snap('sp' + px);
    }
    console.log(name, 'LOGS:', JSON.stringify(logs.slice(0, 12), null, 1));
    await browser.close();
  }
  console.log('INVESTIGATION DONE');
})();
