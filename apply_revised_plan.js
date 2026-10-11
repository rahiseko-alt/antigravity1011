const fs = require('fs');
let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

// 1. Loader replacement
const loaderStart = code.indexOf('_gltfLoader.load');
const loaderEnd = code.indexOf('window.goalTunnelAstronauts = this;', loaderStart);

const newLoader = `_gltfLoader.load('/assets/models/custom/michelle.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.set(0.95, 0.95, 0.95);
  model.position.set(0, 0, 0);

  // Extract meshes, bake skinned mesh to static geometry, and assign tunnel-compatible shaders
  this.customAvatarMeshes = [];
  model.updateMatrixWorld(true);

  model.traverse(child => {
    if (child.isMesh) {
      let geo = child.geometry.clone();
      // If it's a SkinnedMesh, bake the current pose to static BufferGeometry
      if (child.isSkinnedMesh && child.skeleton) {
        child.skeleton.update();
        const posAttr = child.geometry.attributes.position;
        const normAttr = child.geometry.attributes.normal;
        const skinIndexAttr = child.geometry.attributes.skinIndex;
        const skinWeightAttr = child.geometry.attributes.skinWeight;
        const bindMatrix = child.bindMatrix || new Matrix4();
        const bindMatrixInverse = child.bindMatrixInverse || new Matrix4().copy(bindMatrix).invert();
        const boneMats = child.skeleton.boneMatrices;

        const p = new Vector3(), skinnedP = new Vector3();
        const n = new Vector3(), skinnedN = new Vector3();
        const newPos = new Float32Array(posAttr.count * 3);
        const newNorm = normAttr ? new Float32Array(normAttr.count * 3) : null;

        for (let i = 0; i < posAttr.count; i++) {
          p.fromBufferAttribute(posAttr, i).applyMatrix4(bindMatrix);
          if (normAttr) n.fromBufferAttribute(normAttr, i);
          skinnedP.set(0, 0, 0);
          if (newNorm) skinnedN.set(0, 0, 0);

          for (let k = 0; k < 4; k++) {
            const weight = skinWeightAttr.getComponent(i, k);
            if (weight > 0) {
              const bIdx = skinIndexAttr.getComponent(i, k);
              const bMat = new Matrix4().fromArray(boneMats, bIdx * 16);
              const tempP = p.clone().applyMatrix4(bMat);
              skinnedP.add(tempP.multiplyScalar(weight));
              if (newNorm) {
                const tempN = n.clone().transformDirection(bMat);
                skinnedN.add(tempN.multiplyScalar(weight));
              }
            }
          }
          skinnedP.applyMatrix4(bindMatrixInverse);
          newPos[i * 3] = skinnedP.x;
          newPos[i * 3 + 1] = skinnedP.y;
          newPos[i * 3 + 2] = skinnedP.z;

          if (newNorm) {
            skinnedN.transformDirection(bindMatrixInverse).normalize();
            newNorm[i * 3] = skinnedN.x;
            newNorm[i * 3 + 1] = skinnedN.y;
            newNorm[i * 3 + 2] = skinnedN.z;
          }
        }
        geo.setAttribute('position', new BufferAttribute(newPos, 3));
        if (newNorm) geo.setAttribute('normal', new BufferAttribute(newNorm, 3));
      }

      // Convert child into a regular Mesh with tunnel materials
      const oldMat = child.material;
      const diffMap = oldMat && oldMat.map ? oldMat.map : null;

      // Custom tunnel ShaderMaterial that respects Lusion's lighting, matcap, and color tinting
      const michelleShaderMat = new ShaderMaterial({
        uniforms: {
          u_map: { value: diffMap },
          u_matcap: this.whiteTunnelUniforms.u_matcapTexture,
          u_tintColor: this.whiteTunnelUniforms.u_tintColor,
          u_bgColor: this.sharedUniforms.u_bgColor,
          u_showRatio: this.sharedUniforms.u_showRatio,
          u_ambientColor: this.sharedUniforms.u_ambientColor,
          u_sunPosition: this.blackTunnelUniforms.u_sunPosition,
          u_whiteRatio: this.whiteTunnelUniforms.u_whiteTunnelRatio
        },
        vertexShader: \`
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewPos;
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPos = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        \`,
        fragmentShader: \`
          uniform sampler2D u_map;
          uniform sampler2D u_matcap;
          uniform vec3 u_tintColor;
          uniform vec3 u_bgColor;
          uniform float u_showRatio;
          uniform vec3 u_ambientColor;
          uniform float u_whiteRatio;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewPos;

          void main() {
            vec4 texColor = texture2D(u_map, vUv);
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPos);

            // Matcap reflection coordinate
            vec2 matcapUv = normal.xy * 0.5 + 0.5;
            vec4 matcapColor = texture2D(u_matcap, matcapUv);

            // Lighting & tint calculation
            float rim = 1.0 - max(dot(normal, viewDir), 0.0);
            rim = smoothstep(0.3, 1.0, rim);

            vec3 baseCol = texColor.rgb;
            vec3 litCol = baseCol * (u_ambientColor * 1.5 + matcapColor.rgb * 1.2) + matcapColor.rgb * rim * 0.8;
            
            // Blend with tunnel tint (blue in white tunnel, cyber glow in black tunnel)
            vec3 finalCol = mix(litCol, litCol + u_tintColor * 0.7, u_whiteRatio);
            finalCol = mix(u_bgColor, finalCol, u_showRatio);

            gl_FragColor = vec4(finalCol, texColor.a);
          }
        \`,
        side: DoubleSide,
        transparent: true,
        depthTest: true,
        depthWrite: true
      });

      const bakedMesh = new Mesh(geo, michelleShaderMat);
      bakedMesh.name = child.name;
      bakedMesh.renderOrder = 0; // Maintain proper layering under GoalTunnelGlass
      bakedMesh.frustumCulled = false;
      bakedMesh.onBeforeRender = this._onBeforeRender.bind(this); // PreUfx camera synchronization
      bakedMesh.onAfterRender = this._onAfterRender.bind(this);

      this.customAvatarMeshes.push(bakedMesh);
    }
  });

  const avatarContainer = new Object3D();
  avatarContainer.name = 'customFemaleAvatar';
  this.customAvatarMeshes.forEach(m => avatarContainer.add(m));
  this.container.add(avatarContainer);
  this.customAvatar = avatarContainer;
  console.log('[Lusion] Custom female avatar (Michelle) statically baked & injected with tunnel shaders!');
  try {
    window.__lusion = { visuals, cameraControls, properties, homePage, Box3, Vector3, model: avatarContainer };
  } catch(e) { console.error(e); }
});
`;

