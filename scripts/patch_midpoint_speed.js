const fs = require('fs');
const path = require('path');

const filePath = path.resolve('_astro/hoisted.CUO_IjfL.js');
let code = fs.readFileSync(filePath, 'utf8');

const targetA = `if(this.lineId===0){const s=scrollManager.scrollPixel;if(s<=750||s<(properties.viewportWidth<768?650:850))a=0;else if(s>=5800)a=1;else if(s<1600){const d=s-750;a=d*d*(5.397076403639823e-7-2.767169064326924e-10*d)}else if(s<2700){const d=s-1600;a=0.22+d*(3.177190939259091e-4+d*(-1.6592047103938328e-7+6.10614324862162e-11*d))}else if(s<4000){const d=s-2700;a=0.45+d*(1.743470575642307e-4+d*(3.558225616513016e-8-7.64004904532085e-12*d))}else{const d=s-4000;a=0.72+d*(2.2812587493379238e-4+d*(5.786064888378846e-9-2.5612727215221836e-11*d))}}`;

const replacementA = `if(this.lineId===0){const s=scrollManager.scrollPixel;if(s<=750||s<(properties.viewportWidth<768?650:800))a=0;else if(s>=5300)a=1;else if(s<1400){const d=s-750;a=d*d*(1.354669642405376e-6-9.552951257761362e-10*d)}else if(s<2500){const d=s-1400;a=0.31+d*(5.502339632057363e-4+d*(-5.08155852858089e-7+1.8002345787526508e-10*d))}else if(s<3800){const d=s-2500;a=0.54+d*(8.577623900515268e-5+d*(8.592155813028578e-8-1.671212742234021e-11*d))}else{const d=s-3800;a=0.76+d*(2.2444180411263078e-4+d*(2.0744261183158925e-8-4.2470309283275194e-11*d))}}`;

if (!code.includes(targetA)) {
  console.error('Target A not found!');
  process.exit(1);
}

code = code.replace(targetA, replacementA);

const targetPos = `this.innerContainer.position.y=this.lineId===0?((0.78+4.57*a)*u-0.45*properties.viewportHeight):this.lineData.margin.y*u-l,`;
const replacementPos = `this.innerContainer.position.y=this.lineId===0?(0.5*scrollManager.scrollPixel+0.5*((0.78+4.57*a)*u-0.45*properties.viewportHeight)):this.lineData.margin.y*u-l,`;

if (!code.includes(targetPos)) {
  console.error('Target Pos not found!');
  process.exit(1);
}

code = code.replace(targetPos, replacementPos);

const targetVis = `this.container.visible=this.lineId===0?(scrollManager.scrollPixel>=(properties.viewportWidth<768?650:850)&&scrollManager.scrollPixel<6200):(_box.max.y>-properties.viewportHeight&&_box.min.y<0)`;
const replacementVis = `this.container.visible=this.lineId===0?(scrollManager.scrollPixel>=(properties.viewportWidth<768?650:800)&&scrollManager.scrollPixel<5800):(_box.max.y>-properties.viewportHeight&&_box.min.y<0)`;

if (code.includes(targetVis)) {
  code = code.replace(targetVis, replacementVis);
}

const targetCircleVis = `this.circle.visible=(this.lineId===0?(scrollManager.scrollPixel>=(properties.viewportWidth<768?650:850)&&a>0.001&&a<0.999):(a>0.001&&a<0.999))`;
const replacementCircleVis = `this.circle.visible=(this.lineId===0?(scrollManager.scrollPixel>=(properties.viewportWidth<768?650:800)&&a>0.001&&a<0.999):(a>0.001&&a<0.999))`;

if (code.includes(targetCircleVis)) {
  code = code.replace(targetCircleVis, replacementCircleVis);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully patched _astro/hoisted.CUO_IjfL.js with midpoint speed profile and 50% scroll/locked blend!');
