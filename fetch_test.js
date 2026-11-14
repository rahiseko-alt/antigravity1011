const http = require('http');

http.get('http://localhost:3000', (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', res.headers);
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log('BODY length:', data.length);
    console.log('BODY preview:', data.slice(0, 300));
  });
});
