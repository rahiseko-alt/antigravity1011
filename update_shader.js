const fs = require('fs');

const file = '_astro/hoisted.CUO_IjfL.js';
let content = fs.readFileSync(file, 'utf8');

const target = `            vec3 baseCol = texColor.rgb;
            vec3 litCol = baseCol * (u_ambientColor * 1.5 + matcapColor.rgb * 1.2) + matcapColor.rgb * rim * 0.8;
            
            // Blend with tunnel tint (blue in white tunnel, cyber glow in black tunnel)
            vec3 finalCol = mix(litCol, litCol + u_tintColor * 0.7, u_whiteRatio);
            finalCol = mix(u_bgColor, finalCol, u_showRatio);

            gl_FragColor = vec4(finalCol, texColor.a);`;

const replacement = `            vec3 baseCol = texColor.rgb;
            vec3 mc = clamp(matcapColor.rgb, 0.0, 1.0) * 0.45;
            float NdotV = clamp(dot(normal, viewDir), 0.0, 1.0);
            float rimLight = pow(1.0 - NdotV, 2.5);
            vec3 ambient = clamp(u_ambientColor, 0.0, 1.0) * 0.4 + vec3(0.18);
            vec3 litCol = baseCol * (ambient + mc) + mc * rimLight * 0.4;
            
            vec3 finalCol = mix(litCol, litCol + u_tintColor * 0.2, u_whiteRatio);
            finalCol = mix(u_bgColor, finalCol, u_showRatio);

            gl_FragColor = vec4(clamp(finalCol, 0.0, 1.0), texColor.a);`;

if (!content.includes(target)) {
  console.error("Target not found!");
  process.exit(1);
}

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("Shader updated successfully!");
