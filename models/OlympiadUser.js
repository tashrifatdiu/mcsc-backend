const mongoose = require('mongoose');

const olympiadUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  otp: { type: String },
  otpExpiry: { type: Date },
  profile: {
    name: { type: String },
    contactNumber: { type: String },
    school: { type: String },
    class: { type: String },
    group: { type: String },
    version: { type: String },
    section: { type: String },
    district: { type: String },
    division: { type: String },
    upazila: { type: String },
    quizAnswers: { type: Map, of: String }, // QID: Answer
    quizScore: { type: Number, default: 0 }
  },
  isRegistered: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OlympiadUser', olympiadUserSchema);