code = code.substring(0, loaderStart) + newLoader + code.substring(loaderEnd);

// 2. Update section replacement
const updateStart = code.indexOf('if (this.customAvatar) {');
const updateEnd = code.indexOf('}}}const goalTunnelAstronauts', updateStart);

const newUpdate = `if (this.customAvatar) {
  if (this.useCustomAvatar) {
    this.customAvatar.visible = this.showRatio > 0.01;
    // Precisely sync to Brownian motion + SecondOrderDynamics physics buffers
    this.customAvatar.position.fromArray(this.instancePosAttribute.array, 0);
    this.customAvatar.quaternion.fromArray(this.instanceOrientAttribute.array, 0);
    for (const _k in this.meshes) this.meshes[_k].visible = false;
    for (const _k in this.cloneMeshes) this.cloneMeshes[_k].visible = false;
  } else {
    this.customAvatar.visible = false;
    for (const _k in this.meshes) this.meshes[_k].visible = this.showRatio > 0.01;
    for (const _k in this.cloneMeshes) this.cloneMeshes[_k].visible = this.clonesShowRatio > 0.01;
  }
}`;

code = code.substring(0, updateStart) + newUpdate + code.substring(updateEnd);

fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
console.log('REVISED_PLAN_APPLIED_SUCCESS');
