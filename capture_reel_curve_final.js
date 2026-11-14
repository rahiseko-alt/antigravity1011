const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== Final Detailed Inspection of #home-reel Curve Line ===');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const executablePath = fs.existsSync(chromePath) ? chromePath : edgePath;

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080'
    ]
  });

  const fullReport = {
    webglCanvas: {},
    domLayering: {},
    threeJsObjects: {},
    desktopSequence: [],
    mobileSequence: []
  };

  async function waitForPageReady(page) {
    for (let i = 0; i < 60; i++) {
      const ready = await page.evaluate(() => {
        return window.properties && window.properties.hasStarted && !window.properties.isIntroWarp;
      }).catch(() => false);
      if (ready) break;
      await sleep(200);
    }
    await sleep(600);
  }

  // ----------------------------------------------------------------
  // 1. DESKTOP (1920x1080)
  // ----------------------------------------------------------------
  console.log('\n[1/2] Processing Desktop (1920x1080)...');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(desktopPage);

  // Extract DOM layering info
  fullReport.domLayering = await desktopPage.evaluate(() => {
    function getLayer(id) {
      const el = document.getElementById(id);
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        id,
        tagName: el.tagName,
        position: s.position,
        zIndex: s.zIndex,
        mixBlendMode: s.mixBlendMode,
        opacity: s.opacity,
        pointerEvents: s.pointerEvents,
        display: s.display
      };
    }
    return {
      canvas: getLayer('canvas'),
      ui: getLayer('ui'),
      pageContainer: getLayer('page-container'),
      homeReel: getLayer('home-reel')
    };
  });

  // Extract Three.js Object details
  fullReport.threeJsObjects = await desktopPage.evaluate(() => {
    let lineMesh = null;
    let circleMesh = null;
    let lineObj = null;

    if (window.homePage && window.homePage.preUfxContainer) {
      window.homePage.preUfxContainer.traverse(obj => {
        if (obj.material && obj.material.uniforms) {
          if (obj.material.uniforms.u_color0 && obj.geometry && obj.geometry.attributes && obj.geometry.attributes.CP) {
            lineMesh = obj;
            lineObj = obj.parent ? obj.parent.parent : null;
          } else if (obj.geometry && obj.geometry.type === 'PlaneGeometry' && obj.material.uniforms.u_ao) {
            circleMesh = obj;
          }
        }
      });
    }

    const mat = lineMesh ? lineMesh.material : null;
    const geom = lineMesh ? lineMesh.geometry : null;
    const u = mat && mat.uniforms ? mat.uniforms : {};

    const circleMat = circleMesh ? circleMesh.material : null;
    const cu = circleMat && circleMat.uniforms ? circleMat.uniforms : {};

    return {
      rendererCanvas: {
        id: properties.canvas ? properties.canvas.id : null,
        width: properties.canvas ? properties.canvas.width : null,
        height: properties.canvas ? properties.canvas.height : null
      },
      visualsStages: window.visuals && window.visuals.stage3DList ? 
        window.visuals.stage3DList.map(s => ({
          name: s.constructor.name,
          isActive: s.isActive
        })) : [],
      currentStage3D: window.visuals && window.visuals.currentStage3D ? window.visuals.currentStage3D.constructor.name : null,
      parentHierarchy: [
        "Scene (preUfx.scene)",
        "Object3D (homePage.preUfxContainer)",
        "Object3D (lineVisual.container)",
        "Object3D (lineVisual.innerContainer)",
        "Mesh (lineVisual.mesh) & Mesh (lineVisual.circle)"
      ],
      lineMesh: {
        constructor: lineMesh ? lineMesh.constructor.name : null,
        renderOrder: lineMesh ? lineMesh.renderOrder : null,
        frustumCulled: lineMesh ? lineMesh.frustumCulled : null,
        geometry: geom ? {
          type: geom.type,
          attributes: Object.keys(geom.attributes),
          vertexCount: geom.attributes.position ? geom.attributes.position.count : 0,
          cpCount: geom.attributes.CP ? geom.attributes.CP.count : 0,
          cdCount: geom.attributes.Cd ? geom.attributes.Cd.count : 0
        } : null,
        material: mat ? {
          type: mat.type,
          transparent: mat.transparent,
          depthTest: mat.depthTest,
          depthWrite: mat.depthWrite,
          defines: mat.defines,
          derivatives: mat.extensions ? mat.extensions.derivatives : false,
          color0_hex: u.u_color0 ? '#' + u.u_color0.value.getHexString() : null,
          color0_rgb: u.u_color0 ? { r: u.u_color0.value.r, g: u.u_color0.value.g, b: u.u_color0.value.b } : null,
          color1_hex: u.u_color1 ? '#' + u.u_color1.value.getHexString() : null,
          color1_rgb: u.u_color1 ? { r: u.u_color1.value.r, g: u.u_color1.value.g, b: u.u_color1.value.b } : null,
          radiusUniform: u.u_radius ? u.u_radius.value : null,
          aoThreshold: u.u_aoThreshold ? u.u_aoThreshold.value : null,
          margin: u.u_margin ? { x: u.u_margin.value.x, y: u.u_margin.value.y } : null,
          aspect: u.u_aspect ? { x: u.u_aspect.value.x, y: u.u_aspect.value.y } : null
        } : null
      },
      headCircleMesh: {
        constructor: circleMesh ? circleMesh.constructor.name : null,
        renderOrder: circleMesh ? circleMesh.renderOrder : null,
        geometry: circleMesh && circleMesh.geometry ? {
          type: circleMesh.geometry.type,
          parameters: circleMesh.geometry.parameters
        } : null,
        material: circleMat ? {
          type: circleMat.type,
          transparent: circleMat.transparent,
          depthTest: circleMat.depthTest,
          color0_hex: cu.u_color0 ? '#' + cu.u_color0.value.getHexString() : null,
          color1_hex: cu.u_color1 ? '#' + cu.u_color1.value.getHexString() : null
        } : null
      }
    };
  });

  const desktopScrollSteps = [
    { name: 'desktop_1_entry', scrollPixel: 700, desc: 'Reel top entering screen (showRatio ~0.03)' },
    { name: 'desktop_2_mid_curve', scrollPixel: 1100, desc: 'Reel header visible, curve drawing (showRatio ~0.20)' },
    { name: 'desktop_3_half_drawn', scrollPixel: 1450, desc: 'Curve extending across reel content (showRatio ~0.53)' },
    { name: 'desktop_4_fully_settled', scrollPixel: 1850, desc: 'Curve fully drawn across reel (showRatio ~0.92)' }
  ];

  for (const step of desktopScrollSteps) {
    console.log(`Setting desktop scrollPixel = ${step.scrollPixel} (${step.desc})...`);
    await desktopPage.evaluate((px) => {
      scrollManager.scrollPixel = px;
    }, step.scrollPixel);
    await sleep(250);

    const state = await desktopPage.evaluate(() => {
      let lineMesh = null;
      let circleMesh = null;
      let container = null;
      if (window.homePage && window.homePage.preUfxContainer) {
        window.homePage.preUfxContainer.traverse(obj => {
          if (obj.material && obj.material.uniforms) {
            if (obj.material.uniforms.u_color0 && obj.geometry && obj.geometry.attributes && obj.geometry.attributes.CP) {
              lineMesh = obj;
              container = obj.parent ? obj.parent.parent : null;
            } else if (obj.geometry && obj.geometry.type === 'PlaneGeometry' && obj.material.uniforms.u_ao) {
              circleMesh = obj;
            }
          }
        });
      }
      const reel = document.getElementById('home-reel');
      const r = reel ? reel.getBoundingClientRect() : null;
      return {
        scrollPixel: scrollManager.scrollPixel,
        reelRect: { top: r ? r.top : null, height: r ? r.height : null },
        containerVisible: container ? container.visible : null,
        showRatio: lineMesh ? lineMesh.material.uniforms.u_showRatio.value : null,
        radius: lineMesh ? lineMesh.material.uniforms.u_radius.value : null,
        scrollYUniform: lineMesh ? lineMesh.material.uniforms.u_scrollY.value : null,
        circlePos: circleMesh ? [circleMesh.position.x, circleMesh.position.y, circleMesh.position.z] : null,
        circleAo: circleMesh ? circleMesh.material.uniforms.u_ao.value : null,
        circleMixRatio: circleMesh ? circleMesh.material.uniforms.u_mixRatio.value : null
      };
    });

    const screenshotPath = `${step.name}.png`;
    await desktopPage.screenshot({ path: screenshotPath });
    console.log(`-> Saved screenshot: ${screenshotPath}`);

    fullReport.desktopSequence.push({
      step: step.name,
      description: step.desc,
      screenshot: screenshotPath,
      state
    });
  }

  await desktopPage.close();

  // ----------------------------------------------------------------
  // 2. MOBILE (390x844)
  // ----------------------------------------------------------------
  console.log('\n[2/2] Processing Mobile (390x844)...');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(mobilePage);

  const mobileScrollSteps = [
    { name: 'mobile_1_entry', scrollPixel: 550, desc: 'Mobile reel entering screen (showRatio ~0.03)' },
    { name: 'mobile_2_mid_curve', scrollPixel: 850, desc: 'Mobile curve drawing (showRatio ~0.20)' },
    { name: 'mobile_3_half_drawn', scrollPixel: 1100, desc: 'Mobile curve half drawn (showRatio ~0.48)' },
    { name: 'mobile_4_fully_settled', scrollPixel: 1400, desc: 'Mobile curve fully drawn (showRatio ~0.87)' }
  ];

  for (const step of mobileScrollSteps) {
    console.log(`Setting mobile scrollPixel = ${step.scrollPixel} (${step.desc})...`);
    await mobilePage.evaluate((px) => {
      scrollManager.scrollPixel = px;
    }, step.scrollPixel);
    await sleep(250);

    const state = await mobilePage.evaluate(() => {
      let lineMesh = null;
      let circleMesh = null;
      let container = null;
      if (window.homePage && window.homePage.preUfxContainer) {
        window.homePage.preUfxContainer.traverse(obj => {
          if (obj.material && obj.material.uniforms) {
            if (obj.material.uniforms.u_color0 && obj.geometry && obj.geometry.attributes && obj.geometry.attributes.CP) {
              lineMesh = obj;
              container = obj.parent ? obj.parent.parent : null;
            } else if (obj.geometry && obj.geometry.type === 'PlaneGeometry' && obj.material.uniforms.u_ao) {
              circleMesh = obj;
            }
          }
        });
      }
      const reel = document.getElementById('home-reel');
      const r = reel ? reel.getBoundingClientRect() : null;
      return {
        scrollPixel: scrollManager.scrollPixel,
        reelRect: { top: r ? r.top : null, height: r ? r.height : null },
        containerVisible: container ? container.visible : null,
        showRatio: lineMesh ? lineMesh.material.uniforms.u_showRatio.value : null,
        radius: lineMesh ? lineMesh.material.uniforms.u_radius.value : null,
        scrollYUniform: lineMesh ? lineMesh.material.uniforms.u_scrollY.value : null,
        circlePos: circleMesh ? [circleMesh.position.x, circleMesh.position.y, circleMesh.position.z] : null,
        circleAo: circleMesh ? circleMesh.material.uniforms.u_ao.value : null,
        circleMixRatio: circleMesh ? circleMesh.material.uniforms.u_mixRatio.value : null
      };
    });

    const screenshotPath = `${step.name}.png`;
    await mobilePage.screenshot({ path: screenshotPath });
    console.log(`-> Saved screenshot: ${screenshotPath}`);

    fullReport.mobileSequence.push({
      step: step.name,
      description: step.desc,
      screenshot: screenshotPath,
      state
    });
  }

  await mobilePage.close();
  await browser.close();

  fs.writeFileSync('reel_curve_final_report.json', JSON.stringify(fullReport, null, 2), 'utf8');
  console.log('\n=== Full Final Report Saved to reel_curve_final_report.json ===');
})();
