const { execSync } = require('child_process');

try {
  const out = execSync('netstat -ano | findstr :3000').toString();
  console.log('NETSTAT:\n' + out);
} catch (e) {
  console.log('Error/No process on 3000:', e.message);
}
