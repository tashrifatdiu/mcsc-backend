// server/models/Journal.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

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
  // Engagement features
  likes: { type: [String], default: [] }, // Array of user IDs who liked
  comments: { type: [CommentSchema], default: [] },
  stickers: { type: Map, of: Number, default: {} }, // Map of sticker emoji to count
  engagementScore: { type: Number, default: 0, index: true }, // Calculated score for sorting
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'journals'
});

// Calculate engagement score before saving
JournalSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  
  // Calculate engagement score: likes * 1 + comments * 2 + stickers * 1.5
  const likesCount = this.likes ? this.likes.length : 0;
  const commentsCount = this.comments ? this.comments.length : 0;
  const stickersCount = this.stickers ? Array.from(this.stickers.values()).reduce((a, b) => a + b, 0) : 0;
  
  this.engagementScore = (likesCount * 1) + (commentsCount * 2) + (stickersCount * 1.5);
  
  next();
});

module.exports = mongoose.model('Journal', JournalSchema);