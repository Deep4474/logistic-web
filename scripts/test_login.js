const http = require('http');
const fs = require('fs');
const path = require('path');

const [,, emailArg, passArg] = process.argv;
const email = emailArg || 'ayomideoluniyi49@gmail.com';
const password = passArg || 'qtfo xill gdif ommi';

const postData = JSON.stringify({ email, password });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    try { console.log('Response body:', JSON.parse(data)); } catch (e) { console.log('Response body (raw):', data); }

    // Read users.json to show updated user entry
    const usersPath = path.join(process.cwd(), 'users.json');
    try {
      const usersRaw = fs.readFileSync(usersPath, 'utf8');
      const users = JSON.parse(usersRaw);
      console.log('\nUpdated users.json:');
      console.log(JSON.stringify(users, null, 2));
    } catch (e) {
      console.error('Could not read users.json:', e.message);
    }
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write(postData);
req.end();
