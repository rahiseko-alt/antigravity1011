import fs from 'fs';

const profile = JSON.parse(fs.readFileSync('cpu_profile.json', 'utf8'));

// Build node map
const nodes = {};
profile.nodes.forEach(n => {
  nodes[n.id] = {
    ...n,
    selfTime: 0,
    totalTime: 0,
    hitCount: n.hitCount || 0
  };
});

// Calculate sample intervals
const samples = profile.samples;
const timeDeltas = profile.timeDeltas;

for (let i = 0; i < samples.length; i++) {
  const nodeId = samples[i];
  const deltaUs = timeDeltas[i] || 0; // microseconds
  if (nodes[nodeId]) {
    nodes[nodeId].selfTime += deltaUs;
  }
}

// Convert to array and sort by selfTime
const sortedNodes = Object.values(nodes).sort((a, b) => b.selfTime - a.selfTime);

console.log('=== TOP 25 FUNCTIONS BY SELF-TIME ===');
sortedNodes.slice(0, 25).forEach((n, i) => {
  const fn = n.callFrame.functionName || '(anonymous)';
  const url = n.callFrame.url ? n.callFrame.url.split('/').pop() : '(native/root)';
  const line = n.callFrame.lineNumber;
  const col = n.callFrame.columnNumber;
  const selfMs = (n.selfTime / 1000).toFixed(1);
  console.log(`${(i + 1).toString().padStart(2)}. [${selfMs}ms] ${fn} @ ${url}:${line}:${col}`);
});

// Aggregate by script URL
const scriptTime = {};
Object.values(nodes).forEach(n => {
  const url = n.callFrame.url ? n.callFrame.url.split('/').pop() : '(native/program)';
  scriptTime[url] = (scriptTime[url] || 0) + n.selfTime;
});

console.log('\n=== TOP SCRIPTS BY CPU TIME ===');
Object.entries(scriptTime)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([url, timeUs]) => {
    console.log(`- ${url}: ${(timeUs / 1000).toFixed(1)}ms`);
  });
