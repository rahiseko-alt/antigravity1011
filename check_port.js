const http = require('http');

const req = http.get('http://localhost:3000', (res) => {
  console.log('STATUS:', res.statusCode);
  process.exit(0);
});

req.on('error', (e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('TIMEOUT');
  process.exit(2);
}, 2000);
