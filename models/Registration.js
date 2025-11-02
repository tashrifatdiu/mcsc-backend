const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  eventTitle: { type: String, required: true },
  selectedActivities: { type: String, required: true },
  totalCost: { type: Number, required: true },
  status: { type: String, enum: ['Due', 'Paid'], default: 'Due' },
  uniqueCode: { type: String, required: true, unique: true },
  uniqueId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  contactNumber: { type: String, required: true },
  parentsContact: { type: String, required: true },
  whatsapp: { type: String },
  email: { type: String, required: true },
  class: { type: String, required: true },
  group: { type: String, required: true },
  version: { type: String, required: true },
  section: { type: String, required: true },
  idNo: { type: String, required: true },
  formTeacher: { type: String },
  paymentMethod: { type: String, default: 'offline' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Registration', registrationSchema);