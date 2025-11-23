const mongoose = require('mongoose');


const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: String, required: true }
}, { _id: true });

const ModuleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  youtube: { type: String, trim: true, default: '' },
  questions: { type: [QuestionSchema], default: [] }
}, { _id: true });

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  modules: { type: [ModuleSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'courses'
});

CourseSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Course', CourseSchema);
