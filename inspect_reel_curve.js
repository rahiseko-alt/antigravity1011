const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('=== Inspecting #home-reel Curve Line ===');
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
      '--disable-setuid-sandbox'
    ]
  });

  const inspectResults = {
    desktop: {},
    mobile: {},
    threeJsDetails: {}
  };

  // Helper function to wait for page ready
  async function waitForPageReady(page) {
    for (let i = 0; i < 50; i++) {
      const ready = await page.evaluate(() => {
        return window.properties && window.properties.hasStarted && !window.properties.isIntroWarp;
      }).catch(() => false);
      if (ready) break;
      await sleep(200);
    }
    await sleep(1000);
  }

  // -------------------------------------------------------------
  // DESKTOP RUN (1920 x 1080)
  // -------------------------------------------------------------
  console.log('\n--- Running Desktop Inspection (1920x1080) ---');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await desktopPage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(desktopPage);

  // Deep inspect Three.js objects for the line
  const threeDetails = await desktopPage.evaluate(() => {
    // 1. Locate the line mesh in homePage.preUfxContainer
    let lineObj = null;
    let lineMesh = null;
    let circleMesh = null;

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

    // Inspect visuals and scene
    const visualsStages = window.visuals && window.visuals.stage3DList ? 
      window.visuals.stage3DList.map(s => ({
        name: s.constructor ? s.constructor.name : 'Unknown',
        type: s.type,
        isActive: s.isActive
      })) : [];

    const details = {
      isInsideThreeJsCanvas: true,
      canvasElement: {
        id: properties.canvas ? properties.canvas.id : null,
        width: properties.canvas ? properties.canvas.width : null,
        height: properties.canvas ? properties.canvas.height : null
      },
      visualsStages,
      currentStage3D: window.visuals && window.visuals.currentStage3D ? window.visuals.currentStage3D.constructor.name : null,
      parentHierarchy: []
    };

    if (lineMesh) {
      let curr = lineMesh;
      while (curr) {
        details.parentHierarchy.push({
          type: curr.type,
          constructor: curr.constructor.name,
          name: curr.name || '(unnamed)',
          visible: curr.visible,
          renderOrder: curr.renderOrder
        });
        curr = curr.parent;
      }

      const geom = lineMesh.geometry;
      const mat = lineMesh.material;
      const u = mat.uniforms || {};

      details.lineMesh = {
        name: lineMesh.name || 'homeReelLineMesh',
        type: lineMesh.type,
        constructor: lineMesh.constructor.name,
        renderOrder: lineMesh.renderOrder,
        frustumCulled: lineMesh.frustumCulled,
        geometry: {
          type: geom.type,
          attributes: Object.keys(geom.attributes),
          vertexCount: geom.attributes.position ? geom.attributes.position.count : 0,
          hasCP: !!geom.attributes.CP,
          hasCd: !!geom.attributes.Cd,
          hasPosition: !!geom.attributes.position
        },
        material: {
          type: mat.type,
          transparent: mat.transparent,
          depthTest: mat.depthTest,
          depthWrite: mat.depthWrite,
          defines: mat.defines,
          derivatives: mat.extensions ? mat.extensions.derivatives : false,
          color0: u.u_color0 ? '#' + u.u_color0.value.getHexString() : null,
          color1: u.u_color1 ? '#' + u.u_color1.value.getHexString() : null,
          showRatio: u.u_showRatio ? u.u_showRatio.value : null,
          radius: u.u_radius ? u.u_radius.value : null,
          aoThreshold: u.u_aoThreshold ? u.u_aoThreshold.value : null,
          margin: u.u_margin ? { x: u.u_margin.value.x, y: u.u_margin.value.y } : null,
          aspect: u.u_aspect ? { x: u.u_aspect.value.x, y: u.u_aspect.value.y } : null,
          scrollY: u.u_scrollY ? u.u_scrollY.value : null
        }
      };
    }

    if (circleMesh) {
      const mat = circleMesh.material;
      const u = mat.uniforms || {};
      details.headCircleMesh = {
        name: circleMesh.name || 'homeReelLineHeadCircle',
        type: circleMesh.type,
        constructor: circleMesh.constructor.name,
        renderOrder: circleMesh.renderOrder,
        material: {
          type: mat.type,
          transparent: mat.transparent,
          depthTest: mat.depthTest,
          color0: u.u_color0 ? '#' + u.u_color0.value.getHexString() : null,
          color1: u.u_color1 ? '#' + u.u_color1.value.getHexString() : null,
          ao: u.u_ao ? u.u_ao.value : null,
          mixRatio: u.u_mixRatio ? u.u_mixRatio.value : null
        }
      };
    }

    return details;
  });

  inspectResults.threeJsDetails = threeDetails;
  console.log('Three.js Details:', JSON.stringify(threeDetails, null, 2));

  // Scroll Desktop in increments to see the curve line animation
  console.log('Scrolling Desktop across #home-reel...');
  
  // Find reel offset
  const reelTop = await desktopPage.evaluate(() => {
    const el = document.getElementById('home-reel');
    return el ? el.offsetTop : 1000;
  });
  console.log('Reel offsetTop:', reelTop);

  // Position 1: Approaching #home-reel (top of reel enters)
  await desktopPage.evaluate((targetY) => window.scrollTo(0, targetY * 0.3), reelTop);
  await sleep(600);
  await desktopPage.screenshot({ path: 'desktop_reel_scroll_01_approach.png' });
  const pos1State = await desktopPage.evaluate(dumpLineState);

  // Position 2: Middle of #home-reel (curve growing)
  await desktopPage.evaluate((targetY) => window.scrollTo(0, targetY * 0.65), reelTop);
  await sleep(600);
  await desktopPage.screenshot({ path: 'desktop_reel_scroll_02_mid.png' });
  const pos2State = await desktopPage.evaluate(dumpLineState);

  // Position 3: Full view of #home-reel (curve fully drawn)
  await desktopPage.evaluate((targetY) => window.scrollTo(0, targetY * 0.95), reelTop);
  await sleep(600);
  await desktopPage.screenshot({ path: 'desktop_reel_scroll_03_settled.png' });
  const pos3State = await desktopPage.evaluate(dumpLineState);

  // Position 4: Scrolled further down inside #home-reel
  await desktopPage.evaluate((targetY) => window.scrollTo(0, targetY + 300), reelTop);
  await sleep(600);
  await desktopPage.screenshot({ path: 'desktop_reel_scroll_04_deep.png' });
  const pos4State = await desktopPage.evaluate(dumpLineState);

  inspectResults.desktop = {
    reelTop,
    positions: {
      approach: pos1State,
      mid: pos2State,
      settled: pos3State,
      deep: pos4State
    }
  };

  await desktopPage.close();

  // -------------------------------------------------------------
  // MOBILE RUN (390 x 844)
  // -------------------------------------------------------------
  console.log('\n--- Running Mobile Inspection (390x844) ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(mobilePage);

  const mobileReelTop = await mobilePage.evaluate(() => {
    const el = document.getElementById('home-reel');
    return el ? el.offsetTop : 800;
  });
  console.log('Mobile Reel offsetTop:', mobileReelTop);

  // Position 1: Approaching
  await mobilePage.evaluate((targetY) => window.scrollTo(0, targetY * 0.35), mobileReelTop);
  await sleep(600);
  await mobilePage.screenshot({ path: 'mobile_reel_scroll_01_approach.png' });
  const mobilePos1 = await mobilePage.evaluate(dumpLineState);

  // Position 2: Mid
  await mobilePage.evaluate((targetY) => window.scrollTo(0, targetY * 0.7), mobileReelTop);
  await sleep(600);
  await mobilePage.screenshot({ path: 'mobile_reel_scroll_02_mid.png' });
  const mobilePos2 = await mobilePage.evaluate(dumpLineState);

  // Position 3: Settled
  await mobilePage.evaluate((targetY) => window.scrollTo(0, targetY * 1.0), mobileReelTop);
  await sleep(600);
  await mobilePage.screenshot({ path: 'mobile_reel_scroll_03_settled.png' });
  const mobilePos3 = await mobilePage.evaluate(dumpLineState);

  // Position 4: Deep
  await mobilePage.evaluate((targetY) => window.scrollTo(0, targetY + 250), mobileReelTop);
  await sleep(600);
  await mobilePage.screenshot({ path: 'mobile_reel_scroll_04_deep.png' });
  const mobilePos4 = await mobilePage.evaluate(dumpLineState);

  inspectResults.mobile = {
    reelTop: mobileReelTop,
    positions: {
      approach: mobilePos1,
      mid: mobilePos2,
      settled: mobilePos3,
      deep: mobilePos4
    }
  };

  await mobilePage.close();
  await browser.close();

  fs.writeFileSync('reel_curve_inspection_report.json', JSON.stringify(inspectResults, null, 2), 'utf8');
  console.log('\nInspection complete! Saved to reel_curve_inspection_report.json');

  function dumpLineState() {
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
    const reelRect = reel ? reel.getBoundingClientRect() : null;

    return {
      scrollY: window.scrollY,
      reelBoundingTop: reelRect ? reelRect.top : null,
      reelBoundingBottom: reelRect ? reelRect.bottom : null,
      containerVisible: container ? container.visible : null,
      lineMeshVisible: lineMesh ? lineMesh.visible : null,
      showRatio: lineMesh && lineMesh.material && lineMesh.material.uniforms.u_showRatio ? lineMesh.material.uniforms.u_showRatio.value : null,
      radius: lineMesh && lineMesh.material && lineMesh.material.uniforms.u_radius ? lineMesh.material.uniforms.u_radius.value : null,
      circlePosition: circleMesh ? [circleMesh.position.x, circleMesh.position.y, circleMesh.position.z] : null,
      circleAo: circleMesh && circleMesh.material.uniforms.u_ao ? circleMesh.material.uniforms.u_ao.value : null,
      circleMixRatio: circleMesh && circleMesh.material.uniforms.u_mixRatio ? circleMesh.material.uniforms.u_mixRatio.value : null
    };
  }
})();
