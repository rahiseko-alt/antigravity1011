import fs from 'fs';

const data = JSON.parse(fs.readFileSync('audit_comparison.json', 'utf8'));

['ghReport', 'localReport'].forEach(key => {
  const r = data[key];
  console.log('\n======================================================');
  console.log('ENV:', r.envName.toUpperCase(), '(' + r.url + ')');
  console.log('======================================================');
  
  // 1. CPU, FPS, Long Tasks
  const longTasks = r.clientAudit.longTasks;
  const totalLongTaskDur = longTasks.reduce((acc, t) => acc + t.duration, 0);
  console.log('1. Performance Metrics:');
  console.log('   - Script Duration:', r.metrics.ScriptDuration ? r.metrics.ScriptDuration.toFixed(2) + 's' : 'N/A');
  console.log('   - Task Duration:', r.metrics.TaskDuration ? r.metrics.TaskDuration.toFixed(2) + 's' : 'N/A');
  console.log('   - Layout / RecalcStyle Duration:', ((r.metrics.LayoutDuration || 0) + (r.metrics.RecalcStyleDuration || 0)).toFixed(2) + 's');
  console.log('   - Long Tasks (>50ms) Count:', longTasks.length);
  console.log('   - Total Long Task Duration:', totalLongTaskDur + 'ms');
  console.log('   - Max Single Long Task:', longTasks.length ? Math.max(...longTasks.map(t => t.duration)) + 'ms' : '0ms');
  console.log('   - FPS samples (500ms intervals):', r.clientAudit.fpsSamples.map(f => `${f.fps}fps`).join(', '));

  // 2. State Timeline
  console.log('\n2. State Timeline:');
  const interesting = r.timeline.filter((s, idx) => idx % 3 === 0 || s.elapsed > 8500);
  interesting.forEach(s => {
    const sm = s.scrollManager;
    console.log(`   [${s.elapsed}ms] sm.isActive=${sm?.isActive}, sm.scrollY=${sm?.scrollY}, sm.scrollPixel=${sm?.scrollPixel}, bodyOverflow='${s.documentBodyOverflow}', windowScrollY=${s.windowScrollY}`);
  });

  // 3. Scroll & Interactions
  console.log('\n3. Scroll & Interactions:');
  console.log('   - scrollInteractions:', r.clientAudit.scrollInteractions);
  const startPixel = r.timeline[0]?.scrollManager?.scrollPixel;
  const endPixel = r.timeline[r.timeline.length - 1]?.scrollManager?.scrollPixel;
  console.log(`   - sm.scrollPixel start: ${startPixel}, end: ${endPixel}`);
  console.log(`   - window.scrollY start: ${r.timeline[0]?.windowScrollY}, end: ${r.timeline[r.timeline.length - 1]?.windowScrollY}`);

  // 4. WebGL / Render Loop
  console.log('\n4. WebGL / Render Loop:');
  console.log('   - WebGL Calls in 10s:', r.clientAudit.webglCalls);
  console.log('   - rAF Details (>10ms count):', r.clientAudit.rafDetails.length);
  const heavyRafs = r.clientAudit.rafDetails.slice(0, 10);
  console.log('   - Heavy rAF top 10:', heavyRafs);
});
