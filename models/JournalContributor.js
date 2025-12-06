// server/models/JournalContributor.js
const mongoose = require('mongoose');

const JournalContributorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true },
  class: { type: String, required: true, trim: true },
  section: { type: String, required: true, trim: true },
  building: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true }, // e.g., "Developer Assistant", "Content Creator"
  contribution: { type: String, required: true, trim: true }, // Description of contribution
  profileImage: { type: String, default: '' }, // URL to profile image
  order: { type: Number, default: 0 }, // Display order
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'journal_contributors'
});

module.exports = mongoose.model('JournalContributor', JournalContributorSchema);
