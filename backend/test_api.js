const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5050,
  path: '/api/products?limit=10&skip=0',
  method: 'GET',
  headers: {
    'X-Store-Name': 'plantsingarden'
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode !== 200) {
      console.log(`Body: ${data}`);
    } else {
      const parsed = JSON.parse(data);
      console.log(`Total returned: ${parsed.data.length}`);
      if (parsed.data.length > 0) {
        console.log(`First product: ${parsed.data[0].name}`);
      }
    }
  });
});

req.on('error', e => console.error(e));
req.end();
