// server/scripts/insert-test-journal.js
require('dotenv').config();
const mongoose = require('mongoose');
const Journal = require('../models/Journal');

async function main() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const j = new Journal({
    title: 'Test Pending Journal ' + Date.now(),
    headerSize: 'h2',
    fontFamily: 'Inter, system-ui, sans-serif',
    color: '#0f172a',
    bodyHtml: '<p>This is a test pending journal created by script.</p>',
    latexSnippets: [],
    authorSupabaseId: 'script-test-author-id',
    authorEmail: 'script@test.local',
    authorName: 'Scripted Author',
    isDraft: false,
    approved: false,
    approvedBy: null,
    approvedAt: null,
    publishedAt: null
  });

  const saved = await j.save();
  console.log('Inserted journal id=', saved._id);
  await mongoose.disconnect();
  console.log('Done');
}

main().catch(err => {
  console.error('Error:', err && err.stack ? err.stack : err);
  process.exit(1);
});
