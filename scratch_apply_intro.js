const fs = require('fs');

let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

// 1. Add isIntroWarp=!1; to Properties class
if (!code.includes('isIntroWarp=!1;')) {
  code = code.replace('class Properties{', 'class Properties{isIntroWarp=!1;');
}

// 2. Preloader.update: set properties.isIntroWarp=!0 on preloader 100% completion
const cbTarget = 'r==1&&!properties.hasStarted&&this._startCallback()';
if (code.includes(cbTarget)) {
  code = code.replace(cbTarget, 'r==1&&!properties.hasStarted&&(properties.isIntroWarp=!0,this._startCallback())');
}

// 3. start() function
const startIdx = code.indexOf('function start(){');
if (startIdx !== -1) {
  const startEnd = code.indexOf('function onResize(){', startIdx);
  const oldStart = code.slice(startIdx, startEnd);
  const newStart = 'function start(){properties.isIntroWarp=!0,scrollManager.isActive=!1,ui.start(),pagesManager.start(),app.start(),properties.hasStarted=!0,document.documentElement.classList.add("is-started"),_onResize(!0),settings.JUMP_SECTION!==""&&scrollManager.scrollTo(settings.JUMP_SECTION,settings.JUMP_OFFSET,!0)}';
  code = code.replace(oldStart, newStart);
}

// 4. In Visuals class: syncProperties(e)
const oldSyncStart = code.indexOf('syncProperties(e){', code.indexOf('class Visuals'));
const oldSyncEnd = code.indexOf('update(e){this.currentStage3D.update(e)', oldSyncStart);
const oldSyncCode = code.slice(oldSyncStart, oldSyncEnd);

const newSyncCode = `syncProperties(e){if(properties.isIntroWarp){if(goalTunnels.introStartTime==null){goalTunnels.introStartTime=performance.now(),goalTunnels.introRatio=0,scrollManager.isActive=!1,document.body.style.overflow="hidden";const o=document.getElementById("page-container");o&&(o.style.opacity="0");const t=document.getElementById("header");t&&(t.style.opacity="0");typeof transitionOverlay!="undefined"&&(transitionOverlay.contentShowRatio=1,transitionOverlay.canvas&&(transitionOverlay.canvas.style.display="none"))}const r=(performance.now()-goalTunnels.introStartTime)/1e3,n=1.8;goalTunnels.introRatio=Math.min(1,r/n);const a=goalTunnels.introRatio;if(this.currentStage3D=goalTunnels,goalTunnels.isActive=!0,homeBalloons.isActive=!1,a<.7){const o=a/.7;goalTunnels.blackFrameInRatio=1,goalTunnels.blackTitleRatio=1,goalTunnels.blackTunnelRatio=o,goalTunnels.whiteTunnelRatio=0,goalTunnels.isBlackTitleActive=!1,goalTunnels.isBlackTunnelActive=!0,goalTunnels.isWhiteTunnelActive=!1,goalBlackTunnel.container.visible=!0,goalWhiteTunnel.container.visible=!1,goalTunnelGlass.container&&(goalTunnelGlass.container.visible=!1),goalTunnelAstronauts.container&&(goalTunnelAstronauts.container.visible=!1),goalTunnelsBackground.mesh&&(goalTunnelsBackground.mesh.visible=!1),goalTunnelsBackground.container&&(goalTunnelsBackground.container.visible=!1),goalTunnels.properties.bloomAmount=math.fit(o,0,1,30,70),goalTunnels.properties.bloomSaturation=2.5,goalTunnels.properties.haloStrength=math.fit(o,0,1,.1,.35),goalTunnels.properties.cameraNear=1,goalTunnels.properties.cameraFar=200,goalTunnels.properties.cameraFov=math.fit(o,0,1,35,75),goalTunnels.properties.defaultCameraPosition.set(0,0,25),goalTunnels.properties.defaultLookAtPosition.set(0,0,24),goalTunnels.tunnelDeltaTime=e*(2.2+o*1.5),goalTunnels.tunnelTime+=goalTunnels.tunnelDeltaTime,goalTunnels.sharedUniforms.u_tunnelTime.value=goalTunnels.tunnelTime,properties.bgColor.setStyle("#000"),goalTunnelEfx.isActive=!0,goalTunnelEfx.amount=1}else{const o=(a-.7)/.3;goalTunnels.blackTunnelRatio=1,goalTunnels.whiteTunnelRatio=o,goalTunnels.isBlackTitleActive=!1,goalTunnels.isBlackTunnelActive=!1,goalTunnels.isWhiteTunnelActive=!0,goalBlackTunnel.container.visible=!1,goalWhiteTunnel.container.visible=!0,goalTunnelGlass.container&&(goalTunnelGlass.container.visible=!1),goalTunnelAstronauts.container&&(goalTunnelAstronauts.container.visible=!1),goalTunnels.sharedUniforms.u_whiteTunnelRatio.value=o,goalTunnels.properties.bloomAmount=math.fit(o,0,1,70,0),goalTunnels.properties.cameraFov=math.fit(o,0,1,75,45),goalTunnels.tunnelDeltaTime=e*(3-o*1),goalTunnels.tunnelTime+=goalTunnels.tunnelDeltaTime,goalTunnels.sharedUniforms.u_tunnelTime.value=goalTunnels.tunnelTime,properties.bgColor.setStyle(o<.85?"#fff":properties.offWhiteColorHex),goalTunnelEfx.isActive=!0,goalTunnelEfx.amount=math.fit(o,.7,1,1,0)}for(let o in goalTunnels.properties)properties[o]=goalTunnels.properties[o];if(a>=1){properties.isIntroWarp=!1,goalTunnels.isActive=!1,goalBlackTunnel.container.visible=!1,goalWhiteTunnel.container.visible=!1,goalTunnelEfx.isActive=!1,properties.bgColor.setStyle(properties.offWhiteColorHex),homeBalloons.isActive=!0,this.currentStage3D=homeBalloons,homeBalloons.syncProperties(e);for(let o in homeBalloons.properties)properties[o]=homeBalloons.properties[o];homePage.time=0,scrollManager.isActive=!0,document.body.style.overflow="";const o=document.getElementById("page-container");o&&(o.style.transition="opacity 0.6s ease-out",o.style.opacity="1");const t=document.getElementById("header");t&&(t.style.transition="opacity 0.6s ease-out",t.style.opacity="1"),typeof header!="undefined"&&header.show&&header.show(),setTimeout(()=>{o&&(o.style.transition=""),t&&(t.style.transition="")},700)}return}this.currentStage3D=this.defaultStage3D;for(let o=0;o<this.stage3DList.length;o++){let t=this.stage3DList[o];if(t.isActive===!0){this.currentStage3D=t,t.syncProperties(e);for(let r in t.properties)properties[r]=t.properties[r]}else t.isActive=!1}}`;

