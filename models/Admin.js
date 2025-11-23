// server/models/Admin.js
const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  building: { type: String, required: true, trim: true, lowercase: true },
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'admins'
});

module.exports = mongoose.model('Admin', AdminSchema);