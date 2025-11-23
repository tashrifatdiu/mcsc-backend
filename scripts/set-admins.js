// server/scripts/set-admins.js
// One-shot script to create or reset admin accounts for all buildings.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require(path.join(__dirname, '..', 'models', 'Admin'));

const BUILDINGS = [
  'main building',
  'building 22',
  'building 27',
  'building 07',
  'project 01',
  'project 02',
  'project 03',
  'project 04',
  'project 05',
  'project 06',
  'project 07'
];

function normalizeUsername(building) {
  return 'admin_' + building.toString().trim().toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function generatePassword(len = 16) {
  const buf = crypto.randomBytes(Math.ceil(len * 1.5));
  let pw = buf.toString('base64').replace(/[+/=]/g, '').slice(0, len);
  if (!/[0-9]/.test(pw)) pw = pw.slice(0, -1) + '7';
  if (!/[!@#\$%\^&\*]/.test(pw)) pw = pw.slice(0, -1) + '!';
  return pw;
}

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('MONGO_URI not set in server/.env. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB.');

  const results = [];

  for (const building of BUILDINGS) {
    try {
      const username = normalizeUsername(building);
      const password = generatePassword(16);
      const passwordHash = await bcrypt.hash(password, 10);

      const existing = await Admin.findOne({ username });
      if (existing) {
        existing.passwordHash = passwordHash;
        existing.building = building.toString().trim().toLowerCase();
        await existing.save();
        console.log(`Updated admin: ${username}`);
      } else {
        const admin = new Admin({ username, passwordHash, building: building.toString().trim().toLowerCase() });
        await admin.save();
        console.log(`Created admin: ${username}`);
      }

      results.push({ username, building, password });
    } catch (err) {
      console.error('Error processing', building, err && err.message ? err.message : err);
    }
  }

  const outPath = path.join(__dirname, `admins-created-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2), { mode: 0o600 });
  console.log('Wrote credentials to', outPath);
  console.log('IMPORTANT: move these passwords to a secure vault and then delete this file.');

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal error:', err && err.stack ? err.stack : err);
  process.exit(1);
});