code = code.replace(oldSyncCode, newSyncCode);

// 5. Replace openingWarp object with a clean proxy
const wStart = code.indexOf('const openingWarp = {');
const wEnd = code.indexOf('window.__openingWarp = openingWarp;', wStart);
if (wStart !== -1 && wEnd !== -1) {
  const wCode = code.slice(wStart, wEnd + 'window.__openingWarp = openingWarp;'.length);
  const newWarpCode = `const openingWarp = { get active() { return !!properties.isIntroWarp; }, start() { properties.isIntroWarp = !0; }, finish() { properties.isIntroWarp = !1; }, update(e) {} };
window.__openingWarp = openingWarp;`;
  code = code.replace(wCode, newWarpCode);
}

// 6. Ensure mid-page #home-goal works cleanly:
code = code.replace(
  'syncProperties(e){if(window.__openingWarp&&window.__openingWarp.active)return;',
  'syncProperties(e){if(properties.isIntroWarp)return;'
);

code = code.replace(
  'update(e){if(window.__openingWarp&&window.__openingWarp.active)return;',
  'update(e){if(properties.isIntroWarp)return;'
);

code = code.replace(
  'homeBalloons.isActive=homeBalloons.ratio>0&&!(window.__openingWarp&&window.__openingWarp.active)',
  'homeBalloons.isActive=homeBalloons.ratio>0&&!properties.isIntroWarp'
);

code = code.replace(
  'this.frameMesh.visible=t&&!(window.__openingWarp&&window.__openingWarp.active)',
  'this.frameMesh.visible=t&&!properties.isIntroWarp'
);

code = code.replace(
  'window.__openingWarp&&window.__openingWarp.active&&(this.time=0)',
  'properties.isIntroWarp&&(this.time=0)'
);

fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
if (fs.existsSync('dist/_astro/hoisted.CUO_IjfL.js')) {
  fs.writeFileSync('dist/_astro/hoisted.CUO_IjfL.js', code, 'utf8');
}
console.log('Successfully updated hoisted.CUO_IjfL.js! New length:', code.length);
