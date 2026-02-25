const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const usersFile = path.join(process.cwd(), 'users.json');

if (!fs.existsSync(usersFile)) {
  console.error('users.json not found at', usersFile);
  process.exit(1);
}

const raw = fs.readFileSync(usersFile, 'utf8');
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error('failed to parse users.json:', e.message);
  process.exit(1);
}

let changed = 0;
for (const user of (data.users || [])) {
  if (user.password) {
    const salt = crypto.randomBytes(16);
    const iterations = 100000;
    const dk = crypto.pbkdf2Sync(user.password, salt, iterations, 32, 'sha256');
    user.passwordHash = `pbkdf2_sha256$${iterations}$${salt.toString('hex')}$${dk.toString('hex')}`;
    delete user.password;
    changed++;
  }
}

if (changed > 0) {
  fs.writeFileSync(usersFile, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${changed} user(s) in users.json, plaintext passwords removed.`);
} else {
  console.log('No plaintext passwords found in users.json.');
}
