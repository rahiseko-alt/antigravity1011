const { execSync } = require('child_process');

try {
  const out = execSync('powershell -Command "Get-CimInstance Win32_Process -Filter \\"ProcessId = 3944\\" | Select-Object ProcessId, Name, CommandLine | Format-List"').toString();
  console.log(out);
} catch (e) {
  console.error('Error:', e.message);
}
