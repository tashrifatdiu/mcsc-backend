const mongoose = require('mongoose');

const jacketItemSchema = new mongoose.Schema({
  jacketType: {
    type: String,
    enum: ['english', 'bangla'],
    required: true
  },
  size: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  pricePerUnit: {
    type: Number,
    required: true,
    default: 999
  }
}, { _id: false });

const jacketPreOrderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
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
  items: [jacketItemSchema],
  totalAmount: {
    type: Number,
    required: true
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
  deliveredAt: Date,
  rejectedAt: Date,
  rejectionReason: String
});

// Index for efficient user queries
jacketPreOrderSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('JacketPreOrder', jacketPreOrderSchema);
