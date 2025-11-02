const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fathers_name: { type: String, required: true },
  mothers_name: { type: String, required: true },
  present_address: { type: String, required: true },
  permanent_address: { type: String, required: true },
  dob: { type: String, required: true },
  citizenship_no: { type: String, required: true },
  mobile_no: { type: String, required: true },
  hobby: { type: String, required: true },
  campus: { type: String, required: true, enum: ['main', 'b22', 'b27', 'b7'] },
  email: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved'], default: 'Pending' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RegistrationRequest', requestSchema);