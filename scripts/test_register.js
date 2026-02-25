const http = require('http');
const fs = require('fs');
const path = require('path');

const [,, nameArg, emailArg, passArg] = process.argv;
const registerName = nameArg || 'Test User';
const registerEmail = emailArg || 'test@example.com';
const registerPassword = passArg || 'password123';

const postData = JSON.stringify({ registerName, registerEmail, registerPassword });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/register',
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
    try {
      console.log('Response body:', JSON.parse(data));
    } catch (e) {
      console.log('Response body (raw):', data);
    }

    // Read users.json to show the stored user
    const usersPath = path.join(process.cwd(), 'users.json');
    try {
      const usersRaw = fs.readFileSync(usersPath, 'utf8');
      const users = JSON.parse(usersRaw);
      console.log('\nCurrent users.json:');
      console.log(JSON.stringify(users, null, 2));
    } catch (e) {
      console.error('Could not read users.json:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(postData);
req.end();
