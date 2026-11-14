const { execSync } = require('child_process');
const commits = ['ad08c67', '4b452ec', 'b6108d3', '3595ae7', '2822aaf', '0edecca', 'HEAD'];
const probes = [
  ['GoalSectionRanges.resize c=', /c=\(t\|\|properties\.viewportHeight\|\|800\)\*\d+|c=t\*\d+|const c=[^;]{0,60}\*42[^;]{0,20}/],
  ['HomeGoalSection.update head', /class HomeGoalSection[\s\S]{0,60}/],
  ['goalTunnels.isActive= (goal)', /goalTunnels\.isActive=[^,;]{0,80}/g],
  ['updateRatios head', /updateRatios\(\)\{[^}]{0,260}/],
  ['padding-bottom goal css', /#home-goal\{[^}]{0,200}\}/],
];
for (const c of commits) {
  let src;
  try { src = execSync(`git show ${c}:_astro/hoisted.CUO_IjfL.js`, { maxBuffer: 1 << 28 }).toString('utf8'); } catch (e) { console.log(c, 'ERR'); continue; }
  console.log('\n==================== ' + c + ' (len ' + src.length + ')');
  // GoalSectionRanges resize
  let i = src.indexOf('class GoalSectionRanges');
  console.log('[GoalSectionRanges.resize]', src.slice(i, i + 700).replace(/\r?\n/g, ' ').match(/resize\([^)]*\)\{[^}]{0,300}/)?.[0]);
  // goalTunnels.isActive assignments
  const m = [...src.matchAll(/goalTunnels\.isActive=[^,;]{0,90}/g)].map(x => x[0]);
  console.log('[goalTunnels.isActive assigns]', m);
  const ur = src.indexOf('updateRatios(){');
  console.log('[updateRatios]', src.slice(ur, ur + 330).replace(/\r?\n/g, ' '));
  const hg = src.indexOf('class HomeGoalSection');
  const up = src.indexOf('update(e){', hg);
  console.log('[HomeGoalSection.update]', src.slice(up, up + 700).replace(/\r?\n/g, ' '));
}
