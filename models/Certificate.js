const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  searchId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  servingEvent: { type: String, required: true },
  code: { type: String, required: true },
  class: { type: String, required: true },
  hscBatch: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Certificate', CertificateSchema);