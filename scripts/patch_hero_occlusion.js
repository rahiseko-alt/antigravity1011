const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(targetFile, 'utf8');

// 1. Patch frag$m
const oldFrag = 'void main(){if(step(u_showRatio,v_lineRatio)>0.5)discard;vec3 baseColor=getTubeColor(v_lineRatio);gl_FragColor=vec4(baseColor,1.0);}';
const newFrag = 'void main(){if(u_heroBottomCoord>0.0&&gl_FragCoord.y>u_heroBottomCoord)discard;if(step(u_showRatio,v_lineRatio)>0.5)discard;vec3 baseColor=getTubeColor(v_lineRatio);float startFade=smoothstep(0.0,0.03,v_lineRatio);gl_FragColor=vec4(baseColor,startFade);}';

if (!code.includes(oldFrag)) {
  console.error('ERROR: oldFrag not found in hoisted.CUO_IjfL.js');
  process.exit(1);
}

// Add uniform float u_heroBottomCoord to frag$m
const oldFragDecl = 'varying float v_s;uniform float u_showRatio;uniform vec3 u_color0;';
const newFragDecl = 'varying float v_s;uniform float u_showRatio;uniform float u_heroBottomCoord;uniform vec3 u_color0;';

if (!code.includes(oldFragDecl)) {
  console.error('ERROR: oldFragDecl not found in hoisted.CUO_IjfL.js');
  process.exit(1);
}

// 2. Patch lineEndFrag
const oldLineEndDecl = 'uniform float u_cd;uniform float u_lineRatio;varying vec2 v_uv;';
const newLineEndDecl = 'uniform float u_cd;uniform float u_lineRatio;uniform float u_heroBottomCoord;varying vec2 v_uv;';

if (!code.includes(oldLineEndDecl)) {
  console.error('ERROR: oldLineEndDecl not found in hoisted.CUO_IjfL.js');
  process.exit(1);
}

const oldLineEndMain = 'void main(){vec2 p=(v_uv-0.5)*2.0;float d2=dot(p,p);if(d2>1.0)discard;vec3 baseColor=getTubeColor(u_lineRatio);gl_FragColor=vec4(baseColor,1.0);}';
const newLineEndMain = 'void main(){if(u_heroBottomCoord>0.0&&gl_FragCoord.y>u_heroBottomCoord)discard;vec2 p=(v_uv-0.5)*2.0;float d2=dot(p,p);if(d2>1.0)discard;vec3 baseColor=getTubeColor(u_lineRatio);gl_FragColor=vec4(baseColor,1.0);}';

if (!code.includes(oldLineEndMain)) {
  console.error('ERROR: oldLineEndMain not found in hoisted.CUO_IjfL.js');
  process.exit(1);
}

// 3. Patch Line.init mesh uniforms
const oldMeshUniforms = 'u_viewportResolution:properties.sharedUniforms.u_viewportResolution},vertexShader:vert$j';
const newMeshUniforms = 'u_viewportResolution:properties.sharedUniforms.u_viewportResolution,u_heroBottomCoord:{value:0}},vertexShader:vert$j';

if (!code.includes(oldMeshUniforms)) {
  console.error('ERROR: oldMeshUniforms not found in hoisted.CUO_IjfL.js');
  process.exit(1);
}

// 4. Patch circle uniforms
const oldCircleUniforms = 'u_mixRatio:{value:0},u_cd:{value:0},u_lineRatio:{value:0}},vertexShader:lineEndVert';
const newCircleUniforms = 'u_mixRatio:{value:0},u_cd:{value:0},u_lineRatio:{value:0},u_heroBottomCoord:{value:0}},vertexShader:lineEndVert';

if (!code.includes(oldCircleUniforms)) {
  console.error('ERROR: oldCircleUniforms not found in hoisted.CUO_IjfL.js');
  process.exit(1);
}

// 5. Patch Line.update to compute and pass heroBottomGl
const oldUpdateLine = 'const l=t.screenY+r;this.mesh.material.uniforms.u_showRatio.value=math.saturate(a),this.mesh.material.uniforms.u_scrollY.value=-l,this.mesh.material.uniforms.u_colorBg.value.copy(properties.bgColor),this.mesh.material.uniforms.u_radius.value=n;';
const newUpdateLine = 'const l=t.screenY+r;let heroBottomGl=0;if(this.lineId===0){const vc=document.getElementById("home-hero-visual-container")||document.getElementById("home-hero");if(vc){const rVc=vc.getBoundingClientRect();const dpr=(properties&&properties.renderer&&properties.renderer.getPixelRatio)?properties.renderer.getPixelRatio():(window.devicePixelRatio||1);heroBottomGl=Math.max(0,(H-rVc.bottom)*dpr);}}this.mesh.material.uniforms.u_heroBottomCoord&&(this.mesh.material.uniforms.u_heroBottomCoord.value=heroBottomGl);if(this.circle&&this.circle.material&&this.circle.material.uniforms&&this.circle.material.uniforms.u_heroBottomCoord){this.circle.material.uniforms.u_heroBottomCoord.value=heroBottomGl;}this.mesh.material.uniforms.u_showRatio.value=math.saturate(a),this.mesh.material.uniforms.u_scrollY.value=-l,this.mesh.material.uniforms.u_colorBg.value.copy(properties.bgColor),this.mesh.material.uniforms.u_radius.value=n;';

if (!code.includes(oldUpdateLine)) {
  console.error('ERROR: oldUpdateLine not found in hoisted.CUO_IjfL.js');
  process.exit(1);
}

// Apply replacements
code = code.replace(oldFragDecl, newFragDecl);
code = code.replace(oldFrag, newFrag);
code = code.replace(oldLineEndDecl, newLineEndDecl);
code = code.replace(oldLineEndMain, newLineEndMain);
code = code.replace(oldMeshUniforms, newMeshUniforms);
code = code.replace(oldCircleUniforms, newCircleUniforms);
code = code.replace(oldUpdateLine, newUpdateLine);

fs.writeFileSync(targetFile, code, 'utf8');
console.log('SUCCESS: Flawlessly patched hoisted.CUO_IjfL.js with Hero Card Occlusion!');
