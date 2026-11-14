const fs = require('fs');
let code = fs.readFileSync('_astro/hoisted.CUO_IjfL.js', 'utf8');

// Inject precise frame timing
const target = 'function update(o){window.__openingWarp&&window.__openingWarp.update(o),scrollManager.autoScrollSpeed=properties.autoScrollSpeed,window.__AUTO_SCROLL__&&(scrollManager.autoScrollSpeed=window.__AUTO_SCROLL__),taskManager.update(),properties.reset(),app.preUpdate(o),input.update(o),scrollManager.update(o),pagesManager.update(o),ui.update(o),app.update(o),input.postUpdate(o)}';

const replacement = 'function update(o){const _t0=performance.now();window.__openingWarp&&window.__openingWarp.update(o);scrollManager.autoScrollSpeed=properties.autoScrollSpeed;window.__AUTO_SCROLL__&&(scrollManager.autoScrollSpeed=window.__AUTO_SCROLL__);taskManager.update();properties.reset();const _t1=performance.now();app.preUpdate(o);const _t2=performance.now();input.update(o);const _t3=performance.now();scrollManager.update(o);const _t4=performance.now();pagesManager.update(o);const _t5=performance.now();ui.update(o);const _t6=performance.now();app.update(o);const _t7=performance.now();input.postUpdate(o);const _t8=performance.now();if(!window.__frameTimes)window.__frameTimes=[];if(window.__frameTimes.length<300){window.__frameTimes.push({task:_t1-_t0,appPre:_t2-_t1,input:_t3-_t2,scroll:_t4-_t3,pages:_t5-_t4,ui:_t6-_t5,appUpdate:_t7-_t6,postInput:_t8-_t7,total:_t8-_t0});}}';

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('_astro/hoisted.CUO_IjfL.js', code, 'utf8');
  console.log('Injected profiler successfully!');
} else {
  console.log('Already injected or target not found.');
}
