import fs from 'fs';

const profile = JSON.parse(fs.readFileSync('cpu_profile.json', 'utf8'));

// Build parent pointers and map
const nodeMap = new Map();
profile.nodes.forEach(n => {
  nodeMap.set(n.id, { ...n, childrenIds: n.children || [], parentId: null });
});

profile.nodes.forEach(n => {
  if (n.children) {
    n.children.forEach(cid => {
      const child = nodeMap.get(cid);
      if (child) child.parentId = n.id;
    });
  }
});

// Print call stack leading to a node
function getCallStack(nodeId) {
  const stack = [];
  let curr = nodeMap.get(nodeId);
  while (curr) {
    const fn = curr.callFrame.functionName || '(anonymous)';
    const url = curr.callFrame.url ? curr.callFrame.url.split('/').pop() : '(native)';
    const line = curr.callFrame.lineNumber;
    stack.push(`${fn} (${url}:${line})`);
    curr = nodeMap.get(curr.parentId);
  }
  return stack.reverse();
}

// Find nodes for function 'I' and 'e0'
const nodesWithI = profile.nodes.filter(n => n.callFrame.functionName === 'I' && n.callFrame.lineNumber === 3564);
console.log(`Found ${nodesWithI.length} nodes for function 'I' (checkShaderErrors):`);
nodesWithI.forEach(n => {
  console.log('--- Stack for I (id=' + n.id + ') ---');
  const stack = getCallStack(n.id);
  console.log(stack.join(' -> '));
});

const nodesWithE0 = profile.nodes.filter(n => n.callFrame.functionName === 'e0' && n.callFrame.lineNumber === 3596);
console.log(`\nFound ${nodesWithE0.length} nodes for function 'e0' (texSubImage2D):`);
nodesWithE0.forEach(n => {
  console.log('--- Stack for e0 (id=' + n.id + ') ---');
  const stack = getCallStack(n.id);
  console.log(stack.join(' -> '));
});
