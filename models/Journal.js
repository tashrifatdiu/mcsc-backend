// server/models/Journal.js
const mongoose = require('mongoose');

const JournalSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  headerSize: { type: String, enum: ['h1', 'h2', 'h3'], default: 'h2' },
  fontFamily: { type: String, trim: true, default: 'Inter, system-ui, sans-serif' },
  color: { type: String, trim: true, default: '#0f172a' },
  bodyHtml: { type: String, required: true }, // saved HTML from editor
  latexSnippets: { type: [String], default: [] }, // optional: list of latex blocks inserted
  authorSupabaseId: { type: String, required: true, index: true },
  authorEmail: { type: String, trim: true, lowercase: true },
  authorName: { type: String, trim: true },
  // Draft/publish/approval management
  isDraft: { type: Boolean, default: false, index: true },
  approved: { type: Boolean, default: false, index: true },
  approvedBy: { type: String, trim: true, default: null },
  approvedAt: { type: Date, default: null },
  publishedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'journals'
});

JournalSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Journal', JournalSchema);