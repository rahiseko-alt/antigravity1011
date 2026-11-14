const fs = require('fs');
let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

const target = 'update(e){this.isBlackTitleActive&&properties.bgColor.setStyle("#000"),this.isBlackTunnelActive&&(properties.bgColor.setStyle("#000"),goalBlackTunnel.update(this.tunnelDeltaTime)),this.isWhiteTunnelActive&&(properties.bgColor.setStyle(this.astronautDropRatio<1?"#fff":"#000"),goalWhiteTunnel.update(this.tunnelDeltaTime),this.astronautDropRatio<1&&homePage.preUfxContainer.add(goalTunnelAstronauts.container)),goalTunnelAstronauts.update(this.tunnelDeltaTime),goalTunnelGlass.update(e),goalTunnelsBackground.update(e),goalWhiteTunnelParticles.update(e),goalWhiteTunnelStickers.update(e)}}';

const replacement = 'update(e){if(!properties.isIntroWarp){this.isBlackTitleActive=!1;this.isBlackTunnelActive=!1;this.isWhiteTunnelActive=!1;return;}this.isBlackTitleActive&&properties.bgColor.setStyle("#000"),this.isBlackTunnelActive&&(properties.bgColor.setStyle("#000"),goalBlackTunnel.update(this.tunnelDeltaTime)),this.isWhiteTunnelActive&&(properties.bgColor.setStyle(this.astronautDropRatio<1?"#fff":"#000"),goalWhiteTunnel.update(this.tunnelDeltaTime),this.astronautDropRatio<1&&homePage.preUfxContainer.add(goalTunnelAstronauts.container)),goalTunnelAstronauts.update(this.tunnelDeltaTime),goalTunnelGlass.update(e),goalTunnelsBackground.update(e),goalWhiteTunnelParticles.update(e),goalWhiteTunnelStickers.update(e)}}';

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
  console.log('Successfully silenced all GoalTunnels background sub-systems during normal scroll!');
} else {
  console.log('Target string not found directly, checking snippet...');
  const idx = code.indexOf('goalTunnelAstronauts.update(this.tunnelDeltaTime)');
  console.log(code.slice(idx - 150, idx + 200));
}
