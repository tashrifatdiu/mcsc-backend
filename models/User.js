// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  supabaseId: { type: String, required: true, unique: true, index: true },
  email: { type: String, trim: true, lowercase: true, unique: true, sparse: true }, // sparse allows null/undefined
  name: { type: String, required: true, trim: true },
  class: { type: Number, required: true, enum: [9, 10, 11, 12] },
  department: { type: String, required: true, enum: ['science', 'bst', 'arts'] },
  version: { type: String, required: true, enum: ['english', 'bangla'] },
  whatsapp: { type: String, required: true, trim: true },
  section: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'users'
});

UserSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', UserSchema);