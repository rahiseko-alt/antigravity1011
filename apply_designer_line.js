const fs = require('fs');

function applyTo(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Update LINES_DATA_LIST[0]
  // Target: color0:"#5a90ff",color1:"#2a38ee" -> color0:"#00f5ff",color1:"#1a2ffb"
  // Target: margin:{x:-.05,y:-.8},scrollToRatioFactors:[.4,1.3] -> margin:{x:-.038,y:-.710},scrollToRatioFactors:[.38,1.35]
  const oldReelData = 'fileName:"line_reel",aoThreshold:.555,margin:{x:-.05,y:-.8},scrollToRatioFactors:[.4,1.3],boxMin:new Vector3(-.0112049,-.0141946,0),boxMax:new Vector3(1.01357,.718671,0),color0:"#5a90ff",color1:"#2a38ee"';
  const newReelData = 'fileName:"line_reel",aoThreshold:.555,margin:{x:-.038,y:-.710},scrollToRatioFactors:[.38,1.35],boxMin:new Vector3(-.0112049,-.0141946,0),boxMax:new Vector3(1.01357,.718671,0),color0:"#00f5ff",color1:"#1a2ffb"';

  if (content.includes(oldReelData)) {
    content = content.replace(oldReelData, newReelData);
    console.log('Updated LINES_DATA_LIST[0] in', filePath);
  } else {
    console.log('oldReelData not found directly in', filePath);
  }

  // 2. Update class Line radius
  // Target: radius=.008 -> radius=.0120
  const oldRadiusDef = 'aoThreshold=.47;radius=.008;lineData=null;';
  const newRadiusDef = 'aoThreshold=.47;radius=.0120;lineData=null;';
  if (content.includes(oldRadiusDef)) {
    content = content.replace(oldRadiusDef, newRadiusDef);
    console.log('Updated radius in class Line in', filePath);
  }

  // 3. Update radius calculation in update()
  const oldRadiusCalc = 'let n=this.radius*math.fit(properties.viewportWidth,540,1920,2,1)';
  const newRadiusCalc = 'let n=this.radius*math.fit(properties.viewportWidth,540,1920,1.85,1)';
  if (content.includes(oldRadiusCalc)) {
    content = content.replace(oldRadiusCalc, newRadiusCalc);
    console.log('Updated radius scale in', filePath);
  }

  // 4. Update frag$m shader with volumetric cylinder lighting & photonic core
  const oldFragM = 'void main(){float ao=0.9+0.1*v_cd;float aoRatio=linearStep(u_aoThreshold-0.02,u_aoThreshold+0.02,u_showRatio);if(step(u_showRatio,v_lineRatio)>0.5)discard;float mixRatio=1.0-pow(1.0-clamp(v_lineRatio,0.0,1.0),2.0);gl_FragColor.rgb=hsv2rgb(lerpHSV(rgb2hsv(u_color1),rgb2hsv(u_color0),mixRatio));gl_FragColor.rgb*=min(1.0,ao+1.0-aoRatio);float alpha=abs(v_s-.5);gl_FragColor.a=linearStep(0.5,0.5-fwidth(alpha),alpha);}';
  const newFragM = 'void main(){float ao=0.9+0.1*v_cd;float aoRatio=linearStep(u_aoThreshold-0.02,u_aoThreshold+0.02,u_showRatio);if(step(u_showRatio,v_lineRatio)>0.5)discard;float mixRatio=1.0-pow(1.0-clamp(v_lineRatio,0.0,1.0),2.0);vec3 baseColor=hsv2rgb(lerpHSV(rgb2hsv(u_color1),rgb2hsv(u_color0),mixRatio));float lateral=abs(v_s-0.5)*2.0;float normalZ=sqrt(max(0.0,1.0-lateral*lateral));float diffuse=0.72+0.28*normalZ;float core=pow(max(0.0,1.0-lateral),2.6);vec3 coreGlow=mix(baseColor,vec3(1.0,1.0,1.0),0.65)*(core*0.70);float rim=pow(lateral,2.2);vec3 rimGlint=mix(baseColor,vec3(0.65,0.95,1.0),0.50)*(rim*0.42);vec3 finalRgb=baseColor*diffuse+coreGlow+rimGlint;gl_FragColor.rgb=finalRgb*min(1.0,ao+1.0-aoRatio);float alpha=abs(v_s-.5);gl_FragColor.a=linearStep(0.5,0.5-fwidth(alpha),alpha);}';

  if (content.includes(oldFragM)) {
    content = content.replace(oldFragM, newFragM);
    console.log('Updated frag$m shader in', filePath);
  }

  // 5. Update lineEndFrag
  const oldEndFrag = 'varying vec3 v_color;varying vec2 v_uv;void main(){float d=length(v_uv-0.5)*2.0;if(d>1.0)discard;gl_FragColor=vec4(v_color,1.0);}';
  const newEndFrag = 'varying vec3 v_color;varying vec2 v_uv;void main(){float d=length(v_uv-0.5)*2.0;if(d>1.0)discard;float normalZ=sqrt(max(0.0,1.0-d*d));float core=pow(max(0.0,1.0-d),2.6);float rim=pow(clamp(d,0.0,1.0),2.2);vec3 finalRgb=v_color*(0.72+0.28*normalZ)+mix(v_color,vec3(1.0),0.65)*(core*0.70)+mix(v_color,vec3(0.65,0.95,1.0),0.50)*(rim*0.42);gl_FragColor=vec4(finalRgb,1.0);}';
  if (content.includes(oldEndFrag)) {
    content = content.replace(oldEndFrag, newEndFrag);
    console.log('Updated lineEndFrag in', filePath);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Saved', filePath);
}

applyTo('_astro/hoisted.CUO_IjfL.js');
applyTo('dist/_astro/hoisted.CUO_IjfL.js');
