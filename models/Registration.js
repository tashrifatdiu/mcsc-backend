// server/models/Registration.js
const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  supabaseId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, index: true },
  class: { type: Number, required: true, enum: [9, 10, 11, 12] },
  section: { type: String, required: true, trim: true },
  campus: { type: String, required: true, enum: ['main campus', 'permanent campus'] },
  version: { type: String, required: true, enum: ['english', 'bangla'] },
  department: { type: String, required: true, enum: ['science', 'bst', 'arts'] },
  building: { type: String, required: true, trim: true, lowercase: true },
  contactNumber: { type: String, required: true, trim: true },
  approved: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  approvedBy: { type: String, trim: true, default: null },
  approvedAt: { type: Date, default: null },
  declinedReason: { type: String, trim: true, default: null },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'club_reg'
});

module.exports = mongoose.model('Registration', RegistrationSchema);