const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  class: { type: String, required: true },
  form: { type: String, required: true },
  version: { type: String, required: true },
  group: { type: String, required: true },
  mothers_name: { type: String, required: true },
  fathers_name: { type: String, required: true },
  present_address: { type: String, required: true },
  permanent_address: { type: String, required: true },
  dob: { type: String, required: true },
  citizenship_no: { type: String, required: true },
  mobile_no: { type: String, required: true },
  hobby: { type: String, required: true },
  campus: { type: String, required: true, enum: ['main', 'b22', 'b27', 'b7'] },
  email: { type: String, required: true },
  code_no: { type: String, unique: true, default: function() { return Math.floor(100000 + Math.random() * 900000).toString(); } }, // Random 6-digit "No"
  status: { type: String, enum: ['Pending', 'Approved'], default: 'Pending' },
  sl_no: { type: Number, default: 701 },
  created_at: { type: Date, default: Date.now }
});

const RegistrationRequest = mongoose.models.RegistrationRequest || mongoose.model('RegistrationRequest', requestSchema);

module.exports = RegistrationRequest;