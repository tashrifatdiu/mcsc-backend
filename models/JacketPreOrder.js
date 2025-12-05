const mongoose = require('mongoose');

const jacketPreOrderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userPhone: {
    type: String,
    required: true
  },
  jacketType: {
    type: String,
    enum: ['english', 'bangla'],
    required: true
  },
  size: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 950
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  bkashNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'delivered'],
    default: 'pending'
  },
  studentProfile: {
    class: Number,
    section: String,
    department: String,
    version: String
  },
  deliveryAddress: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  rejectedAt: Date,
  rejectionReason: String
});

module.exports = mongoose.model('JacketPreOrder', jacketPreOrderSchema);
