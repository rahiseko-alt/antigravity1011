const fs = require('fs');
const path = require('path');

function patchFile(filePath) {
  console.log('Patching for definitive smoothness:', filePath);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Smooth HomePage.time accumulation (eliminates dolly-zoom sawtooth hitch)
  const oldHomeTime = 'properties.isIntroWarp&&(this.time=(typeof goalTunnels!="undefined"&&goalTunnels.introStartTime)?Math.max(0,(performance.now()-goalTunnels.introStartTime)/1e3-4.80):0)';
  const newHomeTime = 'properties.isIntroWarp&&((typeof goalTunnels!="undefined"&&goalTunnels.introStartTime&&(performance.now()-goalTunnels.introStartTime)/1e3<4.80)?(this.time=0):0)';

  if (content.includes(oldHomeTime)) {
    content = content.replace(oldHomeTime, newHomeTime);
  }

  // 2. Smooth handoff in Visuals.syncProperties: defer heavy DOM reflow via setTimeout so render loop is 100% uninterrupted
  const oldHandoffWithRaf = 'if(!window.__hasCleanedIntroDom){window.__hasCleanedIntroDom=!0;requestAnimationFrame(()=>{_curtain&&(_curtain.style.opacity="0",_curtain.style.display="none");document.body.style.overflow="";pageCont&&(pageCont.style.transition="");hdr&&(hdr.style.transition="");});}';
  const oldHandoff = 'if(r>=tIntroEnd){_curtain&&(_curtain.style.opacity="0",_curtain.style.display="none"),properties.isIntroWarp=!1,properties.bloomAmount=0,properties.haloStrength=0,properties.bloom.amount=0,properties.bloom.haloStrength=0,properties.bgColor.setStyle(properties.offWhiteColorHex),properties.bgColorHex=properties.offWhiteColorHex,scrollManager.isActive=!0,scrollManager.scrollY=0,scrollManager.targetY=0,document.body.style.overflow="",pageCont&&(pageCont.style.opacity="1",pageCont.style.transition=""),hdr&&(hdr.style.opacity="1",hdr.style.transition=""),typeof header!="undefined"&&header.show&&header.show()}';
  const newHandoffWithTimeout = 'if(r>=tIntroEnd){properties.isIntroWarp=!1,properties.bloomAmount=0,properties.haloStrength=0,properties.bloom.amount=0,properties.bloom.haloStrength=0,properties.bgColor.setStyle(properties.offWhiteColorHex),properties.bgColorHex=properties.offWhiteColorHex,scrollManager.isActive=!0,scrollManager.scrollY=0,scrollManager.targetY=0,pageCont&&(pageCont.style.opacity="1"),hdr&&(hdr.style.opacity="1"),typeof header!="undefined"&&header.show&&header.show();if(!window.__hasCleanedIntroDom){window.__hasCleanedIntroDom=!0;setTimeout(()=>{const _c=document.getElementById("intro-whiteout");_c&&(_c.style.opacity="0",_c.style.display="none");document.body.style.overflow="";const _pc=document.getElementById("page-container");_pc&&(_pc.style.transition="");const _h=document.getElementById("header");_h&&(_h.style.transition="");},120);}}';

  if (content.includes(oldHandoff)) {
    content = content.replace(oldHandoff, newHandoffWithTimeout);
  } else if (content.includes(oldHandoffWithRaf)) {
    content = content.replace(oldHandoffWithRaf, 'if(!window.__hasCleanedIntroDom){window.__hasCleanedIntroDom=!0;setTimeout(()=>{const _c=document.getElementById("intro-whiteout");_c&&(_c.style.opacity="0",_c.style.display="none");document.body.style.overflow="";const _pc=document.getElementById("page-container");_pc&&(_pc.style.transition="");const _h=document.getElementById("header");_h&&(_h.style.transition="");},120);}');
  }

  // 3. Update delta time clamp in HomeBalloons.update to 0.050 (match 1/20 engine clamp)
  content = content.replace(
    /update\(e\)\{if\(this\.isReady\)\{e=Math\.min\(Math\.max\(e,\.001\),\.\d+\);/g,
    'update(e){if(this.isReady){e=Math.min(Math.max(e,.001),.050);'
  );

  // 4. Update delta time clamp in HomeBalloonsBody.updateGravity and update
  content = content.replace(
    /updateGravity\(e\)\{e=Math\.min\(Math\.max\(e,\.001\),\.\d+\);/g,
    'updateGravity(e){e=Math.min(Math.max(e,.001),.050);'
  );
  content = content.replace(
    /update\(e\)\{e=Math\.min\(Math\.max\(e,\.001\),\.\d+\);this\.position\.addScaledVector/g,
    'update(e){e=Math.min(Math.max(e,.001),.050);this.position.addScaledVector'
  );

  // 5. Update HomeBalloonsPhysics.update
  // Search for update(e) inside HomeBalloonsPhysics
  const hbpIdx = content.indexOf('class HomeBalloonsPhysics');
  const hbpUpStart = content.indexOf('update(e){', hbpIdx);
  const hbpUpEnd = content.indexOf('const homeBalloonsPhysics=new HomeBalloonsPhysics', hbpUpStart);

  if (hbpUpStart === -1 || hbpUpEnd === -1) {
    throw new Error('HomeBalloonsPhysics.update not found');
  }

  const newHBPCode = `update(e){if(!this.isActive)return;e=Math.min(Math.max(e,.001),.050);_p1$1.set(input.mouseXY.x,input.mouseXY.y,.5),_p1$1.unproject(properties.camera),_p1$1.sub(properties.camera.position).normalize();const r=(0-properties.camera.position.z)/_p1$1.z;_p1$1.multiplyScalar(r),_mouse.copy(properties.camera.position).add(_p1$1);const isMouseMoving=!!(input.deltaXY&&input.deltaXY.lengthSq()>1e-6);if(properties.isIntroWarp||!isMouseMoving){_mousePushForce.set(0,0,0);_mousePrev.copy(_mouse);}else{_mousePushForce.copy(_mouse).sub(_mousePrev).multiplyScalar(this.MOUSE_PUSH_FORCE/e);_mousePrev.copy(_mouse);}_mouseBA.copy(_mouse).sub(properties.camera.position);let n=_mouseBA.lengthSq();for(let a=0;a<this.bodies.length;a++){const l=this.bodies[a];l.updateGravity(e),_vel.copy(l.velocity),_pos.copy(l.position);for(let p=a+1;p<this.bodies.length;p++){const g=this.bodies[p];_v1$6.copy(g.velocity),_p1$1.copy(g.position),_normal.copy(_pos).sub(_p1$1);const v=_normal.length(),_=l.radius+g.radius;if(v<_){const T=Math.sqrt(l.friction*g.friction,2);l.frictionTot+=T,g.frictionTot+=T,_normal.normalize();const pen=_ - v;const correction=Math.min(pen*0.35,0.035);_normal.multiplyScalar(-correction);_pos.sub(_normal);_p1$1.add(_normal);_normal.normalize();const M=_vel.dot(_normal),S=_v1$6.dot(_normal),b=l.mass,C=g.mass,w=l.restitution,R=g.restitution,E=(b*M+C*S-C*(M-S)*w)/(b+C),I=(b*M+C*S-b*(S-M)*R)/(b+C);const impulse1=Math.max(-2.0,Math.min(2.0,(E-M)/(1+T)));const impulse2=Math.max(-2.0,Math.min(2.0,(I-S)/(1+T)));_vel.addScaledVector(_normal,impulse1);_v1$6.addScaledVector(_normal,impulse2);g.position.copy(_p1$1);g.velocity.copy(_v1$6);}}_v0$3.copy(_pos).sub(properties.camera.position);let c=_v0$3.dot(_mouseBA)/n;c=_v0$3.sub(_v1$6.copy(_mouseBA).multiplyScalar(c)).length()-l.radius-this.MOUSE_RADIUS;if(0>c&&!properties.isIntroWarp&&isMouseMoving){_v0$3.copy(_pos).sub(properties.camera.position).cross(_mouseBA).normalize();_v1$6.copy(_mouseBA).cross(_v0$3).normalize();_pos.sub(_v1$6.multiplyScalar(this.MOUSE_INFLUENCE*c));_v1$6.multiplyScalar(-this.MOUSE_PUSH_FORCE/e);_vel.add(_v1$6);_vel.add(_mousePushForce);}let u=_pos.length();if(u>0){_v0$3.set(1,1,1).normalize();let p=1-Math.abs(_v0$3.dot(_v1$6.copy(_pos).normalize()));p*=e*math.fit(u,0,2,0,1)*.5,p*=a%2*2-1;_q$2.setFromAxisAngle(_v0$3,p);_v1$6.copy(_pos).applyQuaternion(_q$2).sub(_v0$3.copy(_pos));_vel.add(_v1$6);}_v0$3.cross(_vel);let f=_v0$3.length();f/=l.inertia;f>0&&(_v0$3.normalize(),_q$2.setFromAxisAngle(_v0$3,f*e),l.quaternion.premultiply(_q$2));l.position.copy(_pos),l.velocity.copy(_vel),l.update(e);}}`;

  content = content.slice(0, hbpUpStart) + newHBPCode + '}' + content.slice(hbpUpEnd);

  // 6. Soften initial impulse in applyImpulse from 80 to 35
  content = content.replace(
    'this.gravityForce.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(80)',
    'this.gravityForce.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(35)'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched ' + filePath);
}

try {
  patchFile(path.join(__dirname, '_astro/hoisted.CUO_IjfL.js'));
  if (fs.existsSync(path.join(__dirname, 'dist/_astro/hoisted.CUO_IjfL.js'))) {
    patchFile(path.join(__dirname, 'dist/_astro/hoisted.CUO_IjfL.js'));
  }
  console.log('All patches applied cleanly and successfully!');
} catch (err) {
  console.error('Error applying patches:', err);
  process.exit(1);
}
