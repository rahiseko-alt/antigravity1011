const http = require('http');
const os = require('os');

const interfaces = os.networkInterfaces();
console.log('Interfaces:', Object.keys(interfaces));

['localhost', '127.0.0.1', '::1'].forEach(host => {
  const req = http.get({ host, port: 3000, timeout: 2000 }, res => {
    console.log(`Host ${host} OK, status:`, res.statusCode);
  });
  req.on('error', err => {
    console.log(`Host ${host} ERROR:`, err.message);
  });
  req.on('timeout', () => {
    console.log(`Host ${host} TIMEOUT`);
    req.destroy();
  });
});
